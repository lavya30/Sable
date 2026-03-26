const fs = require('fs')
const path = require('path')
const ResEdit = require('resedit')

const VERSION_LANGUAGE = { lang: 1033, codepage: 1200 }

function toWindowsVersion(version) {
  const core = String(version || '0.0.0')
    .split('-')[0]
    .split('+')[0]

  const parts = core.split('.').map((part) => {
    const value = Number.parseInt(part, 10)
    if (!Number.isFinite(value)) {
      return 0
    }
    return Math.max(0, Math.min(value, 65535))
  })

  while (parts.length < 4) {
    parts.push(0)
  }

  return parts.slice(0, 4)
}

function replaceExecutableIcon(exePath, iconPath, appInfo) {
  const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true })
  const resources = ResEdit.NtExecutableResource.from(exe)
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath))
  const iconData = iconFile.icons.map((icon) => icon.data)
  const iconGroups = ResEdit.Resource.IconGroupEntry.fromEntries(resources.entries)

  if (iconGroups.length === 0) {
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(resources.entries, 101, VERSION_LANGUAGE.lang, iconData)
  } else {
    for (const group of iconGroups) {
      ResEdit.Resource.IconGroupEntry.replaceIconsForResource(resources.entries, group.id, group.lang, iconData)
    }
  }

  const versionInfoList = ResEdit.Resource.VersionInfo.fromEntries(resources.entries)
  const versionInfo = versionInfoList[0] || ResEdit.Resource.VersionInfo.createEmpty()
  const [major, minor, patch, build] = toWindowsVersion(appInfo.version)
  const fileVersion = `${major}.${minor}.${patch}.${build}`
  const exeName = path.basename(exePath)
  const stringValues = {
    FileDescription: appInfo.description || appInfo.productName,
    FileVersion: fileVersion,
    InternalName: exeName,
    OriginalFilename: exeName,
    ProductName: appInfo.productName,
    ProductVersion: fileVersion,
  }

  if (appInfo.companyName) {
    stringValues.CompanyName = appInfo.companyName
  }

  versionInfo.lang = VERSION_LANGUAGE.lang
  versionInfo.setFileVersion(major, minor, patch, build, VERSION_LANGUAGE.lang)
  versionInfo.setProductVersion(major, minor, patch, build, VERSION_LANGUAGE.lang)
  versionInfo.setStringValues(VERSION_LANGUAGE, stringValues)
  versionInfo.outputToResourceEntries(resources.entries)

  resources.outputResource(exe)

  const tempPath = `${exePath}.tmp`
  fs.writeFileSync(tempPath, Buffer.from(exe.generate()))
  fs.renameSync(tempPath, exePath)
}

async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') {
    return
  }

  const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`)
  const iconPath = path.join(context.packager.projectDir, 'public', 'icon.ico')

  if (!fs.existsSync(exePath)) {
    throw new Error(`Cannot find packaged Windows executable: ${exePath}`)
  }

  if (!fs.existsSync(iconPath)) {
    throw new Error(`Cannot find Windows icon file: ${iconPath}`)
  }

  replaceExecutableIcon(exePath, iconPath, context.packager.appInfo)
}

exports.default = afterPack
