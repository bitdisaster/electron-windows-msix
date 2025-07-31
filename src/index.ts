import { getManifestVariables } from './manifestation';
import { make, pri, priConfig, sign } from './msix';
import { PackagingOptions } from './types';
import { createLayout, ensureFolders, makeProgramOptions, setLogLevel, verifyOptions } from './utils';

export const packageMSIX = async (options: PackagingOptions) => {
  setLogLevel(options);
  await ensureFolders(options);
  const manifestVars = await getManifestVariables(options)
  await verifyOptions(options, manifestVars);
  const program = await makeProgramOptions(options, manifestVars);
  await createLayout(program);
  await priConfig(program);
  await pri(program);
  await make(program);
  if(program.sign) {
    await sign(program);
  }
}
