// Electron main process — loads the locally bundled production build.
// IMPORTANT: This MUST load dist/index.html via file:// — never the Lovable URL.
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

const isDev = !app.isPackaged && process.env.ELECTRON_DEV === "1";

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0F172A",
    title: "PipePro B31.3 Design Assistant",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Open external links (http/https) in the user's browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Block any in-app navigation away from the local bundle.
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:8080");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

// Strip the default menu (no File/Edit/View bar) for a clean standalone product feel.
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
