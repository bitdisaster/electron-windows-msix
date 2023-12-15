import { make, pri, priConfig, sign } from './msix';
import { PackagingOptions } from './types';
import { createLayout, locateMSIXTooling, makeProgramOptions, setLogLevel, verifyOptions } from './utils';

export const packageMSIX = async (options: PackagingOptions) => {
  setLogLevel(options);
  await verifyOptions(options);
  const program = await makeProgramOptions(options);
  await createLayout(program);
  await priConfig(program);
  await pri(program);
  await make(program);
  await sign(program);
}