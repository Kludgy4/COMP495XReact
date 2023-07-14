import { DCTERMS, POSIX, RDF } from "@inrupt/vocab-common-rdf";
import { contentTypePredicate, hasVersionPredicate, versionedInPredicate } from "./urls";
import { getInteger, getLinkedResourceUrlAll, getResourceInfo, getSolidDataset, getStringNoLocale, getThing, getUrl } from "@inrupt/solid-client";

////////////////////////////////////////////////////////////////////////////////
/////                      Efficient Versioning Layer                      /////
////////////////////////////////////////////////////////////////////////////////

export const getVersionedDatasetHandle = async (url: string, options) => {
  // Get the metadata
  let baseDataset;
  try {
    baseDataset = await getResourceInfo(url, options);
  } catch (e) {
    throw new Error(`Resource at '${url}' is not available: ${e.message}`);
  }

  const linkedResources = getLinkedResourceUrlAll(baseDataset);
  const metadataResources = linkedResources["describedby"];
  if (metadataResources === undefined) {
    throw new Error(`No Solid compliant metadata file available for '${url}'`);
  }
  const metadataURL = metadataResources[0];

  let metaset;
  try {
    metaset = await getSolidDataset(metadataURL, options);
  } catch (e) {
    throw new Error(`Metadata at '${metadataURL}' is not available: ${e.message}`);
  }

  const metathing = getThing(metaset, url);
  if (metathing === null) {
    throw new Error("Description resource metadata ambiguously formatted");
  }

  // Extract the metadata into a convenient format
  return {
    baseURL: url,
    baseResourceInfo: baseDataset,
    meta: {
      hasVersion: getInteger(metathing, hasVersionPredicate),
      versionedIn: getUrl(metathing, versionedInPredicate),
      type: getUrl(metathing, RDF.type),
      modified: getInteger(metathing, DCTERMS.modified),
      contentType: getStringNoLocale(metathing, contentTypePredicate),
      mtime: getInteger(metathing, POSIX.mtime),
      size: getInteger(metathing, POSIX.size)
    },
  };
};

export const getVersionedDataset = async (versionedDatasetHandle: VersionedDatasetHandle, version: number, options) => {

  const handle = versionedDatasetHandle;
  const meta = versionedDatasetHandle.meta;

  if (meta.hasVersion === null || meta.versionedIn === null) {
    if (version === 1) {
      return {
        dataset: await getSolidDataset(handle.baseURL, options),
        handle: handle
      };
    }
    // A versioning predicate is not available and anything but version 1 is requested
    throw new Error("Versioning not available for this file");
  }

  // The version requested is outside of the available bounds
  if (version < 1 || version > meta.hasVersion) {
    throw new Error("Requested resource version does not exist");
  }

  // Base case
  if (version === meta.hasVersion) {
    return {
      dataset: await getSolidDataset(handle.baseURL, options),
      handle: handle
    };
  }

  // Versioned case
  const versionedURL = meta.versionedIn + version;
  return {
    dataset: await getSolidDataset(versionedURL, options),
    handle: await getVersionedDatasetHandle(versionedURL, options)
  };
};

////////////////////////////////////////////////////////////

interface VersionedDatasetHandle {
  baseURL: string;
  meta: VersionedDatasetMeta
}

interface VersionedDatasetMeta {
  hasVersion: number | null;
  versionedIn: string | null;
  type: string | null;
  modified: number | null;
  contentType: string | null;
  mtime: number | null;
  size: number | null;
}
