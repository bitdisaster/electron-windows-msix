export interface ManifestGenerationVariables {
  /**
  * The identity of the MSIX package. This will be used to set the Identity attribute in the AppxManifest.xml.
  * If a manifest is provided then this will be ignored.
  */
  packageIdentity : string;
  /**
    * The publisher of the MSIX package. This will be used to create a default certificate if one is not provided.
    * As well as the publisher name in the AppxManifest.xml. If a manifest is provided then this will be ignored.
    */
  publisher : string;
  /**
    * The display name of the publisher of the MSIX package. This will be used to set the PublisherDisplayName attribute in the AppxManifest.xml.
    * If a manifest is provided then this will be ignored.
    */
  publisherDisplayName ? : string;
  /**
    * The version of the MSIX package. This will be used to set the Version attribute in the AppxManifest.xml.
    * If a manifest is provided then this will be ignored.
    */
  packageVersion : string;
  /**
    * The display name of the MSIX package. This will be used to set the DisplayName attribute in the AppxManifest.xml.
    * If a manifest is provided then this will be ignored.
    */
  packageDisplayName ? : string;
  /**
    * The description of the MSIX package. This will be used to set the Description attribute in the AppxManifest.xml.
    * If a manifest is provided then this will be ignored.
    */
  packageDescription ? : string;
  /**
    * The background color of the MSIX package. This will be used to set the BackgroundColor attribute in the VisualElements element in the AppxManifest.xml.
    * If a manifest is provided then this will be ignored.
    */
  packageBackgroundColor ? : string;
  /**
    * The executable of the MSIX package. This will be used to set the Executable attribute in the AppxManifest.xml.
    * If a manifest is provided then this will be ignored.
    */
  appExecutable : string;
  /**
    * The name of the MSIX package. This will be used to set the DisplayName attribute in the VisualElements element in the AppxManifest.xml.
    * If a manifest is provided then this will be ignored.
  */
  appDisplayName? : string;
  /**
    * The target architecture of the MSIX package. This will be used to set the ProcessorArchitecture attribute in the AppxManifest.xml.
    * If a manifest is provided then this will be ignored.
    */
  targetArch : 'x64' | 'arm64' | 'x86' | 'arm' | '*';
  /**
    * The minimum OS version the MSIX package requires. This will be used to set the MinVersion attribute in the TargetDeviceFamily element in the AppxManifest.xml.
    * If a manifest is provided then this will be ignored.
    */
  packageMinOSVersion ? : string;
  /**
    * The maximum OS version the MSIX package has been tested on. This will be used to set the MaxVersionTested attribute in the TargetDeviceFamily element in the AppxManifest.xml.
    * If a manifest is provided then this will be ignored.
    */
  packageMaxOSVersionTested ? : string;
}



export interface PackagingOptions {
  /**
   * The manifest variables to generate the AppxManifest.xml for the package.
   * If a manifest is provided then this will be ignored.
   */
  manifestVariables ? : ManifestGenerationVariables;
  /**
   * The AppManifest.xml containing necessary declarations to build the MSIX
   */
  appManifest ? : string;
  /**
   * The folder containing the packaged Electron App. This parameter is required unless its building a Sparse MSIX.
   */
  appDir ? : string;
  /** Optional assets used in AppManifest.xml. E.g. icons and tile images. If not provided then the default assets will be used. */
  packageAssets ?: string;
  /** The output directory for the finished MSIX package. */
  outputDir: string;
  /** Optional name for the finished MSIX package file. If not provided a name will be derived from AppManifest.xml. */
  packageName ? : string;
  /** Optional version of the WindowsKit to use. If WindowsKitPath is provide then it will trump this.
   * If neither WindowsKitVersion nor WindowsKitPath is provided then the Windows Kit path will be derived from the
   * OS Version specified in AppManifest.xml.
   */
  windowsKitVersion ? : string;
  /**
   * An optional full path to the WindowsKit. This path will trump both WindowsKitVersion and AppxManifest.
   */
  windowsKitPath ? : string;
  /** Indicates whether to create Pri resource files. It will be enabled by default. */
  createPri ? : boolean;
  /**
   * An optional path to the certificate. If not provided then the MSIX will not be signed. Beware that the Publisher of the cert
   * must match the AppxManifest Publisher.
   */
  cert ? : string;
  /**
   * The password for the cert.
   */
  cert_pass ? : string;
  /**
   * A custom set of SignTool parameters. If present it will supersede cert and cert_pass parameters.
   */
  signParams ? : Array < string >
  /**
   * Controls the level of logging
   */
  logLevel ? : 'warn' | 'debug';
}

export interface ProgramOptions {
  makeMsix: string;
  makePri: string;
  signTool: string;
  makeCert: string;
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


/**
 * The variables read from the provided AppxManifest.xml.
 */
export type ManifestVariables = {
  manifestOsMinVersion?: string,
  manifestAppName: string,
  manifestPackageArch: string,
  manifestIsSparsePackage: boolean,
  manifestPublisher: string
}