// filepath: c:\Users\rpmartinez\Downloads\Billing-Script\client\electron.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Load the React build files
  mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});