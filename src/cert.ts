import { ProgramOptions } from './types';
import * as fs from 'fs-extra';
import * as path from 'path';
import { powershell } from './powershell';
import { removePublisherPrefix } from './utils';
import { log } from './logger';

export const ensureDevCert = async (programOptions: ProgramOptions) => {
  log.debug('Creating dev cert');
  if(programOptions.createDevCert) {
    const template = fs.readFileSync(
      path.join(__dirname, '../static/templates/create_dev_cert.ps1.in'),
      'utf-8'
    );
    const publisherName = removePublisherPrefix(programOptions.publisher);
    const script = template
      .replace(/{{SubjectName}}/g, publisherName)
      .replace(/{{Password}}/g, programOptions.cert_pass)
      .replace(/{{PfxOutputPath}}/g, programOptions.cert_pfx)
      .replace(/{{CerOutputPath}}/g, programOptions.cert_cer);

    const scriptPath = path.join(programOptions.outputDir, 'create_dev_cert.ps1');
    fs.writeFileSync(scriptPath, script);
    const result = await powershell(scriptPath);
    log.debug('Dev cert script result', result);
    fs.unlinkSync(scriptPath);
  }
}
