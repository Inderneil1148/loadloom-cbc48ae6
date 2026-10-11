import { makeUniversalApp } from "@electron/universal";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";

if (process.platform !== "darwin") throw new Error("Universal Mac builds must run on macOS.");
const root = process.cwd();
const release = path.join(root, "desktop-release");
const x64Dir = path.join(release, "x64");
const arm64Dir = path.join(release, "arm64");
const universalDir = path.join(release, "universal");
const universalApp = path.join(universalDir, "LoadLoom.app");
rmSync(release, { recursive: true, force: true });
mkdirSync(release, { recursive: true });

for (const [arch, out] of [["x64", x64Dir], ["arm64", arm64Dir]]) {
  execFileSync(process.execPath, [
    path.join(root, "node_modules", "@electron", "packager", "bin", "electron-packager.mjs"),
    path.join(root, "desktop"), "LoadLoom", "--platform=darwin", `--arch=${arch}`,
    `--out=${out}`, "--overwrite", "--asar", "--app-bundle-id=online.loadloom.desktop",
    "--app-version=1.0.0", "--build-version=1", `--icon=${path.join(root, "desktop", "assets", "loadloom.icns")}`,
  ], { stdio: "inherit" });
}

const x64App = path.join(x64Dir, "LoadLoom-darwin-x64", "LoadLoom.app");
const arm64App = path.join(arm64Dir, "LoadLoom-darwin-arm64", "LoadLoom.app");
mkdirSync(universalDir, { recursive: true });
await makeUniversalApp({ x64AppPath: x64App, arm64AppPath: arm64App, outAppPath: universalApp, force: true, mergeASARs: true });

// Sign with Developer ID when credentials are available; otherwise use ad-hoc signing for bundle integrity.
const identity = process.env.MAC_SIGNING_IDENTITY || "-";
execFileSync("codesign", ["--force", "--deep", "--options", "runtime", "--entitlements", path.join(root, "desktop", "entitlements.plist"), "--sign", identity, universalApp], { stdio: "inherit" });
execFileSync("codesign", ["--verify", "--deep", "--strict", "--verbose=2", universalApp], { stdio: "inherit" });

const binaries = [
  "Contents/MacOS/LoadLoom",
  "Contents/Frameworks/LoadLoom Helper.app/Contents/MacOS/LoadLoom Helper",
  "Contents/Frameworks/LoadLoom Helper (GPU).app/Contents/MacOS/LoadLoom Helper (GPU)",
  "Contents/Frameworks/LoadLoom Helper (Plugin).app/Contents/MacOS/LoadLoom Helper (Plugin)",
  "Contents/Frameworks/LoadLoom Helper (Renderer).app/Contents/MacOS/LoadLoom Helper (Renderer)",
];
for (const binary of binaries) {
  const file = path.join(universalApp, binary);
  if (!existsSync(file)) throw new Error(`Missing required executable: ${binary}`);
  const info = execFileSync("lipo", ["-archs", file], { encoding: "utf8" }).trim();
  if (!info.includes("x86_64") || !info.includes("arm64")) throw new Error(`${binary} is not universal: ${info}`);
  console.log(`${binary}: ${info}`);
}
cpSync(path.join(root, "desktop", "assets", "loadloom.icns"), path.join(universalApp, "Contents", "Resources", "loadloom.icns"));
console.log(`Universal app ready: ${universalApp}`);
