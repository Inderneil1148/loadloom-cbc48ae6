import { execFile, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

if (process.platform !== "darwin") throw new Error("Mac smoke tests require macOS.");
const appPath = path.join(process.cwd(), "desktop-release", "universal", "LoadLoom.app");
if (!existsSync(appPath)) throw new Error("Universal app is missing.");
const expected = process.arch === "arm64" ? "arm64" : "x86_64";
const archs = execFileSync("lipo", ["-archs", path.join(appPath, "Contents", "MacOS", "LoadLoom")], { encoding: "utf8" });
if (!archs.includes(expected)) throw new Error(`App does not contain ${expected}`);
const child = execFile("open", ["-W", "-n", appPath]);
await new Promise((resolve) => setTimeout(resolve, 12000));
const running = execFileSync("pgrep", ["-x", "LoadLoom"], { encoding: "utf8" }).trim();
if (!running) throw new Error("LoadLoom did not remain running.");
execFileSync("osascript", ["-e", 'tell application "LoadLoom" to quit']);
await new Promise((resolve) => child.once("exit", resolve));
console.log(`Launch smoke test passed on ${process.arch}.`);
