import * as path from 'path';

import { powershell } from '../../../src/powershell';


export const installDevCert = async () => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'install_test_cert.ps1');
  await powershell(scriptPath)
}

export const getCertSubject = async (pathToFile: string) => {
  const subject = await powershell(`(Get-AuthenticodeSignature -FilePath "${pathToFile}").SignerCertificate.Subject`);
  return subject.replace(/^\s+|\s+$/g, '');
}

export const getCertStatus = async (pathToFile: string) => {
  const status = await powershell(`(Get-AuthenticodeSignature -FilePath "${pathToFile}").Status`);
  return status.replace(/^\s+|\s+$/g, '');
}

