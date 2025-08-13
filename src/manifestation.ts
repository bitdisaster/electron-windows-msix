import * as path from "path";
import * as fs from "fs-extra";
import {
  ManifestVariables,
  PackagingOptions
} from "./types";
import { removeFileExtension, removePublisherPrefix } from "./utils";
import { log } from "./logger";
import { ensureWindowsVersion } from "./win-version";

const DEFAULT_OS_VERSION = '10.0.14393.0';
const DEFAULT_BACKGROUND_COLOR = 'transparent';

const getTemplate = () => {
  const content = fs.readFileSync(path.join(__dirname, `../static/templates/AppxManifest.xml.in`), 'utf-8');
  return content;
};

export const getManifestVariables = async (options: PackagingOptions): Promise < ManifestVariables > => {
  if (!options.appManifest) {
    return null;
  }

  const manifestXml = (await fs.readFile(options.appManifest)).toString();
  const minWinVersionRegEx = /MinVersion="(.*?)"/s;
  const appNameRegEx = /Executable="(.*?)"/s;
  const archRegEx = /ProcessorArchitecture="(.*?)"/s;
  const sparseRegex = /<uap10:AllowExternalContent>\s*true\s*<\/uap10:AllowExternalContent>/s;
  const publisherRegex = /Publisher="(.*?)"/s
  let manifestOsMinVersion: string;
  let manifestAppName: string;
  let manifestPackageArch: string;
  let manifestIsSparsePackage = false;
  let manifestPublisher: string

  let match = manifestXml.match(minWinVersionRegEx);
  if (match) {
    manifestOsMinVersion = match[1];
  }

  match = manifestXml.match(appNameRegEx);
  if (match) {
    manifestAppName = removeFileExtension(match[1]);
  }

  match = manifestXml.match(archRegEx);
  if (match) {
    manifestPackageArch = match[1];
  }

  match = manifestXml.match(sparseRegex);
  if (match) {
    manifestIsSparsePackage = true;
  }

  match = manifestXml.match(publisherRegex);
  if (match) {
    manifestPublisher = match[1];
  }

  const manifestVariables: ManifestVariables = {
    manifestOsMinVersion,
    manifestAppName,
    manifestPackageArch,
    manifestIsSparsePackage,
    manifestPublisher,
  }

  return manifestVariables;
}

/**
 * Generates the AppxManifest.xml file from the options provided.
 * @param options - The options for the MSIX package.
 * @returns The AppxManifest.xml content.
 */
export const manifest = async (options: PackagingOptions) => {
  if (options.appManifest) {
    const manifest = await fs.readFile(options.appManifest, 'utf-8');
    return manifest;
  }
  if (!options.manifestVariables) {
    return null;
  }

  const template = getTemplate();
  const {
    appDisplayName,
    packageIdentity,
    packageMinOSVersion,
    packageMaxOSVersionTested,
    packageVersion,
    packageDisplayName,
    publisher,
    publisherDisplayName,
    appExecutable,
    targetArch,
    packageDescription,
    packageBackgroundColor
  } = options.manifestVariables;
  const appName = removeFileExtension(appExecutable);
  const publisherName = removePublisherPrefix(publisher);
  const version = ensureWindowsVersion(packageVersion);
  const manifest = template
    .replace(/{{IdentityName}}/g, packageIdentity)
    .replace(/{{AppDisplayName}}/g, appDisplayName || packageDisplayName || appName)
    .replace(/{{MinOSVersion}}/g, packageMinOSVersion || DEFAULT_OS_VERSION)
    .replace(/{{MaxOSVersionTested}}/g, packageMaxOSVersionTested || packageMinOSVersion || DEFAULT_OS_VERSION)
    .replace(/{{Version}}/g, version)
    .replace(/{{DisplayName}}/g, packageDisplayName || appDisplayName || appName)
    .replace(/{{PublisherName}}/g, publisherName)
    .replace(/{{PublisherDisplayName}}/g, publisherDisplayName || publisherName)
    .replace(/{{PackageDescription}}/g, packageDescription || packageDisplayName || appDisplayName || appName)
    .replace(/{{PackageBackgroundColor}}/g, packageBackgroundColor || DEFAULT_BACKGROUND_COLOR)
    .replace(/{{AppExecutable}}/g, appExecutable)
    .replace(/{{ProcessorArchitecture}}/g, targetArch);

  return manifest;
};
