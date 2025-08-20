import { spawnPromise } from 'spawn-rx';
import { log } from './logger';

export async function powershell(scriptOrCommand: string, options?: any) {
  log.debug('Running powershell command', { commandAndArgs: scriptOrCommand });
  const isScript = scriptOrCommand.endsWith('.ps1');
  const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass'];
  if (isScript) {
    args.push(scriptOrCommand);
  } else {
    args.push('-Command', scriptOrCommand);
  }
  const result = await spawnPromise('pwsh.exe', args, options) as unknown as Promise<string>;
  log.debug('Powershell command result', { result });
  return result;
}
