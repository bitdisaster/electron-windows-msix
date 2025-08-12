import { powershell } from "../../../src/powershell";

export const installMSIX = async (appx: string) =>
  await powershell(`Add-AppxPackage -Path "${appx}"`);

export const uninstallMSIX = async (packageName: string) => {
  await powershell(`Get-AppxPackage -Name "${packageName}" | Remove-AppxPackage`);
};

export const checkInstall = async (name: string, version?: string) => {
  let install = await powershell(`$p = Get-AppxPackage -Name "${name}" -ErrorAction SilentlyContinue; $p.Name + "|" + $p.Version`);

  install = install.replace(/(\r\n|\n|\r)/gm, '');
  const fields = install.split('|');
  return {
    name: fields[0],
    version: fields[1],
  }
}
