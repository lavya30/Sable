
const { app, BrowserWindow, protocol } = require('electron')
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
  // When packaged, __dirname is inside app.asar
  // The out/ folder is packed alongside electron/
  return path.join(__dirname, '..', 'out')
}

function createWindow() {
  const isDev = !app.isPackaged

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
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

      return new Response(fs.readFileSync(filePath), {
        headers: { 'Content-Type': getMimeType(filePath) },
      })
    })
  }

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.webp': 'image/webp',
    '.map': 'application/json',
    '.txt': 'text/plain',
  }
  return types[ext] || 'application/octet-stream'
}
