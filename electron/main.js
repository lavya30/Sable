
const { app, BrowserWindow, protocol, net } = require('electron')
const { pathToFileURL } = require('url')
const path = require('path')
const fs = require('fs')

// Register custom protocol before app is ready (Electron requirement)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
])

function getOutDir() {
  if (app.isPackaged) {
    // out/ is unpacked via asarUnpack, so it lives at app.asar.unpacked/out/
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'out')
  }
  return path.join(__dirname, '..', 'out')
}

function createWindow() {
  const isDev = !app.isPackaged

  const iconPath = app.isPackaged
    ? path.join(__dirname, '..', 'out', 'icon.png')
    : path.join(__dirname, '..', 'public', 'icon.png')

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:3000')
    win.webContents.openDevTools()
  } else {
    win.loadURL('app://./index.html')
  }
}

app.whenReady().then(() => {
  if (!app.isPackaged) {
    // In dev mode, no custom protocol needed
  } else {
    const outDir = getOutDir()

    protocol.handle('app', (request) => {
      const url = new URL(request.url)
      let pathname = decodeURIComponent(url.pathname)

      // Remove leading slash on Windows
      if (pathname.startsWith('/')) pathname = pathname.slice(1)

      let filePath = path.join(outDir, pathname)

      // If path has no extension, try serving the .html file (for routes like /editor)
      if (!path.extname(filePath)) {
        // Remove trailing slash
        filePath = filePath.replace(/[\/\\]+$/, '')
        const htmlPath = filePath + '.html'
        if (fs.existsSync(htmlPath)) {
          filePath = htmlPath
        } else {
          const indexPath = path.join(filePath, 'index.html')
          if (fs.existsSync(indexPath)) {
            filePath = indexPath
          } else {
            // Fallback to index.html for client-side routing
            filePath = path.join(outDir, 'index.html')
          }
        }
      }

      if (!fs.existsSync(filePath)) {
        filePath = path.join(outDir, 'index.html')
      }

      // Use net.fetch with file:// URL — handles byte-range requests for audio/video
      return net.fetch(pathToFileURL(filePath).href)
    })
  }

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})