const { app, BrowserWindow, powerMonitor, ipcMain, Tray, Menu, nativeImage } = require("electron");
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
const GetShellWindow = user32.func("intptr_t __stdcall GetShellWindow()");
const GetDesktopWindow = user32.func("intptr_t __stdcall GetDesktopWindow()");
const GetClassNameW = user32.func("int __stdcall GetClassNameW(intptr_t hWnd, _Out_ char16_t *lpClassName, int nMaxCount)");
const FindWindowExW = user32.func("intptr_t __stdcall FindWindowExW(intptr_t hWndParent, intptr_t hWndChildAfter, str16 lpszClass, str16 lpszWindow)");
const EnumChildWindows = user32.func("bool __stdcall EnumChildWindows(intptr_t hWndParent, void *lpEnumFunc, intptr_t lParam)");

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

    // Check window class
    const classBuf = Buffer.alloc(512);
    const classLen = GetClassNameW(hwnd, classBuf, 256);
    const className = classLen > 0 ? classBuf.toString("utf16le").slice(0, classLen) : "";

    // Exclude taskbar, system trays, start menu, search flyout, desktop, and system overlays
    const SYSTEM_CLASSES = [
      "Shell_TrayWnd",              // Taskbar
      "Shell_SecondaryTrayWnd",    // Secondary Taskbar
      "Windows.UI.Core.CoreWindow", // Often Start Menu / Action Center / Search
      "SearchPane",
      "Progman",                    // Desktop
      "WorkerW",                    // Desktop background
      "TopLevelWindowForOverflowXamlIsland", // System trays / flyouts
      "XamlExplorerHostIslandWindow",        // Windows 11 taskbar / start flyout
      "NotifyIconOverflowWindow",
    ];

    const shellWnd = GetShellWindow();
    const desktopWnd = GetDesktopWindow();
    if (hwnd === shellWnd || hwnd === desktopWnd || SYSTEM_CLASSES.includes(className)) {
      return null;
    }

    let targetPid = pid;

    // Handle Modern / UWP Apps wrapped in ApplicationFrameHost.exe (e.g. Calculator, Settings)
    if (className === "ApplicationFrameWindow") {
      let coreChild = FindWindowExW(hwnd, 0, "Windows.UI.Core.CoreWindow", null);
      if (coreChild) {
        const childPid = [0];
        GetWindowThreadProcessId(coreChild, childPid);
        if (childPid[0] > 0 && childPid[0] !== pid) {
          targetPid = childPid[0];
        }
      }
    }

    const hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, targetPid);
    if (!hProcess) {
      return null;
    }

    try {
      const buffer = Buffer.alloc(2048);
      const sizePtr = [1024];
      if (QueryFullProcessImageNameW(hProcess, 0, buffer, sizePtr)) {
        const fullPath = koffi.decode(buffer, "char16_t", sizePtr[0]);
        if (fullPath) {
          const exeName = path.basename(fullPath).toLowerCase();

          // Exclude system/shell processes
          const SYSTEM_EXES = [
            "searchhost.exe",
            "searchapp.exe",
            "startmenuexperiencehost.exe",
            "shellexperiencehost.exe",
            "explorer.exe", // Taskbar / desktop clicks
            "textinputhost.exe",
            "lockapp.exe",
            "systemsettings.exe", // Optional, but usually users don't want Windows OS background hosts
            "applicationframehost.exe", // Fallback if UWP resolution didn't resolve to a child
          ];

          if (SYSTEM_EXES.includes(exeName)) {
            return null;
          }

          const friendly = getFriendlyNameFromPath(fullPath);
          if (
            !friendly ||
            friendly === "Dwell" ||
            friendly === "Application Frame Host" ||
            friendly === "Search application" ||
            friendly === "Windows Shell Experience Host" ||
            friendly === "Windows Explorer" ||
            friendly.includes("Microsoft® Windows® Operating System")
          ) {
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

// State for tracked application times grouped by date (YYYY-MM-DD -> Map(appName -> seconds))
const appUsageByDate = new Map();
let isSystemSleeping = false;
let isScreenLocked = false;

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayMap() {
  const today = getTodayKey();
  if (!appUsageByDate.has(today)) {
    appUsageByDate.set(today, new Map());
  }
  return appUsageByDate.get(today);
}

function loadExistingUsage() {
  appUsageByDate.clear();
  try {
    if (fs.existsSync(LOG_FILE_PATH)) {
      const content = fs.readFileSync(LOG_FILE_PATH, "utf-8");
      const lines = content.split(/\r?\n/);

      // Determine date for legacy lines that might appear before any "### DATE:" header
      let legacyDate = null;
      for (const line of lines) {
        const lastUpdatedMatch = line.match(/Last Updated:\s*([^\r\n]+)/i);
        if (lastUpdatedMatch) {
          const dateStr = lastUpdatedMatch[1].trim();
          const dmy = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
          if (dmy) {
            legacyDate = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
          } else {
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
              const y = parsed.getFullYear();
              const m = String(parsed.getMonth() + 1).padStart(2, "0");
              const d = String(parsed.getDate()).padStart(2, "0");
              legacyDate = `${y}-${m}-${d}`;
            }
          }
          break;
        }
      }

      let currentDate = legacyDate || "2026-10-26";
      let inDataSection = false;

      const IGNORED_NAMES = [
        "Dwell",
        "TOTAL TIME",
        "TODAY TOTAL",
        "Application Frame Host",
        "Search application",
        "Windows Shell Experience Host",
        "Windows Explorer",
      ];

      for (const line of lines) {
        const trimmed = line.trim();

        // Match date header: ### DATE: 2026-10-26
        const dateMatch = trimmed.match(/^###\s*DATE:\s*(\d{4}-\d{2}-\d{2})/i);
        if (dateMatch) {
          currentDate = dateMatch[1];
          if (!appUsageByDate.has(currentDate)) {
            appUsageByDate.set(currentDate, new Map());
          }
          continue;
        }

        // Header separator
        if (trimmed.startsWith("===")) {
          inDataSection = !inDataSection;
          continue;
        }

        // Only parse app lines
        const match = line.match(/^(.+?)\s*:\s*.*?\(?(\d+)\s*seconds?\)?$/i);
        if (match) {
          const appName = match[1].trim();
          const seconds = parseInt(match[2], 10);
          if (
            appName &&
            !IGNORED_NAMES.includes(appName) &&
            !appName.includes("Windows® Operating System") &&
            !appName.startsWith("Last Updated") &&
            !appName.startsWith("TODAY TOTAL") &&
            !appName.startsWith("TOTAL TIME") &&
            !isNaN(seconds)
          ) {
            if (!appUsageByDate.has(currentDate)) {
              appUsageByDate.set(currentDate, new Map());
            }
            appUsageByDate.get(currentDate).set(appName, seconds);
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

// Returns stats for any specific date
function getUsageStatsForDate(dateKey) {
  const targetDate = dateKey || getTodayKey();
  const map = appUsageByDate.get(targetDate) || new Map();
  let totalSeconds = 0;
  const apps = [];

  for (const [appName, seconds] of map.entries()) {
    totalSeconds += seconds;
    apps.push({ name: appName, seconds });
  }

  apps.sort((a, b) => b.seconds - a.seconds);

  return {
    date: targetDate,
    totalSeconds,
    totalFormatted: formatDuration(totalSeconds),
    apps,
  };
}

// Returns stats dictionary for all tracked dates
function getAllUsageStats() {
  const all = {};
  for (const [dateKey, map] of appUsageByDate.entries()) {
    let totalSeconds = 0;
    const apps = [];
    for (const [appName, seconds] of map.entries()) {
      totalSeconds += seconds;
      apps.push({ name: appName, seconds });
    }
    apps.sort((a, b) => b.seconds - a.seconds);
    all[dateKey] = {
      date: dateKey,
      totalSeconds,
      totalFormatted: formatDuration(totalSeconds),
      apps,
    };
  }
  return all;
}

// Returns stats for the current day only (resets at midnight in the app)
function getTodayUsageStats() {
  const today = getTodayKey();
  const todayStats = getUsageStatsForDate(today);
  return {
    ...todayStats,
    allStats: getAllUsageStats(),
  };
}

// Save complete log with dates to screen_time.txt
function saveUsageToFile() {
  try {
    const todayStats = getTodayUsageStats();
    const lines = [
      "==================================================",
      "                DWELL SCREEN TIME                 ",
      `Last Updated: ${new Date().toLocaleString()}`,
      `TODAY TOTAL : ${todayStats.totalFormatted} (${todayStats.totalSeconds} seconds)`,
      "==================================================",
      "",
    ];

    // Write entries ordered by date (most recent date first)
    const sortedDates = Array.from(appUsageByDate.keys()).sort().reverse();

    for (const dateKey of sortedDates) {
      const map = appUsageByDate.get(dateKey);
      if (!map || map.size === 0) continue;

      let dateTotal = 0;
      const dateApps = [];
      for (const [appName, seconds] of map.entries()) {
        dateTotal += seconds;
        dateApps.push({ name: appName, seconds });
      }
      dateApps.sort((a, b) => b.seconds - a.seconds);

      lines.push(`### DATE: ${dateKey} (Total: ${formatDuration(dateTotal)})`);
      lines.push("--------------------------------------------------");
      for (const app of dateApps) {
        lines.push(`${app.name.padEnd(30)} : ${formatDuration(app.seconds).padEnd(15)} (${app.seconds} seconds)`);
      }
      lines.push("");
    }

    fs.writeFileSync(LOG_FILE_PATH, lines.join("\n"), "utf-8");
  } catch (err) {
    console.error("Failed to write to screen_time.txt:", err);
  }
}

// Start screen time tracking loop (runs every 1 second)
function startTracking() {
  loadExistingUsage();

  let activeTrackingDate = getTodayKey();
  let ticksSinceLastSave = 0;

  function handleDateChangeIfNeeded() {
    const today = getTodayKey();
    if (today !== activeTrackingDate) {
      console.log(`[Dwell] Date change detected from ${activeTrackingDate} to ${today}`);
      activeTrackingDate = today;
      ticksSinceLastSave = 0;
      saveUsageToFile();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("screen-time-update", getTodayUsageStats());
      }
    }
  }

  // Listen to power & lock events to prevent recording fake time during sleep/lock
  powerMonitor.on("suspend", () => {
    isSystemSleeping = true;
  });
  powerMonitor.on("resume", () => {
    isSystemSleeping = false;
    handleDateChangeIfNeeded();
  });
  powerMonitor.on("lock-screen", () => {
    isScreenLocked = true;
  });
  powerMonitor.on("unlock-screen", () => {
    isScreenLocked = false;
    handleDateChangeIfNeeded();
  });

  setInterval(() => {
    // 1. Check for date change on EVERY tick (crossing midnight or system clock manual adjustment)
    handleDateChangeIfNeeded();

    // 2. Don't track if computer is suspended/sleeping or screen is locked
    if (isSystemSleeping || isScreenLocked) {
      return;
    }

    // 3. Don't track if user has been completely idle (no keyboard/mouse for > 120 seconds)
    const idleSeconds = powerMonitor.getSystemIdleTime();
    if (idleSeconds > 120) {
      return;
    }

    try {
      const displayName = getActiveProcessDisplayName();
      if (displayName) {
        const todayMap = getTodayMap();
        const current = todayMap.get(displayName) || 0;
        todayMap.set(displayName, current + 1);

        // Broadcast update to renderer UI
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("screen-time-update", getTodayUsageStats());
        }

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

let mainWindow = null;
let tray = null;
let isQuitting = false;

function showAndFocusWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
  mainWindow.focus();
}

async function createTray() {
  if (tray) return;

  let trayIcon;
  try {
    trayIcon = await app.getFileIcon(process.execPath);
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  if (tray) return;
  tray = new Tray(trayIcon);
  tray.setToolTip("Dwell");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Dwell",
      click: () => {
        showAndFocusWindow();
      }
    },
    { type: "separator" },
    {
      label: "Exit",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Left click on system tray icon opens the app
  tray.on("click", () => {
    showAndFocusWindow();
  });

  // Double click also opens the app
  tray.on("double-click", () => {
    showAndFocusWindow();
  });
}

const createWindow = () => {
  const isHiddenStartup = process.argv.includes("--hidden") || process.argv.includes("--minimized");

  mainWindow = new BrowserWindow({
    width: 1050,
    height: 700,
    minWidth: 1050,
    minHeight: 700,
    show: !isHiddenStartup,
    autoHideMenuBar: app.isPackaged,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: !app.isPackaged
    }
  });

  if (app.isPackaged) {
    Menu.setApplicationMenu(null);
    mainWindow.removeMenu();

    // Prevent keyboard shortcuts from opening DevTools in production
    mainWindow.webContents.on("before-input-event", (event, input) => {
      const isDevToolsShortcut =
        input.key === "F12" ||
        ((input.control || input.meta) && input.shift && (input.key.toLowerCase() === "i" || input.key.toLowerCase() === "j"));
      if (isDevToolsShortcut) {
        event.preventDefault();
      }
    });

    appServe(mainWindow).then(() => {
      mainWindow.loadURL("app://-");
    });
  } else {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
    let reloadTimer = null;
    mainWindow.webContents.on("did-fail-load", () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.reloadIgnoringCache();
        }
      }, 500);
    });
  }

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

const SETTINGS_FILE_PATH = path.join(app.getPath("userData"), "dwell_settings.json");

function getAppSettings() {
  const defaults = {
    startOnBoot: false,
    startMinimized: false,
    onboardingCompleted: false
  };
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Error reading app settings:", e);
  }
  return defaults;
}

function saveAppSettings(newSettings) {
  const current = getAppSettings();
  const updated = { ...current, ...newSettings };
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving app settings to disk:", e);
  }

  try {
    const args = updated.startMinimized ? ["--hidden"] : [];
    app.setLoginItemSettings({
      openAtLogin: !!updated.startOnBoot,
      path: process.execPath,
      args: args
    });
  } catch (e) {
    console.error("Error updating Windows startup settings:", e);
  }

  return updated;
}

ipcMain.handle("get-app-settings", () => {
  return getAppSettings();
});

ipcMain.handle("set-app-settings", (event, newSettings) => {
  return saveAppSettings(newSettings);
});

ipcMain.handle("get-screen-time", (event, targetDate) => {
  if (targetDate) {
    return getUsageStatsForDate(targetDate);
  }
  return getTodayUsageStats();
});

ipcMain.handle("get-all-screen-time", () => {
  return getAllUsageStats();
});

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    showAndFocusWindow();
  });

  app.on("ready", () => {
    createWindow();
    createTray();
    startTracking();
  });

  app.on("before-quit", () => {
    isQuitting = true;
    saveUsageToFile();
    if (tray) {
      tray.destroy();
      tray = null;
    }
  });

  app.on("window-all-closed", () => {
    if (isQuitting || process.platform === "darwin") {
      app.quit();
    }
  });
}