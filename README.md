# MSIX packager for Electron Apps
![electron_msix](https://github.com/bitdisaster/electron-windows-msix/assets/5191943/4321b39e-f4d8-4d2f-b6cb-78f7c27950ff)


Electron-Windows-MSIX is a module that lets you create an MSIX installer from a packaged Electron App.


### Prerequisites
 * Windows 10 or 11
 * The Windows 10 SDK you wan to target https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk
 * An understanding of MSIX packaging and AppxManifest, read more at https://learn.microsoft.com/en-us/windows/msix/package/manual-packaging-root

### Installation

```
npm install electron-windows-msix
```

This tool supports two methods to create AppX packages: Either using manual file copy operations, or using Windows Containers. The first option requires only the [Windows 10 SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk),

## Usage
Before running the Electron-Windows-Store CLI, let's make sure we have all the prerequisites in place. You will need:

```
  PACKAGING OPTIONS

  appDir            - The folder containing the packaged Electron App
  appManifest       - The AppManifest.xml containing necessary declarations to build the MSIX
  packageAssets     - Required assets declared in AppManifest.xml. E.g. icons and tile images */
  outputDir         - The output directory for the finished MSIX package.
  packageName       - Optional name for the finished MSIX package. If not provided a name will be derived from AppManifest.xml.
  windowsKitVersion - Optional version of the WindowsKit to use. If WindowsKitPath is provide then it will trump this. If neither WindowsKitVersion nor
                      WindowsKitPath is provided then the Windows Kit path will be derived from the S Version specified in AppManifest.xml.
  windowsKitPath    - An optional full path to the WindowsKit. This path will trump both WindowsKitVersion and AppxManifest.
  createPri         - Indicates whether to create Pri resource files. It is enabled by default.
  cert              - An optional path to the certificate. If not provided then the MSIX will not be signed. Beware that the Publisher of the cert
                      must match the AppxManifest Publisher.
  cert_pass         - Optionally the password for the cert.
  signParams        - Optionally an explicit set parameter for the SignTool. If present it will supersede the cert an cert_pass parameter.
  logLevel          - Optional log level. By default the module will be silent. The 'warn' level will give heads up on irregularities.
                      The 'debug' level will give extensive output to identify problems with the module.
```

#### Minimal example that derives all possible data from the Manifest
```js
packageMSIX({
    appDir: 'C:\\temp\\myapp',
    appManifest: 'C:\\temp\\AppxManifest.xml',
    packageAssets: 'C:\\temp\\assets',
    outputDir: 'C:\\temp\\out',
    cert: 'C:\\temp\\app_cert.pfx',
    cert_pass: 'hellomsix',
});
```

#### Explicit example that controls all options
```js
packageMSIX({
    appDir: 'C:\\temp\\myapp',
    appManifest: 'C:\\temp\\AppxManifest.xml',
    packageAssets: 'C:\\temp\\assets',
    outputDir: 'C:\\temp\\out',
    windowsKitPath: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.17763.0\\x64',
    createPri: false,
    cert: 'C:\\temp\\app_cert.pfx',
    cert_pass: 'hellomsix',
    packageName: 'MyApp.msix',
    logLevel: 'warn',
});
```

----
#### [MIT License (MIT)](LICENSE) | Copyright (c) Jan Hannemann.
----
