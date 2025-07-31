import { exec } from 'child_process';
import * as path from 'path';

export const installCert = () => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'install_test_cert.ps1');
  exec(`powershell -File ${scriptPath}`);
}