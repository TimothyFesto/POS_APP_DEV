const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database.cjs');

let autoUpdater = null;
try { ({ autoUpdater } = require('electron-updater')); } catch { autoUpdater = null; }

const isDev = !app.isPackaged;
const UPDATE_OWNER = 'TimothyFesto';
const UPDATE_REPO = 'POS_APP_DEV';

function sendUpdateStatus(data) {
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send('updates:status', data);
}

function configureUpdater() {
  if (!autoUpdater || isDev) return;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.setFeedURL({ provider: 'github', owner: UPDATE_OWNER, repo: UPDATE_REPO, releaseType: 'release' });
  autoUpdater.on('checking-for-update', () => sendUpdateStatus({ state: 'checking', currentVersion: app.getVersion() }));
  autoUpdater.on('update-available', (info) => sendUpdateStatus({ state: 'available', currentVersion: app.getVersion(), version: info.version, releaseDate: info.releaseDate || '', releaseNotes: info.releaseNotes || ''}));
  autoUpdater.on('update-not-available', () => sendUpdateStatus({ state: 'up-to-date', currentVersion: app.getVersion() }));
  autoUpdater.on('download-progress', (p) => sendUpdateStatus({ state: 'downloading', version: p.version || '', percent: p.percent || 0, transferred: p.transferred || 0, total: p.total || 0, bytesPerSecond: p.bytesPerSecond || 0 }));
  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus({
      state: 'downloaded',
      currentVersion: app.getVersion(),
      version: info.version,
      releaseDate: info.releaseDate || '',
      releaseNotes: info.releaseNotes || '',
    });
  });
  autoUpdater.on('error', (error) => sendUpdateStatus({ state: 'error', message: error.message }));
}

async function checkForUpdates(interactive = false) {
  if (!autoUpdater || isDev) {
    const message = isDev
      ? 'Update checking is disabled during development.'
      : 'Automatic updates are unavailable.';

    sendUpdateStatus({
      state: 'disabled',
      message,
      currentVersion: app.getVersion(),
    });

    return { state: 'disabled', message };
  }

  try {
    sendUpdateStatus({
      state: 'checking',
      currentVersion: app.getVersion(),
    });

    const result = await autoUpdater.checkForUpdates();

    if (result?.updateInfo?.version && result.updateInfo.version !== app.getVersion()) {
      const info = result.updateInfo;

      sendUpdateStatus({
        state: 'available',
        currentVersion: app.getVersion(),
        version: info.version,
        releaseDate: info.releaseDate || '',
        releaseNotes: info.releaseNotes || '',
      });

      return {
        state: 'available',
        currentVersion: app.getVersion(),
        version: info.version,
        releaseDate: info.releaseDate || '',
        releaseNotes: info.releaseNotes || '',
      };
    }

    sendUpdateStatus({
      state: 'up-to-date',
      currentVersion: app.getVersion(),
    });

    return {
      state: 'up-to-date',
      currentVersion: app.getVersion(),
    };

  } catch (error) {
    sendUpdateStatus({
      state: 'error',
      message: error.message,
      currentVersion: app.getVersion(),
    });

    if (interactive) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Update check failed',
        message: error.message,
      });
    }

    return {
      state: 'error',
      message: error.message,
    };
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1100, minHeight: 700,
    title: 'M Generation II POS',
    icon: path.join(__dirname, '..', 'build', 'app-icon.png'),
    backgroundColor: '#1B1815', autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  if (isDev) win.loadURL('http://localhost:5173');
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

ipcMain.handle('storage:get', (_event, key) => db.get(key));
ipcMain.handle('storage:set', (_event, key, value) => { db.set(key, value); return true; });
ipcMain.handle('storage:remove', (_event, key) => { db.remove(key); return true; });
ipcMain.handle('storage:keys', () => db.listKeys());
ipcMain.handle('database:path', () => db.getDatabasePath());
ipcMain.handle('database:info', () => db.getDatabaseInfo());
ipcMain.handle('database:backup', async () => {
  const result = await dialog.showSaveDialog({
    title: 'Back up M Generation II POS database',
    defaultPath: `M-Generation-II-POS-backup-${new Date().toISOString().slice(0,10)}.sqlite`,
    filters: [{ name: 'SQLite database', extensions: ['sqlite', 'db'] }],
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  db.backup(result.filePath);
  return { canceled: false, path: result.filePath };
});
ipcMain.handle('database:restore', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Restore M Generation II POS database',
    properties: ['openFile'],
    filters: [{ name: 'SQLite database', extensions: ['sqlite', 'db'] }],
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const confirm = await dialog.showMessageBox({ type: 'warning', buttons: ['Restore', 'Cancel'], defaultId: 1, cancelId: 1, title: 'Restore database', message: 'Restore this database backup?', detail: 'Current POS data will be replaced. Make a backup first if you are unsure.' });
  if (confirm.response !== 0) return { canceled: true };
  await db.restore(result.filePaths[0]);
  return { canceled: false, path: result.filePaths[0] };
});
ipcMain.handle('updates:check', () => checkForUpdates(true));
ipcMain.handle('updates:download', async () => {
  if (!autoUpdater || isDev) {
    return {
      state: 'disabled',
      message: 'Updates are unavailable during development.',
    };
  }

  try {
    sendUpdateStatus({
      state: 'downloading',
      percent: 0,
    });

    await autoUpdater.downloadUpdate();

    return { state: 'downloaded' };
  } catch (error) {
    sendUpdateStatus({
      state: 'error',
      message: error.message,
    });

    return {
      state: 'error',
      message: error.message,
    };
  }
});
ipcMain.handle('updates:install', () => {
  if (!autoUpdater || isDev) {
    return { state: 'disabled', message: 'Updates are unavailable during development.' };
  }

  autoUpdater.quitAndInstall(false, true);
  return { state: 'installing' };
});

app.whenReady().then(async () => {
  app.setAppUserModelId('com.mgeneration2.pos');
  const databasePath = path.join(app.getPath('userData'), 'data', 'pos.sqlite');
  await db.initDatabase(databasePath);
  configureUpdater();
  createWindow();
  if (!isDev) setTimeout(() => checkForUpdates(false), 4000);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
