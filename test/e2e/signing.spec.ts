import * as fs from 'fs';
import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import { packageMSIX } from "../../src";
import { getCertStatus, getCertSubject, installDevCert } from './utils/cert';

describe('signing', () => {
  beforeAll(async () => {
    globalThis.DEBUG = true;
    await installDevCert();
  });

  describe('signing with an existing cert', () => {
    it('should package the app', async () => {
      await packageMSIX({
        appDir: path.join(__dirname, 'fixtures', 'app-x64'),
        outputDir: path.join(__dirname, '..', '..', 'out'),
        appManifest: path.join(__dirname, 'fixtures', 'AppxManifest_x64.xml'),
        cert: path.join(__dirname, 'fixtures', 'MSIXDevCert.pfx'),
        cert_pass: 'Password123',
      });
      expect(fs.existsSync(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'))).toBe(true);
    });

    it('should sign the msix', async () => {
      const certStatus = await getCertStatus(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'));
      expect(certStatus).not.toBe('NotSigned')
    });

    it('should the cert should have the correct subject', async () => {
      const certSubject = await getCertSubject(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'));
      expect(certSubject).toBe('CN=Electron MSIX')
    });

    it('should not sign the app if sign is set to false', async () => {
      await packageMSIX({
        appDir: path.join(__dirname, 'fixtures', 'app-x64'),
        outputDir: path.join(__dirname, '..', '..', 'out'),
        appManifest: path.join(__dirname, 'fixtures', 'AppxManifest_x64.xml'),
        cert: path.join(__dirname, 'fixtures', 'MSIXDevCert.pfx'),
        cert_pass: 'Password123',
        sign: false,
      });
      expect(fs.existsSync(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'))).toBe(true);
      const certStatus = await getCertStatus(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'));
      expect(certStatus).toBe('NotSigned');
    });

    it('should sign the app with custom sign params', async () => {
      await packageMSIX({
        appDir: path.join(__dirname, 'fixtures', 'app-x64'),
        outputDir: path.join(__dirname, '..', '..', 'out'),
        appManifest: path.join(__dirname, 'fixtures', 'AppxManifest_x64.xml'),
        signParams:  [
          '-fd',
          'sha256',
          '-f',
          path.join(__dirname, 'fixtures', 'MSIXDevCert.pfx'),
          '-p',
          'Password123'
        ],
        logLevel: 'debug',
      });
      expect(fs.existsSync(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'))).toBe(true);
      const certStatus = await getCertStatus(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'));
      expect(certStatus).toBe('Valid');
    });
  });

  describe.skip('signing with a generated dev cert', () => {
    it('should package the app', async () => {
      await packageMSIX({
        appDir: path.join(__dirname, 'fixtures', 'app-x64'),
        outputDir: path.join(__dirname, '..', '..', 'out'),
        manifestVariables: {
          publisher: 'CN=Dev Publisher',
          packageIdentity: 'com.example.app',
          packageVersion: '1.42.0.0',
          appExecutable: 'hellomsix.exe',
          targetArch: 'x64',
        },
        windowsKitVersion: '10.0.26100.0',
      });
      expect(fs.existsSync(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'))).toBe(true);
    });

    it('should sign the msix', async () => {
      const certStatus = await getCertStatus(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'));
      expect(certStatus).not.toBe('NotSigned')
    });

    it('should the cert should have the correct subject', async () => {
      const certSubject = await getCertSubject(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'));
      expect(certSubject).toBe('CN=Dev Publisher')
    });
  });
});
