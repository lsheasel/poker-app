const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,   // Hier kannst du die Standardgröße ändern, falls gewünscht
    height: 800,   // Hier auch
    icon: path.join(__dirname, 'assets', 'icon.ico'), // Dein Icon
    fullscreen: true,  // Fenster im Vollbildmodus öffnen
    webPreferences: {
      nodeIntegration: false,  // Deaktiviert Node.js-Integration im Renderer
      contextIsolation: true,  // Stellt sicher, dass der Renderer keine globalen Node-Objekte hat
      sandbox: true,           // Aktiviert Sandbox
    },
  });

  // Lade die externe Webseite
  win.loadURL('https://poker4fun.xyz/');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
