import { make, pri, priConfig, sign } from './bin.mjs';
import { ensureDevCert } from './cert.mjs';
import { getManifestVariables } from './manifestation.mjs';
import { type Artifacts, type ManifestGenerationVariables, type PackagingOptions, type WindowsSignOptions } from './types.mjs';
import { createLayout, ensureFolders, makeProgramOptions, setLogLevel, verifyOptions } from './utils.mjs';

export type { PackagingOptions, ManifestGenerationVariables, Artifacts, WindowsSignOptions };

export const packageMSIX = async (options: PackagingOptions) => {
  setLogLevel(options);
  await ensureFolders(options);
  const manifestVars = await getManifestVariables(options)
  await verifyOptions(options, manifestVars);
  const program = await makeProgramOptions(options, manifestVars);
  await createLayout(program);
  await ensureDevCert(program);
  await priConfig(program);
  await pri(program);
  await make(program);
  await sign(program);

  return {
    msixPackage: program.msix,
  };
}
