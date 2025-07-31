const path = require('path');

const { packageMSIX } = require("../lib/index");

// packageMSIX({
//   appDir:  path.join(__dirname, '..\\test\\fixtures\\app-x64'),
//   appManifest: path.join(__dirname, '..\\test\\fixtures\\AppxManifest_x64.xml'),
//   packageAssets: path.join(__dirname, '..\\test\\fixtures\\assets'),
//   outputDir: path.join(__dirname, '..\\out\\x64'),
//   cert:  path.join(__dirname, '..\\test\\fixtures\\app_cert.pfx'),
//   cert_pass: 'hellomsix',
// });

// packageMSIX({
//   appDir:  path.join(__dirname, '..\\test\\fixtures\\app-x64'),
//   appManifest: path.join(__dirname, '..\\test\\fixtures\\AppxManifest_x64.xml'),
//   packageAssets: path.join(__dirname, '..\\test\\fixtures\\assets'),
//   outputDir: path.join(__dirname, '..\\out\\x64-signParams'),
//   signParams: [
//     '-fd',
//     'sha256',
//     '-f',
//     path.join(__dirname, '..\\test\\fixtures\\app_cert.pfx'),
//     '-p',
//     'hellomsix',
//   ],
//   logLevel: 'debug'
// });

// packageMSIX({
//   appDir:  path.join(__dirname, '..\\test\\fixtures\\app-x64'),
//   manifestVariables: {
//     publisher: 'Jan Hannemann',
//     packageIdentity: 'com.electron.myapp',
//     packageVersion: '1.42.0.0',
//     packageDisplayName: 'My App',
//     packageDescription: 'My App Description',
//     appDisplayName: 'My App Display Name',
//     appExecutable: 'HelloMSIX.exe',
//     targetArch: 'x64',
//   },
//   outputDir: path.join(__dirname, '..\\out'),
//   packageName: 'com.electron.myapp.msix',
//   logLevel: 'warn'
// });

packageMSIX({
  appDir:  path.join(__dirname, '..\\test\\fixtures\\app-x64'),
  manifestVariables: {
    publisher: 'Jan Hannemann',
    packageIdentity: 'com.electron.myapp',
    packageVersion: '1.42.0.0',
    appExecutable: 'HelloMSIX.exe',
    targetArch: 'x64',
  },
  outputDir: path.join(__dirname, '..\\out'),
});

// packageMSIX({
//     appDir:  path.join(__dirname, '..\\test\\fixtures\\app-arm64'),
//     appManifest: path.join(__dirname, '..\\test\\fixtures\\AppxManifest_arm64.xml'),
//     packageAssets: path.join(__dirname, '..\\test\\fixtures\\assets'),
//     outputDir: path.join(__dirname, '..\\out\\arm64'),
//     windowsKitVersion: '10.0.18362.0',
//     windowsKitPath: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.17763.0\\x64',
//     cert:  path.join(__dirname, '..\\test\\fixtures\\app_cert.pfx'),
//     cert_pass: 'hellomsix',
//     logLevel: 'warn',
// });

// packageMSIX({
//   appManifest: path.join(__dirname, '..\\test\\fixtures\\AppxManifest_Sparse.xml'),
//   packageAssets: path.join(__dirname, '..\\test\\fixtures\\assets'),
//   outputDir: path.join(__dirname, '..\\out\\sparse'),
//   cert:  path.join(__dirname, '..\\test\\fixtures\\app_cert.pfx'),
//   cert_pass: 'hellomsix',
//   logLevel: 'warn',
// });
