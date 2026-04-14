const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function getRendererEntryPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'client-dist', 'index.html');
  }

  return path.join(__dirname, '..', '..', 'client', 'dist', 'index.html');
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0d0d18',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: !app.isPackaged,
    },
  });

  const entryPath = getRendererEntryPath();

  if (!fs.existsSync(entryPath)) {
    dialog.showErrorBox(
      'SketchDB Desktop Error',
      'Desktop assets were not found. Build the frontend first with "npm --prefix ../client run build" and restart the app.'
    );
    app.quit();
    return;
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    dialog.showErrorBox(
      'Failed to Load SketchDB',
      `Could not load desktop UI. Error ${errorCode}: ${errorDescription}`
    );
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadFile(entryPath);
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
