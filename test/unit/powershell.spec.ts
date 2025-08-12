import { describe, expect, it, vi } from "vitest";
import { powershell } from "../../src/powershell";
import { spawnPromise } from "spawn-rx";

vi.mock('spawn-rx', () => ({
  spawnPromise: vi.fn(),
}));

describe('powershell', () => {
  it('should call powershell', async () => {
    await powershell('C:\\out\\create_dev_cert.ps1');
    expect(spawnPromise).toHaveBeenCalledWith('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', 'C:\\out\\create_dev_cert.ps1'], undefined);
  });
});
