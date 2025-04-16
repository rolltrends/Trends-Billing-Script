const {app, BrowserWindow} = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'),
      // contextIsolation: true,
      // enableRemoteModule: false,
      nodeIntegration: true,
    },
  });

  win.loadFile(path.join(__dirname, 'build/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'win32') {
    app.quit();
  }
});