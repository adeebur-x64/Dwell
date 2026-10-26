const { app, BrowserWindow, powerMonitor } = require("electron");
const serve = require("electron-serve");
const path = require("path");
const fs = require("fs");
const koffi = require("koffi");

const appServe = app.isPackaged ? serve({
  directory: path.join(__dirname, "../out")
}) : null;

const user32 = koffi.load("user32.dll");
const kernel32 = koffi.load("kernel32.dll");
const version = koffi.load("version.dll");

const OpenInputDesktop = user32.func("intptr_t __stdcall OpenInputDesktop(uint32_t dwFlags, bool fInherit, uint32_t dwDesiredAccess)");
const SetThreadDesktop = user32.func("bool __stdcall SetThreadDesktop(intptr_t hDesktop)");
const CloseDesktop = user32.func("bool __stdcall CloseDesktop(intptr_t hDesktop)");
const GetForegroundWindow = user32.func("intptr_t __stdcall GetForegroundWindow()");
const GetWindowThreadProcessId = user32.func("uint32_t __stdcall GetWindowThreadProcessId(intptr_t hWnd, _Out_ uint32_t *lpdwProcessId)");

const OpenProcess = kernel32.func("intptr_t __stdcall OpenProcess(uint32_t dwDesiredAccess, bool bInheritHandle, uint32_t dwProcessId)");
const QueryFullProcessImageNameW = kernel32.func("bool __stdcall QueryFullProcessImageNameW(intptr_t hProcess, uint32_t dwFlags, _Out_ char16_t *lpExeName, _Inout_ uint32_t *lpdwSize)");
const CloseHandle = kernel32.func("bool __stdcall CloseHandle(intptr_t hObject)");

const GetFileVersionInfoSizeW = version.func("uint32_t __stdcall GetFileVersionInfoSizeW(str16, _Out_ uint32_t *)");
const GetFileVersionInfoW = version.func("bool __stdcall GetFileVersionInfoW(str16, uint32_t, uint32_t, _Out_ uint8_t *)");

const DESKTOP_ALL = 0x01FF;
const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;

// Cache friendly names by file path to minimize disk inspection
const friendlyNameCache = new Map();

// Known common process names fallback dictionary
const KNOWN_FRIENDLY_NAMES = {
  "electron.exe": "Dwell",
  "Code.exe": "Visual Studio Code",
  "firefox.exe": "Firefox",
  "chrome.exe": "Google Chrome",
  "msedge.exe": "Microsoft Edge",
  "explorer.exe": "Windows Explorer",
  "cmd.exe": "Command Prompt",
  "powershell.exe": "PowerShell",
  "pwsh.exe": "PowerShell",
  "Discord.exe": "Discord",
  "Spotify.exe": "Spotify",
  "Slack.exe": "Slack",
  "Notion.exe": "Notion",
  "Telegram.exe": "Telegram",
};

// Extracts FileDescription or ProductName from Windows executable version resource
function getFriendlyNameFromPath(fullPath) {
  if (!fullPath) return null;
  if (friendlyNameCache.has(fullPath)) {
    return friendlyNameCache.get(fullPath);
  }

  const baseFileName = path.basename(fullPath);

  // Check known map first
  if (KNOWN_FRIENDLY_NAMES[baseFileName]) {
    const name = KNOWN_FRIENDLY_NAMES[baseFileName];
    friendlyNameCache.set(fullPath, name);
    return name;
  }

  try {
    const dummy = [0];
    const size = GetFileVersionInfoSizeW(fullPath, dummy);
    if (size) {
      const buf = Buffer.alloc(size);
      if (GetFileVersionInfoW(fullPath, 0, size, buf)) {
        const str = buf.toString("utf16le");
        for (const key of ["FileDescription", "ProductName"]) {
          const idx = str.indexOf(key);
          if (idx !== -1) {
            const sub = str.slice(idx + key.length);
            const match = sub.match(/^[^\x20-\x7E\w]*([\x20-\x7E\u00A0-\uFFFF]+?)\x00/);
            if (match && match[1] && match[1].trim()) {
              const friendly = match[1].trim();
              friendlyNameCache.set(fullPath, friendly);
              return friendly;
            }
          }
        }
      }
    }
  } catch {}

  // Clean fallback: strip .exe and capitalize
  const fallback = baseFileName.replace(/\.exe$/i, "");
  const cleanName = fallback.charAt(0).toUpperCase() + fallback.slice(1);
  friendlyNameCache.set(fullPath, cleanName);
  return cleanName;
}

// Directly gets the active foreground window process user-friendly name
function getActiveProcessDisplayName() {
  let hDesk = 0;
  try {
    hDesk = OpenInputDesktop(0, false, DESKTOP_ALL);
    if (hDesk) {
      SetThreadDesktop(hDesk);
    }

    const hwnd = GetForegroundWindow();
    if (!hwnd) {
      return null;
    }

    const pidPtr = [0];
    GetWindowThreadProcessId(hwnd, pidPtr);
    const pid = pidPtr[0];
    if (!pid || pid === process.pid) {
      // Ignore if no process or if the foreground window belongs to Dwell itself
      return null;
    }

    const hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
    if (!hProcess) {
      return null;
    }

    try {
      const buffer = Buffer.alloc(2048);
      const sizePtr = [1024];
      if (QueryFullProcessImageNameW(hProcess, 0, buffer, sizePtr)) {
        const fullPath = koffi.decode(buffer, "char16_t", sizePtr[0]);
        if (fullPath) {
          const friendly = getFriendlyNameFromPath(fullPath);
          if (friendly === "Dwell") {
            return null;
          }
          return friendly;
        }
      }
    } finally {
      CloseHandle(hProcess);
    }
  } catch (err) {
    console.error("Error detecting active process:", err);
  } finally {
    if (hDesk) {
      CloseDesktop(hDesk);
    }
  }

  return null;
}

// File to log screen time
const LOG_FILE_PATH = path.join(__dirname, "../screen_time.txt");

// State for tracked application times (fileName -> seconds)
const appUsageSeconds = new Map();
let isSystemSleeping = false;
let isScreenLocked = false;

// Load existing log file if present
function loadExistingUsage() {
  try {
    if (fs.existsSync(LOG_FILE_PATH)) {
      const content = fs.readFileSync(LOG_FILE_PATH, "utf-8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const match = line.match(/^(.+?)\s*:\s*.*?\(?(\d+)\s*seconds?\)?$/i);
        if (match) {
          const appName = match[1].trim();
          const seconds = parseInt(match[2], 10);
          if (appName && appName !== "Dwell" && !isNaN(seconds)) {
            appUsageSeconds.set(appName, seconds);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error reading existing log file:", err);
  }
}

// Format seconds into readable format (e.g. "1h 24m 10s")
function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

// Save usage map to screen_time.txt
function saveUsageToFile() {
  try {
    const sorted = Array.from(appUsageSeconds.entries()).sort((a, b) => b[1] - a[1]);
    const lines = [
      "==================================================",
      "                DWELL SCREEN TIME                 ",
      `Last Updated: ${new Date().toLocaleString()}`,
      "==================================================",
      "",
    ];

    for (const [appName, seconds] of sorted) {
      lines.push(`${appName.padEnd(30)} : ${formatDuration(seconds).padEnd(15)} (${seconds} seconds)`);
    }

    lines.push("");
    fs.writeFileSync(LOG_FILE_PATH, lines.join("\n"), "utf-8");
  } catch (err) {
    console.error("Failed to write to screen_time.txt:", err);
  }
}

// Start screen time tracking loop (runs every 1 second)
function startTracking() {
  loadExistingUsage();

  // Listen to power & lock events to prevent recording fake time during sleep/lock
  powerMonitor.on("suspend", () => {
    isSystemSleeping = true;
  });
  powerMonitor.on("resume", () => {
    isSystemSleeping = false;
  });
  powerMonitor.on("lock-screen", () => {
    isScreenLocked = true;
  });
  powerMonitor.on("unlock-screen", () => {
    isScreenLocked = false;
  });

  let ticksSinceLastSave = 0;

  setInterval(() => {
    // 1. Don't track if computer is suspended/sleeping or screen is locked
    if (isSystemSleeping || isScreenLocked) {
      return;
    }

    // 2. Don't track if user has been completely idle (no keyboard/mouse for > 120 seconds)
    const idleSeconds = powerMonitor.getSystemIdleTime();
    if (idleSeconds > 120) {
      return;
    }

    try {
      const displayName = getActiveProcessDisplayName();
      if (displayName) {
        const current = appUsageSeconds.get(displayName) || 0;
        appUsageSeconds.set(displayName, current + 1);

        ticksSinceLastSave++;
        // Write to file every 5 seconds to reduce disk I/O while keeping it fresh
        if (ticksSinceLastSave >= 5) {
          ticksSinceLastSave = 0;
          saveUsageToFile();
        }
      }
    } catch (e) {
      console.error("Tracking tick error:", e);
    }
  }, 1000);
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1050,
    height: 700,
    minWidth: 1050,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  if (app.isPackaged) {
    appServe(win).then(() => {
      win.loadURL("app://-");
    });
  } else {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
    win.webContents.on("did-fail-load", (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }
};

app.on("ready", () => {
  createWindow();
  startTracking();
});

app.on("before-quit", () => {
  saveUsageToFile();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});