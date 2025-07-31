import * as fs from 'fs';
import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import { packageMSIX } from "../../src";
import { installCert as installDevCert } from './utils/cert';

describe('package', () => {
  beforeAll(() => {
    installDevCert();
  });

  it('should package an app with a manifest', async () => {
    const result = packageMSIX({
      appDir: path.join(__dirname, 'fixtures', 'app-x64'),
      outputDir: path.join(__dirname, '..', '..', 'out'),
      appManifest: path.join(__dirname, 'fixtures', 'AppxManifest_x64.xml'),
      cert: path.join(__dirname, 'fixtures', 'MSIXDevCert.pfx'),
      cert_pass: 'Password123',
    });
    await result;
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'))).toBe(true);
  });

  it('should package an app with a manifest variables', async () => {
    await packageMSIX({
      appDir: path.join(__dirname, 'fixtures', 'app-x64'),
      outputDir: path.join(__dirname, '..', '..', 'out'),
      manifestVariables: {
        appExecutable: 'hellomsix.exe',
        targetArch: 'x64',
        packageIdentity: 'com.example.app',
        publisher: 'CN=Jan Hannemann',
        packageVersion: '1.42.0.0',
      },
      logLevel: 'warn',
    });
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'out', 'hellomsix_x64.msix'))).toBe(true);
  });
});