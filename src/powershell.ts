import { spawnPromise } from 'spawn-rx';
import { log } from './logger';

export async function powershell(commandAndArgs: string, options?: any) {
  log.debug('Running powershell command', { commandAndArgs });
  const result = await spawnPromise('pwsh.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', commandAndArgs], options) as unknown as Promise<string>;
  log.debug('Powershell command result', { result });
  return result;
}
