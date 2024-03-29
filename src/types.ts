export interface PackagingOptions {
  /**
   * The folder containing the packaged Electron App. This parameter is required unless its building a Sparse MSIX.
   */
  appDir?: string;
  /**
   * The AppManifest.xml containing necessary declarations to build the MSIX
   */
  appManifest: string;
  /** Required assets declared in AppManifest.xml. E.g. icons and tile images */
  packageAssets: string;
  /** The output directory for the finished MSIX package. */
  outputDir: string;
  /** Optional name for the finished MSIX package. If not provided a name will be derived from AppManifest.xml. */
  packageName?: string;
  /** Optional version of the WindowsKit to use. If WindowsKitPath is provide then it will trump this.
   * If neither WindowsKitVersion nor WindowsKitPath is provided then the Windows Kit path will be derived from the
   * OS Version specified in AppManifest.xml.
   */
  windowsKitVersion?: string;
  /**
   * An optional full path to the WindowsKit. This path will trump both WindowsKitVersion and AppxManifest.
   */
  windowsKitPath?: string;
  /** Indicates whether to create Pri resource files. It will be enabled by default. */
  createPri?: boolean;
  /**
   * An optional path to the certificate. If not provided then the MSIX will not be signed. Beware that the Publisher of the cert
   * must match the AppxManifest Publisher.
   */
  cert?: string;
  /**
   * The password for the cert.
   */
  cert_pass?: string;
  /**
   * A custom set of SignTool parameters. If present it will supersede cert and cert_pass parameters.
   */
  signParams?: Array<string>
  /**
   * Controls the level of logging
   */
  logLevel?: 'warn' | 'debug';
}

export interface ProgramOptions {
  makeMsix: string;
  makePri: string;
  signTool: string;
  outputDir: string;
  layoutDir: string;
  msix: string;
  appDir: string;
  appLayout: string;
  appManifestIn: string;
  appManifestLayout: string;
  assetsIn: string;
  assetsLayout: string;
  cert: string;
  cert_pass: string;
  createPri: boolean;
  priConfig: string;
  priFile: string;
  isSparsePackage: boolean;
  signParams: Array<string>;
  sign: boolean;
}


export type ManifestVariables = {
  osMinVersion: string,
  appName: string,
  packageArch: string,
  isSparsePackage: boolean,
  publisher: string
}
