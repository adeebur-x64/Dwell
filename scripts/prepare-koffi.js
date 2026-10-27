const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const x64Path = path.join(__dirname, "../node_modules/@koromix/koffi-win32-x64");
const arm64Path = path.join(__dirname, "../node_modules/@koromix/koffi-win32-arm64");

const x64Exists = fs.existsSync(x64Path);
const arm64Exists = fs.existsSync(arm64Path);

if (!x64Exists || !arm64Exists) {
  console.log("[Dwell] Cross-compilation preparation: Ensuring Koffi binaries for both x64 and ARM64 are available...");
  try {
    execSync("npm install --force --no-save @koromix/koffi-win32-x64@3.3.4 @koromix/koffi-win32-arm64@3.3.4", {
      stdio: "inherit",
    });
    console.log("[Dwell] Koffi multi-architecture binaries successfully installed.");
  } catch (err) {
    console.error("[Dwell] Warning: Failed to pre-install multi-arch Koffi binaries:", err.message);
  }
} else {
  console.log("[Dwell] Koffi binaries for both x64 and ARM64 already present.");
}
