import { log } from "./logger"
import { ProgramOptions } from "./types";

const  run = async (executable: string, args: Array<string>)  => {
  return new Promise<void>((resolve, reject) => {
    const proc = require('child_process').spawn(executable, args, {});
    log.debug(`Calling ${executable} with args`, args);

    const cleanOutData = (data: any) => {
      return data
      .toString()
      .replace(/\r/g, '')
      .replace(/\\\\/g, '\\')
      .split('\n');
    }

    let stdout = [];
    proc.stdout.on('data', (data) => {
      stdout.push(...cleanOutData(data));
    });

    let stderr = [];
    proc.stderr.on('data', (data) => {
      stderr.push(...cleanOutData(data));
    });

    proc.on('exit', (code) => {
      log.debug(`stdout of ${executable}`, stdout);
      if (code !== 0) {
        log.error(`stderr of ${executable}`, false, stderr)
        return reject(new Error(`Failed running ${executable} Exit Code: ${code} See previous errors for details`))
      }
      return resolve();
    });

    proc.stdin.end();
  })
}

export const priConfig = async (program: ProgramOptions) => {
  const { makePri, priConfig, createPri } = program;
  if(createPri) {
    const args = ['createconfig', '/cf', priConfig, '/dq', 'en-US'];
    log.debug('Creating pri config.')
    await run(makePri, args);
  } else {
    log.debug('Skipping making pri config.');
  }
}

export const pri = async (program: ProgramOptions) => {
  const { makePri, priConfig, layoutDir, priFile, appManifestLayout, createPri } = program;
  if(createPri) {
    log.debug('Making pri.')
    const args = ['new', '/pr', layoutDir, '/cf', priConfig, '/mn', appManifestLayout, '/of', priFile, '/v'];
    await run(makePri, args);
  } else {
    log.debug('Skipping making pri.');
  }
}

export const make = async (program: ProgramOptions) => {
  const { makeMsix, layoutDir, msix} = program;
  const args = [
    'pack',
    '/d',
    layoutDir,
    '/p',
    msix,
    '/o',
  ];

  await run(makeMsix, args);
}

export const sign = async (program: ProgramOptions) => {
  const { signTool, cert, cert_pass, msix } = program;
  const args = [
    'sign',
    '-fd',
    'sha256',
    '-f',
    cert,
  ];
  if (cert_pass) {
    args.push('-p', cert_pass);
  }
  args.push(msix);

  await run(signTool, args);
}