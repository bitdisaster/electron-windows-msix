import * as fs from 'fs-extra'
import {
  log
} from '../../src/logger';
import {
  expect,
  describe,
  it,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll
} from 'vitest'
import {
  removeFileExtension,
  removePublisherPrefix,
  ensureFolders,
  verifyOptions,
  locateMSIXTooling,
  setLogLevel,
  makeProgramOptions,
  createLayout,
  getBinaries
} from '../../src/utils';
import {
  ManifestVariables,
  PackagingOptions,
  ProgramOptions
} from '../../src/types';
import { getCertPublisher } from '../../src/msix';
import path from 'path';

let originalProcessorArchitecture = process.env.PROCESSOR_ARCHITECTURE;
const overrideProcessorArchitecture = (arch: string) => {
  process.env.PROCESSOR_ARCHITECTURE = arch;
}
const restoreProcessorArchitecture = () => {
  process.env.PROCESSOR_ARCHITECTURE = originalProcessorArchitecture;
}

const incompletePackagingOptions: PackagingOptions = {
  appDir: 'C:\\app',
  outputDir: 'C:\\out',
}

const minimalPackagingOptions: PackagingOptions = {
  appDir: 'C:\\app',
  outputDir: 'C:\\out',
  manifestVariables: {
    publisher: 'Electron',
    packageIdentity: 'com.electron.windows.msix',
    packageVersion: '1.0.0.0',
    appExecutable: 'app.exe',
    targetArch: 'x64',
  }
}

vi.mock('../../src/logger');
vi.mock('../../src/msix');
vi.mock('fs-extra', async (importOriginal) => {
  const actual = await importOriginal() as Record < string,
    any > ;
  return {
    exists: vi.fn().mockReturnValue(true),
    emptyDir: vi.fn(),
    ensureDir: vi.fn(),
    pathExists: vi.fn().mockReturnValue(true),
    readFileSync: actual.readFileSync,
    readFile: actual.readFile,
    writeFile: vi.fn(),
    copy: vi.fn(),
  };
});


describe('utils', () => {
  beforeAll(() => {
    overrideProcessorArchitecture('x64');
  });
  afterAll(() => {
    restoreProcessorArchitecture();
  });
  afterEach(() => {
    restoreProcessorArchitecture();
  });

  describe('getBinaries', () => {
    it('should return the binaries', async () => {
      const binaries = await getBinaries('C:\\Program Files (x86)\\Windows Kits\\10\\bin');
      expect(binaries).toBeDefined();
      expect(binaries.makeAppx).toBe('C:\\Program Files (x86)\\Windows Kits\\10\\bin\\makeappx.exe');
      expect(binaries.makePri).toBe('C:\\Program Files (x86)\\Windows Kits\\10\\bin\\makepri.exe');
      expect(binaries.signTool).toBe('C:\\Program Files (x86)\\Windows Kits\\10\\bin\\SignTool.exe');
      expect(binaries.makeCert).toBe('C:\\Program Files (x86)\\Windows Kits\\10\\bin\\makecert.exe');
    });

    it('should throw an error if the binaries are not found', async () => {
      vi.mocked(fs.exists).mockResolvedValue(false as any);
      await getBinaries('C:\\Program Files (x86)\\Windows Kits\\10\\bin');
      expect(log.error).toHaveBeenCalledWith('MakeAppx binary makeappx.exe not found in:', true, { windowsKitPath: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin' });
      expect(log.error).toHaveBeenCalledWith('MakePri binary makepri.exe not found in:', true, { windowsKitPath: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin' });
      expect(log.error).toHaveBeenCalledWith('SignTool binary SignTool.exe not found in:', true, { windowsKitPath: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin' });
      expect(log.error).toHaveBeenCalledWith('MakeCert binary makecert.exe not found in:', true, { windowsKitPath: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin' });
    });
  });

  describe('removeFileExtension', () => {
    it('should remove file extension correctly', () => {
      expect(removeFileExtension('HelloMSIX.exe')).toBe('HelloMSIX');
    });

    it('should remove file extension correctly with multiple dots', () => {
      expect(removeFileExtension('HelloMSIX.blabla.exe')).toBe('HelloMSIX.blabla');
    });

    it('should return the same string if no extension is present', () => {
      expect(removeFileExtension('HelloMSIX')).toBe('HelloMSIX');
    });
  });

  describe('removePublisherPrefix', () => {
    it('should remove publisher prefix correctly', () => {
      expect(removePublisherPrefix('CN=Electron')).toBe('Electron');
    });

    it('should return the same string if no prefix is present', () => {
      expect(removePublisherPrefix('Electron')).toBe('Electron');
    });
  });

  describe('ensureFolders', async () => {
    beforeEach(() => {
      vi.mocked(fs.ensureDir).mockClear();
      vi.mocked(fs.emptyDir).mockClear();
    });

    it('should empty output dir if it exists', async () => {
      vi.mocked(fs.exists).mockResolvedValue(true as any);
      const {
        outputDir,
        layoutDir
      } = await ensureFolders(minimalPackagingOptions);
      expect(fs.emptyDir).toHaveBeenCalledWith('C:\\out');

      expect(fs.ensureDir).toHaveBeenCalledTimes(1);
      expect(fs.ensureDir).toHaveBeenCalledWith('C:\\out\\msix_layout');

      expect(outputDir).toBe('C:\\out');
      expect(layoutDir).toBe('C:\\out\\msix_layout');
    });

    it('should create output dir if it does not exist', async () => {
      vi.mocked(fs.exists).mockResolvedValue(false as any);
      const {
        outputDir,
        layoutDir
      } = await ensureFolders(minimalPackagingOptions);

      expect(fs.emptyDir).toHaveBeenCalledTimes(0);
      expect(fs.ensureDir).toHaveBeenCalledTimes(2);
      expect(fs.ensureDir).toHaveBeenCalledWith('C:\\out');
      expect(fs.ensureDir).toHaveBeenCalledWith('C:\\out\\msix_layout');

      expect(outputDir).toBe('C:\\out');
      expect(layoutDir).toBe('C:\\out\\msix_layout');
    });
  });

  describe('verifyOptions', () => {
    beforeEach(() => {
      vi.mocked(log.error).mockClear();
      vi.mocked(log.warn).mockClear();
      vi.mocked(fs.exists).mockClear();
    });

    describe('manifest variables', () => {
      it('should throw an error if no app manifest nor manifest variables are provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
        }
        await verifyOptions(packagingOptions);
        expect(log.error).toHaveBeenCalledWith('Neither app manifest <appManifest> nor manifest variables <manifestVariables> provided.', true);
      });

      it('should throw an error if no package version is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: { } as any
        }
        await verifyOptions(packagingOptions);
        expect(log.error).toHaveBeenCalledWith('Neither package version <packageVersion> nor app manifest <appManifest> provided.', true);
      });

      it('should throw an error if package version is not a valid version', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: 'not a version',
          } as any
        }
        await verifyOptions(packagingOptions);
        expect(log.error).toHaveBeenCalledWith('Package version <packageVersion> is not a semantic version.', true, { packageVersion: 'not a version' });
      });

      it('should throw an error if no publisher is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: '1.0.0',
          } as any
        }
        await verifyOptions(packagingOptions);
        expect(log.error).toHaveBeenCalledWith('Neither publisher <publisher> nor app manifest <appManifest> provided.', true);
      });

      it('should throw an error if no app executable is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: '1.0.0',
            publisher: 'Electron',
          } as any
        }
        await verifyOptions(packagingOptions);
        expect(log.error).toHaveBeenCalledWith('Neither app executable <appExecutable> nor app manifest <appManifest> provided.', true);
      });

      it('should throw an error if no target architecture is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: '1.0.0',
            publisher: 'Electron',
            appExecutable: 'C:\\app\\app.exe',
          } as any
        }
        await verifyOptions(packagingOptions);
        expect(log.error).toHaveBeenCalledWith('Neither target architecture <targetArch> nor app manifest <appManifest> provided.', true);
      });

      it('should throw an error if no package identity is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: '1.0.0',
            publisher: 'Electron',
            appExecutable: 'C:\\app\\app.exe',
            targetArch: 'x64',
          } as any
        }
        await verifyOptions(packagingOptions);
        expect(log.error).toHaveBeenCalledWith('Neither package identity <packageIdentity> nor app manifest <appManifest> provided.', true);
      });

      it('should warn if no publisher display name is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: '1.0.0',
            publisher: 'Electron',
            appExecutable: 'C:\\app\\app.exe',
            targetArch: 'x64',
            packageIdentity: 'Electron.App',
          } as any
        }
        vi.mocked(fs.exists).mockResolvedValue(true as any);
        await verifyOptions(packagingOptions);
        expect(log.warn).toHaveBeenCalledWith('Neither publisher display name <publisherDisplayName> nor app manifest <appManifest> provided. Using publisher as display name.');
      });

      it('should warn if no package display name is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: '1.0.0',
            publisher: 'Electron',
            appExecutable: 'C:\\app\\app.exe',
            targetArch: 'x64',
            packageIdentity: 'Electron.App',
            publisherDisplayName: 'Electron',
          } as any
        }
        vi.mocked(fs.exists).mockResolvedValue(true as any);
        await verifyOptions(packagingOptions);
        expect(log.warn).toHaveBeenCalledWith('Neither package display name <packageDisplayName> nor app manifest <appManifest> provided. Using app executable as display name.');
      });

      it('should warn if no packageMinOSVersion is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: '1.0.0',
            publisher: 'Electron',
            appExecutable: 'C:\\app\\app.exe',
            targetArch: 'x64',
            packageIdentity: 'Electron.App',
            publisherDisplayName: 'Electron',
          } as any
        }
        vi.mocked(fs.exists).mockResolvedValue(true as any);
        await verifyOptions(packagingOptions);
        expect(log.warn).toHaveBeenCalledWith('Neither package min OS version <packageMinOSVersion> nor app manifest <appManifest> provided. Using default OS version 10.0.14393.0.');
      });

      it('should warn if no packageMaxOSVersionTested is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: '1.0.0',
            publisher: 'Electron',
            appExecutable: 'C:\\app\\app.exe',
            targetArch: 'x64',
            packageIdentity: 'Electron.App',
            publisherDisplayName: 'Electron',
            packageMinOSVersion: '10.0.14393.0',
          } as any
        }
        vi.mocked(fs.exists).mockResolvedValue(true as any);
        await verifyOptions(packagingOptions);
        expect(log.warn).toHaveBeenCalledWith('Neither package max OS version tested <packageMaxOSVersionTested> nor app manifest <appManifest> provided. Using default OS version 10.0.14393.0.');
      });

      it('should warn if no appDisplayName is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: '1.0.0',
            publisher: 'Electron',
            appExecutable: 'C:\\app\\app.exe',
            targetArch: 'x64',
            packageIdentity: 'Electron.App',
            publisherDisplayName: 'Electron',
            packageMinOSVersion: '10.0.14393.0',
            packageMaxOSVersionTested: '10.0.14393.0',
          } as any
        }
        vi.mocked(fs.exists).mockResolvedValue(true as any);
        await verifyOptions(packagingOptions);
        expect(log.warn).toHaveBeenCalledWith('Neither app display name <appDisplayName> nor app manifest <appManifest> provided. Using app executable as display name.');
      });

      it('should warn if no packageDescription is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: '1.0.0',
            publisher: 'Electron',
            appExecutable: 'C:\\app\\app.exe',
            targetArch: 'x64',
            packageIdentity: 'Electron.App',
            publisherDisplayName: 'Electron',
            packageMinOSVersion: '10.0.14393.0',
            packageMaxOSVersionTested: '10.0.14393.0',
            appDisplayName: 'Electron',
          } as any
        }
        vi.mocked(fs.exists).mockResolvedValue(true as any);
        await verifyOptions(packagingOptions);
        expect(log.warn).toHaveBeenCalledWith('Neither package description <packageDescription> nor app manifest <appManifest> provided. Using app executable as description.');
      });

      it('should warn if no packageBackgroundColor is provided', async () => {
        const packagingOptions: PackagingOptions = {
          ...incompletePackagingOptions,
          manifestVariables: {
            packageVersion: '1.0.0',
            publisher: 'Electron',
            appExecutable: 'C:\\app\\app.exe',
            targetArch: 'x64',
            packageIdentity: 'Electron.App',
            publisherDisplayName: 'Electron',
            packageMinOSVersion: '10.0.14393.0',
            packageMaxOSVersionTested: '10.0.14393.0',
            appDisplayName: 'Electron',
            packageDescription: 'Electron',
          } as any
        }
        vi.mocked(fs.exists).mockResolvedValue(true as any);
        await verifyOptions(packagingOptions);
        expect(log.warn).toHaveBeenCalledWith('Neither package background color <packageBackgroundColor> nor app manifest <appManifest> provided. Using default background color transparent.');
      });
    });

    it('should not throw an error or warning if all manifest variables are provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        packageAssets: 'C:\\assets',
        cert: 'C:\\cert.pfx',
        cert_pass: '123456',
        manifestVariables: {
          packageVersion: '1.0.0',
          packageDisplayName: 'Electron',
          packageDescription: 'package description',
          packageBackgroundColor: 'transparent',
          publisher: 'Electron',
          appExecutable: 'C:\\app\\app.exe',
          targetArch: 'x64',
          packageIdentity: 'Electron.App',
          publisherDisplayName: 'Electron',
          packageMinOSVersion: '10.0.14393.0',
          packageMaxOSVersionTested: '10.0.14393.0',
          appDisplayName: 'app display name',
        } as any
      }

      vi.mocked(fs.exists).mockResolvedValue(true as any);
      vi.mocked(getCertPublisher).mockResolvedValue('CN=Electron');
      await verifyOptions(packagingOptions);
      expect(log.error).not.toHaveBeenCalled();
      expect(log.warn).not.toHaveBeenCalled();
    });

    it('should not throw an error or warning if valid manifest is provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        cert: 'C:\\cert.pfx',
        cert_pass: '123456',
        packageAssets: 'C:\\assets',
        appManifest: 'C:\\app\\app.manifest',
      }

      const manifestVariables : ManifestVariables =  {
        manifestOsMinVersion: '10.0.14393.0',
        manifestAppName: 'app',
        manifestPackageArch: 'x64',
        manifestIsSparsePackage: false,
        manifestPublisher: 'Electron'
      }

      vi.mocked(fs.exists).mockResolvedValue(true as any);
      vi.mocked(getCertPublisher).mockResolvedValue('Electron');
      await verifyOptions(packagingOptions, manifestVariables);
      expect(log.error).not.toHaveBeenCalled();
      expect(log.warn).not.toHaveBeenCalled();
    });

    it('should throw an error if no app manifest is provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
      }
      await verifyOptions(packagingOptions);
      expect(log.error).toHaveBeenCalledWith('Neither app manifest <appManifest> nor manifest variables <manifestVariables> provided.', true);
    });

    it('should throw an error if app manifest does not exist', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
      }
      vi.mocked(fs.exists).mockResolvedValue(false as any);
      await verifyOptions(packagingOptions);
      expect(log.error).toHaveBeenCalledWith('Path to application manifest <appManifest> does not exist.', true, { appManifest: 'C:\\app\\app.manifest' });
    });

    it('should throw an error if app dir is not provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
      }
      delete packagingOptions.appDir;
      vi.mocked(fs.exists).mockResolvedValueOnce(true as any);
      await verifyOptions(packagingOptions, { manifestIsSparsePackage: false } as any);
      expect(log.error).toHaveBeenCalledWith('Path to application <appDir> not provided.', true);
    });

    it('should throw an error if app dir does not exist', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
      }
      vi.mocked(fs.exists).mockResolvedValueOnce(true as any).mockResolvedValueOnce(false as any);
      await verifyOptions(packagingOptions, { manifestIsSparsePackage: false } as any);
      expect(log.error).toHaveBeenCalledWith('Path to application <appDir> does not exist.', true, { appDir: 'C:\\app' });
    });

    it('should warn if no package assets is provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
        packageAssets: undefined
      } as any
      await verifyOptions(packagingOptions, { manifestIsSparsePackage: false } as any);
      expect(log.warn).toHaveBeenCalledWith('Path to packages assets <packageAssets> not provided, using default assets.');
    });

    it('should throw an error if package assets does not exist', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
        packageAssets: 'C:\\assets',
      } as any
      vi.mocked(fs.exists)
        .mockResolvedValueOnce(true as any)
        .mockResolvedValueOnce(true as any)
        .mockResolvedValueOnce(false as any );
      await verifyOptions(packagingOptions, { manifestIsSparsePackage: false } as any);
      expect(log.error).toHaveBeenCalledWith('Path to packages assets provided but <packageAssets> does not exist.', true, { packageAssets: 'C:\\assets' });
    });

    it('should warn if cert is not provided but cert_pass is', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
        packageAssets: 'C:\\assets',
        cert_pass: '123456',
      } as any
      await verifyOptions(packagingOptions, { manifestIsSparsePackage: false } as any);
      expect(log.warn).toHaveBeenCalledWith('Path to cert <cert> not provided. A dev cert will be created with the provided password and the package will be signed with it!');
    });

    it('should warn if cert and cert_pass are not provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
        packageAssets: 'C:\\assets',
      } as any
      await verifyOptions(packagingOptions, { manifestIsSparsePackage: false } as any);
      expect(log.warn).toHaveBeenCalledWith('Path to cert <cert> and cert password <cert_pass> not provided. A dev cert will be created and the package will be signed with it!');
    });


    it('should throw an error if cert and explicit signParams are provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
        packageAssets: 'C:\\assets',
        cert: 'C:\\cert.pfx',
        signParams: ['/f', 'C:\\cert.pfx', '/p', '123456']
      } as any
      vi.mocked(getCertPublisher).mockResolvedValue('Electron');
      await verifyOptions(packagingOptions, { manifestIsSparsePackage: false } as any);
      expect(log.warn).toHaveBeenCalledWith('Path to cert <cert> and custom signParams provided. signParams will take priority!');
    });

    it('should warn if cert and signParams are provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
        cert: 'C:\\cert.pfx',
        signParams: ['/f', 'C:\\cert.pfx', '/p', '123456']
      } as any
      vi.mocked(getCertPublisher).mockResolvedValue('Electron');
      await verifyOptions(packagingOptions, { manifestIsSparsePackage: false } as any);
      expect(log.warn).toHaveBeenCalledWith('Path to cert <cert> and custom signParams provided. signParams will take priority!');
    });

    it('should throw an error if cert does not exist', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
        cert: 'C:\\cert.pfx',
      } as any
      vi.mocked(fs.exists)
        .mockResolvedValueOnce(true as any)
        .mockResolvedValueOnce(true as any)
        .mockResolvedValueOnce(false as any);

      await verifyOptions(packagingOptions, { manifestIsSparsePackage: false } as any);
      expect(log.error).toHaveBeenCalledWith('Path to cert <cert> does not exist.', true, { cert: 'C:\\cert.pfx' });
    });

    it('should warn if now cert password is provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
        cert: 'C:\\cert.pfx',
      } as any

      await verifyOptions(packagingOptions, { manifestIsSparsePackage: false } as any);
      expect(log.warn).toHaveBeenCalledWith('Cert cert password <cert_pass> not provided.');
    });

    it('should not throw an error if the publisher prefix is missing in the manifest variables but matches the publisher of the cert', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        manifestVariables: {
          publisher: 'Electron',
          packageIdentity: 'Electron.App',
          packageVersion: '1.0.0',
          appExecutable: 'C:\\app\\app.exe',
          targetArch: 'x64',
        },
        cert: 'C:\\cert.pfx',
        cert_pass: '123456',
      } as any
      vi.mocked(fs.exists).mockResolvedValue(true as any);
      vi.mocked(getCertPublisher).mockResolvedValue('CN=Electron');
      await verifyOptions(packagingOptions);
      expect(log.error).not.toHaveBeenCalled();
    });

    it('should throw an error if the publisher prefix is missing in the manifest and does not match the publisher of the cert', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
        cert: 'C:\\cert.pfx',
        cert_pass: '123456',
      } as any
      vi.mocked(getCertPublisher).mockResolvedValue('CN=Electron');
      await verifyOptions(packagingOptions, { manifestPublisher: 'Electron' } as any);
      expect(log.error).toHaveBeenCalledWith('The publisher in the manifest must match the publisher of the cert', false, {manifest_publisher: 'Electron', cert_publisher: 'CN=Electron'});
    });


    it('should throw an error if the publisher in the manifest does not match the publisher of the cert', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        appManifest: 'C:\\app\\app.manifest',
        cert: 'C:\\cert.pfx',
        cert_pass: '123456',
      } as any
      vi.mocked(getCertPublisher).mockResolvedValue('Electron');
      await verifyOptions(packagingOptions, { manifestPublisher: 'NotElectron' } as any);
      expect(log.error).toHaveBeenCalledWith('The publisher in the manifest must match the publisher of the cert', false, {manifest_publisher: 'NotElectron', cert_publisher: 'Electron'});
    });

    it('should throw an error if the publisher in the manifest variables does not match the publisher of the cert', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
        cert: 'C:\\cert.pfx',
        cert_pass: '123456',
        manifestVariables: {
          packageVersion: '1.0.0',
          publisher: 'Electron',
          appExecutable: 'C:\\app\\app.exe',
          targetArch: 'x64',
          packageIdentity: 'Electron.App',
        } as any
      } as any
      vi.mocked(getCertPublisher).mockResolvedValue('Electron');
      await verifyOptions(packagingOptions, { manifestPublisher: 'NotElectron' } as any);
      expect(log.error).toHaveBeenCalledWith('The publisher in the manifest must match the publisher of the cert', false, {manifest_publisher: 'NotElectron', cert_publisher: 'Electron'});
    });
  });

  describe('setLogLevel', () => {
    it('should set the log level to debug', () => {
      setLogLevel({ logLevel: 'debug' } as any);
      expect(globalThis.SHOW_WARNINGS).toBe(false);
      expect(globalThis.DEBUG).toBe(true);
    });

    it('should set the log level to warn', () => {
      setLogLevel({ logLevel: 'warn' } as any);
      expect(globalThis.SHOW_WARNINGS).toBe(true);
      expect(globalThis.DEBUG).toBe(false);
    });
  });

  describe('locateMSIXTooling', () => {
    beforeEach(() => {
      vi.mocked(log.warn).mockClear();
    });

    it('should find binaries in the windows kit path if provided and it exists', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        windowsKitPath: 'C:\\windowskit',

      }
      vi.mocked(fs.exists).mockResolvedValue(true as any);
      const binaries = await locateMSIXTooling(packagingOptions);
      expect(binaries).toBeDefined();
      expect(binaries).toStrictEqual({
        makeAppx: 'C:\\windowskit\\makeappx.exe',
        makePri: 'C:\\windowskit\\makepri.exe',
        makeCert: 'C:\\windowskit\\makecert.exe',
        signTool: 'C:\\windowskit\\SignTool.exe'});
   });

    it('should throw an error if the windows kit path is provided but does not exist', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        windowsKitPath: 'C:\\windowskit',
        manifestVariables: {
          targetArch: 'x64',
        } as any
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(false as any)
      await locateMSIXTooling(packagingOptions)
      expect(log.error).toHaveBeenCalledWith('The WindowsKitPath was provided but does not exist.', true, 'C:\\windowskit');
    });

    it('should log a debug message if the windows kit path is not provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        manifestVariables: {
          targetArch: 'x64',
        } as any
      }
      await locateMSIXTooling(packagingOptions)
      expect(log.debug).toHaveBeenCalledWith('No WindowsKitPath provided. Will try WindowsKitVersion next.');
    });

    it('should return the binaries from the windows kit version if it exists', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        windowsKitVersion: '10.0.14393.42',
        manifestVariables: {
          targetArch: 'x64',
        } as any      }

      const binaries = await locateMSIXTooling(packagingOptions);
      expect(binaries).toStrictEqual({
        makeAppx: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\makeappx.exe',
        makePri: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\makepri.exe',
        makeCert: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\makecert.exe',
        signTool: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\SignTool.exe'});
    });

    it('should throw an error if the windows kit version is provided but does not exist', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        windowsKitVersion: '10.0.14393.42',
        manifestVariables: {
          targetArch: 'x64',
        } as any
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(false as any)
      await locateMSIXTooling(packagingOptions)
      expect(log.error).toHaveBeenCalledWith('WindowsKitVersion was provided but does not exist.', true, 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64');
    });

    it('should log a debug message if the windows kit version is not provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        manifestVariables: {
          targetArch: 'x64',
        } as any
      }
      await locateMSIXTooling(packagingOptions)
      expect(log.debug).toHaveBeenCalledWith('No WindowsKitVersion provided. Will try AppxManifest.xml min OS version next.');
    });

    it('should return x64 binaries if the target arch is arm64 and the windows kit version is older than 10.0.22621.0', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        windowsKitVersion: '10.0.14393.42',
      }
      overrideProcessorArchitecture('ARM64');

      const binaries = await locateMSIXTooling(packagingOptions);
      expect(binaries).toStrictEqual({
        makeAppx: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\makeappx.exe',
        makePri: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\makepri.exe',
        makeCert: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\makecert.exe',
        signTool: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\SignTool.exe'});
    });

    it('should return binaries derived from the manifest variables if the windows kit version and path is not provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        appManifest: 'C:\\app\\app.manifest'
      }

      const binaries = await locateMSIXTooling(packagingOptions, { manifestOsMinVersion: '10.0.22621.0', manifestPackageArch: 'x64' } as any);
      expect(binaries).toStrictEqual({
        makeAppx: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\makeappx.exe',
        makePri: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\makepri.exe',
        makeCert: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\makecert.exe',
        signTool: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\SignTool.exe'});
    });

    it('should throw an error if windows kit version derived from the manifest variables does not exist ', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        appManifest: 'C:\\app\\app.manifest'
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(false as any)
      await locateMSIXTooling(packagingOptions, { manifestOsMinVersion: '10.0.22621.0', manifestPackageArch: 'x64' } as any);
      expect(log.error).toHaveBeenCalledWith('WindowsKitVersion read from AppManifest but WindowsKit does not exist.', true, 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64');
    });

    it('should throw an error if the manifest variables do not contain a windows kit version', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
         appManifest: 'C:\\app\\app.manifest'
      }
      await locateMSIXTooling(packagingOptions, { manifestPackageArch: 'arm64' } as any);
      expect(log.error).toHaveBeenCalledWith("Couldn't find Windows Kit version in AppManifest.");
    });

    it('should return x64 binaries if the target arch is arm64 and the windows kit version is older than 10.0.22621.0', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        appManifest: 'C:\\app\\app.manifest'
      }
      overrideProcessorArchitecture('ARM64');
      const binaries = await locateMSIXTooling(packagingOptions, { manifestOsMinVersion: '10.0.14393.42', manifestPackageArch: 'arm64' } as any);
      expect(binaries).toStrictEqual({
        makeAppx: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\makeappx.exe',
        makePri: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\makepri.exe',
        makeCert: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\makecert.exe',
        signTool: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.14393.42\\x64\\SignTool.exe'});
    });

    it('should return default binaries if no information is provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
      }
      overrideProcessorArchitecture('ARM64');
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any)
      const binaries = await locateMSIXTooling(packagingOptions);
      expect(binaries).toStrictEqual({
        makeAppx: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\arm64\\makeappx.exe',
        makePri: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\arm64\\makepri.exe',
        makeCert: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\arm64\\makecert.exe',
        signTool: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\arm64\\SignTool.exe'});
    });

    it('should throw an error if no binaries are found', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(false as any)
      await locateMSIXTooling(packagingOptions);
      expect(log.error).toHaveBeenCalledWith('No information on WindowsKitVersion was provided and default WindowsKit path does not exist.', true, 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64');
    });

  });

  describe('makeProgramOptions', () => {
    const defaultExpectedProgramOptions: ProgramOptions = {
      appDir: 'C:\\app',
      assetsIn: path.join(__dirname, '..', '..', 'static', 'assets'),
      makeMsix: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\makeappx.exe',
      makePri: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\makepri.exe',
      makeCert: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\makecert.exe',
      signTool: 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\SignTool.exe',
      outputDir: 'C:\\out',
      layoutDir: 'C:\\out\\msix_layout',
      msix: 'C:\\out\\app_x64.msix',
      appManifestLayout: 'C:\\out\\msix_layout\\AppxManifest.xml',
      assetsLayout: 'C:\\out\\msix_layout\\assets',
      appLayout: 'C:\\out\\msix_layout\\app',
      priConfig: 'C:\\out\\msix_layout\\priconfig.xml',
      priFile: 'C:\\out\\msix_layout\\resources.pri',
      publisher: 'Electron',
      cert_pfx: 'C:\\out\\dev_cert.pfx',
      cert_cer: 'C:\\out\\dev_cert.cer',
      createDevCert: true,
      cert_pass: '',
      createPri: true,
      isSparsePackage: false,
      signParams: [],
      sign: true,
    } as any;

    const getDefaultSignParams = (cert_pass: string) => {
      return ['-fd', 'sha256', '-f', 'C:\\out\\dev_cert.pfx', '-p', cert_pass];
    }

    it('should return the program options with minimal packaging options', async () => {
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(minimalPackagingOptions);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions.cert_pass.length).toBe(16);
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
         cert_pass: programOptions.cert_pass,
         signParams:getDefaultSignParams(programOptions.cert_pass)
        });
    });

    it('should use the app name from the manifest variables if provided', async () => {
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(
        {
          ...minimalPackagingOptions,
          manifestVariables: undefined
        },
        { manifestAppName: 'MyCustomApp', manifestPublisher: 'Electron'} as any);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        cert_pass: programOptions.cert_pass,
        signParams:getDefaultSignParams(programOptions.cert_pass),
        msix: 'C:\\out\\MyCustomApp.msix' });
    });

    it('should use the app name and package arch from the manifest variables if provided', async () => {
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(
        {
          ...minimalPackagingOptions,
          manifestVariables: undefined
        },
        { manifestAppName: 'MyApp', manifestPackageArch: 'arm64', manifestPublisher: 'Electron'} as any
      );
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        cert_pass: programOptions.cert_pass,
        signParams:getDefaultSignParams(programOptions.cert_pass),
        msix: 'C:\\out\\MyApp_arm64.msix' });
    });

    it('should use the app name and package arch from the manifest variables if provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        manifestVariables: {
          targetArch: 'arm64',
          publisher: 'Electron',
          appExecutable: 'MySuperApp.exe',
          packageVersion: '1.2.3',
        } as any
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(packagingOptions);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        cert_pass: programOptions.cert_pass,
        signParams:getDefaultSignParams(programOptions.cert_pass),
        msix: 'C:\\out\\MySuperApp_arm64.msix'
      });
    });

    it('should disable the creation of the pri file if createPri is false', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        manifestVariables: {
          targetArch: 'x64',
          publisher: 'Electron',
          packageVersion: '1.2.3',
        } as any,
        createPri: false,
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(packagingOptions);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        cert_pass: programOptions.cert_pass,
        signParams:getDefaultSignParams(programOptions.cert_pass),
        createPri: false });
    });

    it('should use the sign params if provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        signParams: ['1', '2', '3'],
        manifestVariables: {
          targetArch: 'x64',
          publisher: 'Electron',
          packageVersion: '1.2.3',
        } as any
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(packagingOptions);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        cert_pass: programOptions.cert_pass,
        signParams: ['1', '2', '3'],
        sign: true });
    });

    it('should use cert if provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        cert: 'C:\\cert.pfx',
        cert_pass: 'password',
        manifestVariables: {
          targetArch: 'x64',
          publisher: 'Electron',
          packageVersion: '1.2.3',
        } as any
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      vi.mocked(getCertPublisher).mockResolvedValueOnce('Electron');
      const programOptions = await makeProgramOptions(packagingOptions);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        publisher: 'Electron',
        cert_pfx: 'C:\\cert.pfx',
        cert_cer: '',
        cert_pass: 'password',
        createDevCert: false,
        sign: true,
        signParams: ['-fd', 'sha256', '-f', 'C:\\cert.pfx', '-p', 'password']
      });
    });

    it('should use cert and sign password if provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        cert_pass: 'password',
        cert: 'C:\\cert.pfx',
        manifestVariables: {
          targetArch: 'x64',
          publisher: 'Electron',
          packageVersion: '1.2.3',
        } as any
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(packagingOptions);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        publisher: 'Electron',
        cert_pfx: 'C:\\cert.pfx',
        cert_cer: '',
        cert_pass: 'password',
        createDevCert: false,
        sign: true,
        signParams: ['-fd', 'sha256', '-f', 'C:\\cert.pfx', '-p', 'password']
      });
    });

    it('should set the signtool log level to debug if logLevel is debug', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        cert_pass: 'password',
        cert: 'C:\\cert.pfx',
        manifestVariables: {
          targetArch: 'x64',
          publisher: 'Electron',
          packageVersion: '1.2.3',
        } as any,
        logLevel: 'debug',
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(packagingOptions);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        publisher: 'Electron',
        cert_pfx: 'C:\\cert.pfx',
        cert_cer: '',
        cert_pass: 'password',
        createDevCert: false,
        sign: true,
        signParams: ['-fd', 'sha256', '-f', 'C:\\cert.pfx', '-p', 'password', '-debug']
      });
    });

    it('should create a dev cert with the provided sign password', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        cert_pass: 'password',
        manifestVariables: {
          targetArch: 'x64',
          publisher: 'Electron',
          packageVersion: '1.2.3',
        } as any
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(packagingOptions);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        publisher: 'Electron',
        cert_pfx: 'C:\\out\\dev_cert.pfx',
        cert_cer: 'C:\\out\\dev_cert.cer',
        cert_pass: 'password',
        createDevCert: true,
        signParams: ['-fd', 'sha256', '-f', 'C:\\out\\dev_cert.pfx', '-p', 'password']
      });
    });

    it('should use manifest variables publisher if provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(packagingOptions, { manifestPublisher: 'MyPublisher' } as any);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        msix: 'C:\\out\\app.msix',
        publisher: 'MyPublisher',
        cert_pass: programOptions.cert_pass,
        signParams: getDefaultSignParams(programOptions.cert_pass),
      });
    });

    it('should use empty publisher if no publisher is provided', async () => {
      const packagingOptions: PackagingOptions = {
        ...incompletePackagingOptions,
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(packagingOptions, {  } as any);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        msix: 'C:\\out\\app.msix',
        publisher: '',
        cert_pass: programOptions.cert_pass,
        signParams: getDefaultSignParams(programOptions.cert_pass),
      });
    });

    it('should not sign the package if sign is false', async () => {
      const packagingOptions: PackagingOptions = {
        ...minimalPackagingOptions,
        sign: false,
      }
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true as any);
      const programOptions = await makeProgramOptions(packagingOptions);
      // @ts-expect-error: appManifestIn may not be optional in the type, but we want to ignore it for test comparison
      delete programOptions.appManifestIn;
      expect(programOptions).toStrictEqual({
        ...defaultExpectedProgramOptions,
        publisher: 'Electron',
        signParams: [],
        cert_pfx: '',
        cert_cer: '',
        createDevCert: false,
        sign: false,
      });
    });
  });

  describe('createLayout', () => {
    beforeEach(() => {
      vi.mocked(fs.writeFile).mockClear();
      vi.mocked(fs.copy).mockClear();
    });

    it('should create the layout', async () => {
      const programOptions: ProgramOptions = {
        appManifestLayout: 'C:\\out\\msix_layout\\AppxManifest.xml',
        appManifestIn: 'content',
        assetsIn: 'C:\\my_assets',
        assetsLayout: 'C:\\out\\msix_layout\\assets',
        appLayout: 'C:\\out\\msix_layout\\app',
        appDir: 'C:\\my_app',
        isSparsePackage: false,
      } as any
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);
      vi.mocked(fs.copy).mockResolvedValueOnce(undefined);
      await createLayout(programOptions);
      expect(fs.writeFile).toHaveBeenCalledWith('C:\\out\\msix_layout\\AppxManifest.xml', 'content');
      expect(fs.copy).toHaveBeenCalledWith('C:\\my_assets', 'C:\\out\\msix_layout\\assets');
      expect(fs.copy).toHaveBeenCalledWith('C:\\my_app', 'C:\\out\\msix_layout\\app');
    });

    it('should create the layout for a sparse package', async () => {
      const programOptions: ProgramOptions = {
        appManifestLayout: 'C:\\out\\msix_layout\\AppxManifest.xml',
        appManifestIn: 'content',
        assetsIn: 'C:\\my_assets',
        assetsLayout: 'C:\\out\\msix_layout\\assets',
        appLayout: 'C:\\out\\msix_layout\\app',
        isSparsePackage: true,
      } as any
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);
      vi.mocked(fs.copy).mockResolvedValueOnce(undefined);
      await createLayout(programOptions);
      expect(fs.writeFile).toHaveBeenCalledWith('C:\\out\\msix_layout\\AppxManifest.xml', 'content');
      expect(fs.copy).toBeCalledTimes(1);
      expect(fs.copy).toHaveBeenCalledWith('C:\\my_assets', 'C:\\out\\msix_layout\\assets');
    });
  });
});