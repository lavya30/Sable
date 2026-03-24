
const { app, BrowserWindow, protocol, Menu } = require('electron')
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

const MIME_TYPES = {
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
  '.ogg': 'audio/ogg',
  '.webp': 'image/webp',
  '.map': 'application/json',
  '.txt': 'text/plain',
}

function getMimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
}

function getOutDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'out')
  }
  return path.join(__dirname, '..', 'out')
}

function createWindow() {
  const isDev = !app.isPackaged

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'out', 'icon.ico')
    : path.join(__dirname, '..', 'public', 'icon.ico')

  // Remove default menu bar
  Menu.setApplicationMenu(null)

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    autoHideMenuBar: true,
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
        filePath = filePath.replace(/[\/\\]+$/, '')
        const htmlPath = filePath + '.html'
        if (fs.existsSync(htmlPath)) {
          filePath = htmlPath
        } else {
          const indexPath = path.join(filePath, 'index.html')
          if (fs.existsSync(indexPath)) {
            filePath = indexPath
          } else {
            filePath = path.join(outDir, 'index.html')
          }
        }
      }

      if (!fs.existsSync(filePath)) {
        filePath = path.join(outDir, 'index.html')
      }

      const contentType = getMimeType(filePath)
      const stat = fs.statSync(filePath)
      const totalSize = stat.size

      // Handle Range requests (required for audio/video streaming)
      const rangeHeader = request.headers.get('Range')
      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
        if (match) {
          const start = parseInt(match[1], 10)
          const end = match[2] ? parseInt(match[2], 10) : totalSize - 1
          const chunkSize = end - start + 1
          const buffer = Buffer.alloc(chunkSize)
          const fd = fs.openSync(filePath, 'r')
          fs.readSync(fd, buffer, 0, chunkSize, start)
          fs.closeSync(fd)
          return new Response(buffer, {
            status: 206,
            headers: {
              'Content-Type': contentType,
              'Content-Range': `bytes ${start}-${end}/${totalSize}`,
              'Content-Length': String(chunkSize),
              'Accept-Ranges': 'bytes',
            },
          })
        }
      }

      return new Response(fs.readFileSync(filePath), {
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(totalSize),
          'Accept-Ranges': 'bytes',
        },
      })
    })
  }

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})