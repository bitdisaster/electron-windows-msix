import { spawnPromise } from 'spawn-rx';

export async function powershell(commandAndArgs: string, options?: any) {
  return spawnPromise('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', commandAndArgs], options) as unknown as Promise<string>;
}
