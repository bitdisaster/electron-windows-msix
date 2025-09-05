import { sign as windowsSign } from '@electron/windows-sign';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCertPublisher, make, pri, priConfig, sign } from "../../src/msix.mts";
import { log } from '../../src/logger.mts';

vi.mock('child_process', () => ({
  spawn: vi.fn(() => {
    const emitter = new EventEmitter() as any;
    // Simulate stdout, stderr, exit, and close events
    setImmediate(() => {
      emitter.emit('data', Buffer.from('mocked spawn output')); // General data event (if used)
      emitter.stdout.emit('data', Buffer.from('mocked stdout'));
      emitter.stderr.emit('data', Buffer.from('mocked stderr'));
      emitter.emit('exit', 0, null); // Exit with code 0, no signal
      emitter.emit('close', 0); // Close with code 0
    });
    // Attach stdout and stderr as EventEmitters
    emitter.stdout = new EventEmitter();
    emitter.stderr = new EventEmitter();
    emitter.stdin = {
      end: vi.fn(),
    }
    return emitter;
  }),
}));

vi.mock('@electron/windows-sign', () => ({
    sign: vi.fn(),
}));

vi.mock('../../src/logger.mts');

describe('msix', () => {
  beforeEach(() => {
    vi.mocked(spawn).mockClear();
  });

  it('should return the publisher from the cert', async () => {
    vi.mocked(spawn).mockImplementationOnce((_, __) => {
      const stdoutData = `
      NotAfter: 12/7/2024 7:01 PM
      Subject: CN=Electron
      Signature matches Public Key
      `;
      const emitter = new EventEmitter() as any;
      setImmediate(() => {
        emitter.stdout.emit('data', Buffer.from(stdoutData));
        emitter.emit('exit', 0, null);
      });

      emitter.stdout = new EventEmitter();
      emitter.stderr = new EventEmitter();
      emitter.stdin = { end: vi.fn() };
      return emitter;
    });
    const result = await getCertPublisher('C:\\cert.pfx', 'password');
    expect(spawn).toHaveBeenCalledWith('certutil', ['-p', 'password', '-dump', 'C:\\cert.pfx'], {});
    expect(result).toBe('CN=Electron');
  });

  it('should log an error if the certutil command fails', async () => {
    vi.mocked(spawn).mockImplementationOnce(() => {
      const emitter = new EventEmitter() as any;
      setImmediate(() => {
        emitter['stderr'].emit('data', Buffer.from('certutil: Error: oops'));
        emitter.emit('exit', 1, null);
      });

      emitter.stdout = new EventEmitter();
      emitter.stderr = new EventEmitter();
      emitter.stdin = { end: vi.fn() };
      return emitter;
    });
    await expect(getCertPublisher('C:\\cert.pfx', 'password')).rejects.toThrow('Failed running certutil Exit Code: 1 See previous errors for details');
    expect(log.error).toHaveBeenCalledWith('stderr of certutil', false, ['certutil: Error: oops']);
  });

  it('should log an error if no publisher is found in the cert', async () => {
    vi.mocked(spawn).mockImplementationOnce((_, __) => {
      const emitter = new EventEmitter() as any;
      setImmediate(() => {
        emitter.stdout.emit('data', Buffer.from(''));
        emitter.emit('exit', 0, null);
      });
      emitter.stdout = new EventEmitter();
      emitter.stderr = new EventEmitter();
      emitter.stdin = { end: vi.fn() };
      return emitter;
    });
    await getCertPublisher('C:\\cert.pfx', 'password');
    expect(log.error).toHaveBeenCalledWith('Unable to find publisher in Cert');
  });

  it('should call priConfig with the correct arguments', async () => {
   await priConfig({
      makePri: 'C:\\makepri.exe',
      priConfig: 'C:\\priConfig.xml',
      createPri: true,
    } as any);
    expect(spawn).toHaveBeenCalledWith('C:\\makepri.exe', ['createconfig', '/cf', 'C:\\priConfig.xml', '/dq', 'en-US'], {});
  });

  it('should call priConfig with the correct arguments', async () => {
    await priConfig({
      makePri: 'C:\\makepri.exe',
      priConfig: 'C:\\priConfig.xml',
      createPri: false,
    } as any);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('should call pri with the correct arguments', async () => {
    await pri({
      makePri: 'C:\\makepri.exe',
      priConfig: 'C:\\priConfig.xml',
      layoutDir: 'C:\\layoutDir',
      priFile: 'C:\\priFile.xml',
      appManifestLayout: 'C:\\appManifestLayout.xml',
      createPri: true,
    } as any);
    expect(spawn).toHaveBeenCalledWith('C:\\makepri.exe', ['new', '/pr', 'C:\\layoutDir', '/cf', 'C:\\priConfig.xml', '/mn', 'C:\\appManifestLayout.xml', '/of', 'C:\\priFile.xml', '/v'], {});
  });

  it('should skip pri if createPri is false', async () => {
    await pri({
      createPri: false,
    } as any);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('should call make with the correct arguments', async () => {
    await make({
      makeMsix: 'C:\\makeappx.exe',
      layoutDir: 'C:\\layoutDir',
      msix: 'C:\\msix',
      isSparsePackage: false,
    } as any);
    expect(spawn).toHaveBeenCalledWith('C:\\makeappx.exe', ['pack', '/d', 'C:\\layoutDir', '/p', 'C:\\msix', '/o'], {});
  });

  it('should call make with the correct arguments for a sparse package', async () => {
    await make({
      makeMsix: 'C:\\makeappx.exe',
      layoutDir: 'C:\\layoutDir',
      msix: 'C:\\msix',
      isSparsePackage: true,
    } as any);
    expect(spawn).toHaveBeenCalledWith('C:\\makeappx.exe', ['pack', '/d', 'C:\\layoutDir', '/p', 'C:\\msix', '/o', '/nv'], {});
  });

  it('should call sign with the correct arguments', async () => {
    const result = sign({
      signTool: 'C:\\SignTool.exe',
      signParams: ['-fd', 'sha256', '-f', 'C:\\cert.pfx'],
      msix: 'C:\\myapp.msix',
      windowsSignOptions: {
        certificateFile: 'C:\\cert.pfx',
        certificatePassword: 'password',
        hashes: ['sha256'],
        files: ['C:\\myapp.msix'],
      },
    } as any);

    expect(windowsSign).toHaveBeenCalledWith({
      certificateFile: 'C:\\cert.pfx',
      certificatePassword: 'password',
      hashes: ['sha256'],
      files: ['C:\\myapp.msix'],
    });
  });
});