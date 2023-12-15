import * as fs from 'fs-extra';
import * as path from 'path';

import { log } from "./logger";
import { PackagingOptions, ProgramOptions } from "./types";

const WIN_KIT_BIN_PATH = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin';
const MAKE_PRI_EXE = 'makepri.exe';
const MAKE_APPX_EXE = 'makeappx.exe';
const SIGN_TOOL = 'SignTool.exe';

const getBinaries = async (windowsKitPath: string) => {
  const binaries = {
    makeAppx: path.join(windowsKitPath, MAKE_APPX_EXE),
    makePri: path.join(windowsKitPath, MAKE_PRI_EXE),
    signTool: path.join(windowsKitPath, SIGN_TOOL),
  };

  if(!(await fs.exists(binaries.makeAppx))) log.error(`MakeAppx binary ${MAKE_APPX_EXE} not found in:`, true, { windowsKitPath });
  if(!(await fs.exists(binaries.makePri))) log.error(`MakePri binary ${MAKE_PRI_EXE} not found in:`, true, { windowsKitPath });
  if(!(await fs.exists(binaries.signTool))) log.error(`SignTool binary ${SIGN_TOOL} not found in:`, true, { windowsKitPath });
  return binaries;
}

const ensureFolders = async (options: PackagingOptions) => {
  const outputDir = options.outputDir;
  const layoutDir = path.join(options.outputDir, 'msix_layout');

  if(await fs.exists(outputDir)) {
    log.debug('Output dir already exists. Making sure its empty.', { outputDir });
    await fs.emptyDir(outputDir, );
  } else {
    log.debug('Output dir does not exists. Creating it.');
    await fs.ensureDir(outputDir);
  }

  log.debug('Creating layout dir', { layoutDir });
    await fs.ensureDir(layoutDir);

  return { outputDir, layoutDir };
}

let manifestVariables = undefined;
const getManifestVariables = async (options: PackagingOptions) => {
  if(manifestVariables) return manifestVariables;

  const manifestXml = (await fs.readFile(options.appManifest)).toString();
  const minWinVersionRegEx = /MinVersion="(.*?)"/s;
  const appNameRegEx = /<DisplayName>(.*?)<\/DisplayName>/s;
  const archRegEx = /ProcessorArchitecture="(.*?)"/s;
  let osMinVersion;
  let appName;
  let packageArch;

  let match = manifestXml.match(minWinVersionRegEx);
  if (match) {
    osMinVersion = match[1];
  }

  match = manifestXml.match(appNameRegEx);
  if (match) {
    appName = match[1];
  }

  match = manifestXml.match(archRegEx);
  if (match) {
    packageArch = match[1];
  }

  manifestVariables = {
    osMinVersion,
    appName,
    packageArch,
  }

  return manifestVariables;
}


export const verifyOptions = async (options: PackagingOptions) => {
  log.debug('You are calling with following packaging options', options)
  if(!options.appDir) log.error('Path to application <appDir> not provided.', true);
  if(!(await fs.exists(options.appDir))) log.error('Path to application <appDir> does not exist.', true, { appDir: options.appDir });
  if(!options.appManifest) log.error('Path to application manifest <appManifest> not provided.', true);
  if(!(await fs.exists(options.appManifest))) log.error('Path to application manifest <appManifest> does not exist.', true, { appManifest: options.appManifest });
  if(!options.packageAssets) log.error('Path to packages assets <packageAssets> not provided.', true);
  if(!(await fs.exists(options.appManifest))) log.error('Path to packages assets <packageAssets> does not exist.', true, { packageAssets: options.packageAssets });
  if(!options.cert) log.warn('Path to cert <cert> not provided. Package will not be signed!');
  if(options.cert && !(await fs.exists(options.cert))) log.error('Path to cert <cert> does not exist.', true, { cert: options.cert });
  if(options.cert && !options.cert_pass) log.warn('Cert cert password <cert_pass> not provided.');
}

export const setLogLevel = (options: PackagingOptions) => {
  const { logLevel } = options;
  globalThis.SHOW_WARNINGS = logLevel === 'warn';
  globalThis.DEBUG = logLevel === 'debug';
}

export const locateMSIXTooling = async (options: PackagingOptions) => {
  const { appManifest, windowsKitVersion, windowsKitPath } = options;
  if(windowsKitPath) {
    log.debug('WindowsKitPath was provided and takes priority over WindowsKitVersion. Checking if it exists....', {windowsKitPath});
    if(await fs.pathExists(windowsKitPath)) {
      const binaries = await getBinaries(windowsKitPath);
      log.debug('WindowsKitPath exists. Getting binary paths.', binaries);
      return binaries;
    } else {
      log.error('The WindowsKitPath was provided but does not exist.', true, windowsKitPath);
    }
  } else {
    log.debug('No WindowsKitPath provided. Will try WindowsKitVersion next.');
  }

  if(windowsKitVersion) {
    log.debug('WindowsKitVersion was provided and takes priority over AppxManifest. Checking if it exists....', {windowsKitVersion});

    const windowsKitPathExec = path.join(WIN_KIT_BIN_PATH, windowsKitVersion, process.arch == 'ia32' ? 'x86' : process.arch);
    if(await fs.pathExists(windowsKitPathExec)) {
      const binaries = await getBinaries(windowsKitPathExec);
      log.debug(`WindowsKit version ${windowsKitVersion} exists. Getting binary paths.`, binaries);
      return binaries;
    }else {
      log.warn('WindowsKitVersion was provided but does not exist.', windowsKitPathExec);
    }
  } else {
    log.debug('No WindowsKitVersion provided. Will try AppxManifest.xml min OS version next.');
  }

  if(appManifest) {
    const { osMinVersion } = await getManifestVariables(options);
    if (osMinVersion) {
      const windowsKitPathExec = path.join(WIN_KIT_BIN_PATH, osMinVersion, process.arch == 'ia32' ? 'x86' : process.arch);

      if(await fs.pathExists(windowsKitPathExec)) {
        const binaries = await getBinaries(windowsKitPathExec);
        log.debug(`WindowsKit version ${windowsKitVersion} from AppxManifest exists. Getting binary paths.`, binaries);
        return binaries;
      } else {
        log.error('WindowsKitVersion read from AppManifest but WindowsKit does not exist.', true, windowsKitPathExec);
      }
    } else {
      log.error("Couldn't find Windows Kit version in AppManifest.");
    }
  }
  log.error('Unable to locate MSIX Tooling. Giving up!', true);
}

export const makeProgramOptions = async (options: PackagingOptions) => {
  manifestVariables = undefined;
  const { makeAppx, makePri, signTool } = await locateMSIXTooling(options);
  const { outputDir, layoutDir } = await ensureFolders(options);
  const { appName, packageArch } = await getManifestVariables(options);
  const msiPackageName = options.packageName || `${appName}_${packageArch}.msix`;
  const msix = path.join(outputDir, msiPackageName);
  const appManifestLayout = path.join(layoutDir, `AppxManifest.xml`);
  const assetsLayout = path.join(layoutDir, `assets`);
  const appLayout = path.join(layoutDir, `app`);
  const priConfig = path.join(layoutDir, 'priconfig.xml');
  const priFile =  path.join(layoutDir, 'resources.pri');
  const createPri = options.createPri !== undefined ? options.createPri : true;

  const program: ProgramOptions = {
    makeMsix: makeAppx,
    makePri,
    signTool,
    outputDir,
    layoutDir,
    msix,
    appDir: options.appDir,
    appLayout,
    appManifestIn: options.appManifest,
    appManifestLayout,
    assetsIn: options.packageAssets,
    assetsLayout,
    cert: options.cert,
    cert_pass: options.cert_pass,
    priConfig,
    priFile,
    createPri,
  }

  log.debug('Program options', program);
  return program;
}

export const createLayout = async (program: ProgramOptions) => {
  await fs.copyFile(program.appManifestIn, program.appManifestLayout);
  await fs.copy(program.assetsIn, program.assetsLayout);
  await fs.copy(program.appDir, program.appLayout);
}