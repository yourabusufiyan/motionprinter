import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { release } from 'os';
import { join } from 'path';
import os from 'os'
import fs from 'fs'

import axios from 'axios'
import { address } from 'ip'

import expressAppClass from './express-app'

process.env.DIST_ELECTRON = join(__dirname, '..');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, 'index.html');

const appName = app.getPath("exe");

const dir = [
  join(os.homedir(), app.getName(), "/public/"),
  join(os.homedir(), app.getName(), "/upload/pdf/"),
  join(os.homedir(), app.getName(), "/db/"),
]

dir.map(el => (!fs.existsSync(el)) && fs.mkdirSync(el, { recursive: true }))


async function createWindow() {

  if (!expressAppClass.isServerRunning) {
    expressAppClass.startServer()
  }

  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    width: 1220,
    height: 600,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
    win.setMenuBarVisibility(false)
  }

  expressAppClass.win = win;

  win.on("closed", () => {
    win = null;
    expressAppClass.shutdown();
  });


  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

ipcMain.on('ping', () => {
})

ipcMain.on('reloadDatabase', () => {
})

ipcMain.handle('version', () => app.getVersion());

ipcMain.on("searchOnlinePCs", (event) => {
  event.sender.send("eventFromMain", 'someReply');
})



// Handle file read and save
ipcMain.on('download-file', async (event, file) => {

  try {
    console.log('filePath', file)

    // Open Save Dialog
    const { canceled, filePath: savePath } = await dialog.showSaveDialog(win as BrowserWindow, {
      title: 'Save File',
      defaultPath: join(os.homedir(), 'Downloads', file.originalName),
    });

    if (canceled || !savePath) {
      event.reply('download-cancelled', file);
      return;
    }

    // Read the local file and write to the chosen location
    const readStream = fs.createReadStream(file.destination);
    const writeStream = fs.createWriteStream(savePath);

    readStream.pipe(writeStream);

    writeStream.on('finish', () => {
      event.reply('download-success', file);
    });

    writeStream.on('error', (error) => {
      event.reply('download-error', error.message, file);
    });
  } catch (error: any) {
    event.reply('download-error', error.message, file);
  }

});


ipcMain.on('convert-pdf-to-image', async (event, file) => {

});

