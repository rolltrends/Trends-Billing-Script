const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
  });

  // Load your built React app directly from the file system.
  mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
}

app.whenReady().then(createWindow);
