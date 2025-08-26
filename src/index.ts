import { ensureDevCert } from './cert';
import { getManifestVariables } from './manifestation';
import { make, pri, priConfig, sign } from './msix';
import { Artifacts, ManifestGenerationVariables, PackagingOptions } from './types';
import { createLayout, ensureFolders, makeProgramOptions, setLogLevel, verifyOptions } from './utils';

export type { PackagingOptions, ManifestGenerationVariables, Artifacts };

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
  if(program.sign) {
    await sign(program);
  }

  return {
    msixPackage: program.msix,
    dev_cert: program.createDevCert ? program.cert_pfx : undefined,
    dev_cert_pass: program.createDevCert && !options.cert_pass ?  program.cert_pass : undefined,
  };
}
