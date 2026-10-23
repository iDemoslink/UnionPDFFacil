const { app, BrowserWindow, Menu, shell, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// Sirve la app desde app://local para que fetch/wasm/workers funcionen sin internet.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
]);

if (!app.requestSingleInstanceLock()) app.quit();

function createWindow() {
  const win = new BrowserWindow({
    width: 640,
    height: 860,
    minWidth: 380,
    minHeight: 560,
    title: 'PDF Fácil',
    backgroundColor: '#171716',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  Menu.setApplicationMenu(null);
  win.loadURL('app://local/index.html');
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    const full = path.normalize(path.join(__dirname, p));
    if (!full.startsWith(__dirname)) return new Response('Prohibido', { status: 403 });
    return net.fetch(pathToFileURL(full).toString());
  });
  createWindow();
});
app.on('window-all-closed', () => app.quit());
