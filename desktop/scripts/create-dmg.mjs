import { createDMG } from "electron-installer-dmg";
import { createHash } from "node:crypto";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

if (process.platform !== "darwin") throw new Error("DMG creation requires macOS hdiutil.");
const root = process.cwd();
const out = path.join(root, "desktop-release", "dmg");
const appPath = path.join(root, "desktop-release", "universal", "LoadLoom.app");
await createDMG({
  appPath,
  name: "LoadLoom",
  title: "LoadLoom",
  out,
  overwrite: true,
  icon: path.join(root, "desktop", "assets", "loadloom.icns"),
  iconSize: 112,
  additionalDMGOptions: { "background-color": "#ffffff", window: { size: { width: 658, height: 420 } } },
  contents: [
    { x: 180, y: 215, type: "file", path: appPath },
    { x: 478, y: 215, type: "link", path: "/Applications" },
  ],
});
const generated = path.join(out, "LoadLoom.dmg");
const finalPath = path.join(out, "LoadLoom-universal.dmg");
rmSync(finalPath, { force: true });
renameSync(generated, finalPath);
const checksum = createHash("sha256").update(readFileSync(finalPath)).digest("hex");
writeFileSync(`${finalPath}.sha256`, `${checksum}  LoadLoom-universal.dmg\n`);
console.log(`DMG ready: ${finalPath}`);
