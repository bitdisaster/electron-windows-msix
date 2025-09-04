import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

import { powershell } from './powershell.mjs';
import { type ProgramOptions } from './types.mjs';
import { removePublisherPrefix } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ensureDevCert = async (programOptions: ProgramOptions) => {
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
    await powershell(scriptPath);
    fs.unlinkSync(scriptPath);
  }
}
