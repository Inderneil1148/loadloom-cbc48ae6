const { app, BrowserWindow, Menu, session, shell } = require("electron");
const path = require("path");

const APP_NAME = "LoadLoom";
const HOME = "https://loadloom.online";
const START_URL = `${HOME}/auth`;
const APP_ORIGINS = new Set([
  "https://loadloom.online",
  "https://www.loadloom.online",
  "https://loadloom.lovable.app",
]);
const AUTH_ORIGINS = new Set([
  "https://auth.lovable.app",
]);
let mainWindow;

function parseURL(value) {
  try { return new URL(value); } catch { return null; }
}

function isInternalURL(value) {
  const url = parseURL(value);
  return Boolean(url && (APP_ORIGINS.has(url.origin) || AUTH_ORIGINS.has(url.origin)));
}

function isSafeExternalURL(value) {
  const url = parseURL(value);
  return Boolean(url && ["https:", "mailto:"].includes(url.protocol));
}

async function openExternal(value) {
  if (isSafeExternalURL(value)) await shell.openExternal(value);
}

function buildMenu(win) {
  const template = [
    ...(process.platform === "darwin" ? [{
      label: APP_NAME,
      submenu: [
        { role: "about" }, { type: "separator" },
        { role: "services" }, { type: "separator" },
        { role: "hide" }, { role: "hideOthers" }, { role: "unhide" },
        { type: "separator" }, { role: "quit" },
      ],
    }] : []),
    {
      label: "File",
      submenu: [
        { label: "Print…", accelerator: "CmdOrCtrl+P", click: () => win.webContents.print({ printBackground: true }) },
        { type: "separator" },
        process.platform === "darwin" ? { role: "close" } : { role: "quit" },
      ],
    },
    { label: "Edit", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
    {
      label: "View",
      submenu: [
        { role: "reload" }, { type: "separator" },
        { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" },
        { type: "separator" }, { role: "togglefullscreen" },
      ],
    },
    { label: "Window", submenu: [{ role: "minimize" }, { role: "zoom" }, ...(process.platform === "darwin" ? [{ type: "separator" }, { role: "front" }] : [{ role: "close" }])] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    title: APP_NAME,
    width: 1440,
    height: 940,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: "#ffffff",
    icon: path.join(__dirname, "assets", "loadloom.png"),
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: true,
      devTools: false,
      navigateOnDragDrop: false,
    },
  });

  win.once("ready-to-show", () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternalURL(url)) return { action: "allow" };
    void openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, details) => {
    const url = typeof details === "string" ? details : details.url;
    if (!isInternalURL(url)) {
      event.preventDefault();
      void openExternal(url);
    }
  });
  win.webContents.on("will-attach-webview", (event) => event.preventDefault());
  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame && errorCode !== -3) {
      const q = new URLSearchParams({ reason: errorDescription || "LoadLoom is unavailable", target: validatedURL || START_URL });
      void win.loadFile(path.join(__dirname, "offline.html"), { search: q.toString() });
    }
  });
  win.webContents.on("before-input-event", (event, input) => {
    const modifier = input.control || input.meta;
    if (modifier && input.key.toLowerCase() === "p") {
      event.preventDefault();
      win.webContents.print({ printBackground: true });
    }
  });
  win.loadURL(START_URL);
  buildMenu(win);
  mainWindow = win;
}

app.setName(APP_NAME);
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(["clipboard-sanitized-write", "notifications"].includes(permission));
  });
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => ["clipboard-sanitized-write", "notifications"].includes(permission));
  createWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else mainWindow?.show();
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
