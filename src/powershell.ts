import { log } from './logger';
import spawn from 'cross-spawn-promise';

export async function powershell(scriptOrCommand: string) {
  log.debug('Running powershell command', { commandAndArgs: scriptOrCommand });
  const isScript = scriptOrCommand.endsWith('.ps1');
  const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass'];
  if (isScript) {
    args.push(scriptOrCommand);
  } else {
    args.push('-Command', scriptOrCommand);
  }
  const result = await spawn('pwsh.exe', args, { encoding: 'utf-8' });
  log.debug('Powershell command result', { result });
  return result ? result.toString() : '';
}
