import { describe, expect, it, vi } from "vitest";
import { powershell } from "../../src/powershell";
import spawn from "cross-spawn-promise";

vi.mock(import("cross-spawn-promise"), async () => {
  return {
    default: vi.fn(),
  }
})

describe('powershell', () => {
  it('should call powershell', async () => {
    await powershell('C:\\out\\create_dev_cert.ps1');
    expect(spawn).toHaveBeenCalledWith('pwsh.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', 'C:\\out\\create_dev_cert.ps1'], { encoding: 'utf-8' });
  });

  it('should call powershell', async () => {
    await powershell('Get-Process');
    expect(spawn).toHaveBeenCalledWith('pwsh.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', 'Get-Process'], { encoding: 'utf-8' });
  });
});
