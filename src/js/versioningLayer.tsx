import { WithServerResourceInfo, buildThing, createContainerAt, getInteger, getLinkedResourceUrlAll, getResourceInfo, getSolidDataset, getStringNoLocale, getThing, getUrl, getUrlAll, saveSolidDatasetAt, setThing } from "@inrupt/solid-client";
import { DCTERMS, POSIX, RDF } from "@inrupt/vocab-common-rdf";
import { pathToContainer, pathToName } from "./helper";
import { contentTypePredicate, hasVersionPredicate, versionedInPredicate } from "./urls";

// Layer is sometimes inefficiently used given its virtual nature. This means it often
// doubles up on operations when used in practise, but its convenient to use 

/**
 * 
 * @param url 
 * @param options 
 * @returns 
 */
export const getVersionedDatasetHandle = async (url: string, options): Promise<VersionedDatasetHandle> => {
  console.log(`Getting a handle for ${url}`);
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
    // TODO: Only do if I this isn't a past version, otherwise do the latter commented thing
    // TODO: Also fix because this is slow haha
    if (url.includes(".versions")) {
      metaset = await getSolidDataset(metadataURL, options);
    } else {
      metaset = await getVersionedDescriptionResourceSet(url, metadataURL, options);
    }
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
    metaURL: metadataURL,
    metaResourceInfo: metaset,
    meta: {
      hasVersion: getInteger(metathing, hasVersionPredicate),
      versionedIn: getUrl(metathing, versionedInPredicate),
      contributors: getUrlAll(metathing, DCTERMS.contributor),
      type: getUrl(metathing, RDF.type),
      modified: getInteger(metathing, DCTERMS.modified),
      contentType: getStringNoLocale(metathing, contentTypePredicate),
      mtime: getInteger(metathing, POSIX.mtime),
      size: getInteger(metathing, POSIX.size),
    },
  };
};

/**
 * 
 * @param versionedDatasetHandle 
 * @param version 
 * @param options 
 * @returns 
 */
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
    throw new Error(`Requested resource version does not exist. Max ${meta.hasVersion}`);
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

/**
 * Checks that the Resource Description "dataset" is valid, and contains what
 * is required for versioning. Adds versioning predicates if missing and sets
 * up folders required for versioning
 * @param {*} baseResourceURL The URL of the unversioned resource
 * @param {*} metadataURL The URL pointing to the "description resource" of the base resource
 * @param {*} authFetch A function that can make authenticated fetch requests to the above resources
 * @returns A versioned resource description set that can be used to extract metadata info about a file
 */
// export const getVersionedResourceDescriptionSet = async (podURL, baseResourceURL, metadataURL, authFetch) => {
export const getVersionedDescriptionResourceSet = async (baseResourceURL, metadataURL, options) => {

  // 1. Get the description resource dataset
  let metaset = await getSolidDataset(metadataURL, options);
  let metathing = getThing(metaset, baseResourceURL);

  // 2. Check if the Description Resource is of the expected configuration
  if (metathing === null) {
    // No metadata at all? ERROR!
    throw Error("No Description Resource found??? AHHHH");
  }

  // Does this resource have a version number attached to it?
  const currentVersion = getInteger(metathing, hasVersionPredicate);
  if (currentVersion === null) {
    // Resource is currently unversioned, add metadata to support versioning starting from v1
    metathing = buildThing(metathing).addInteger(hasVersionPredicate, 1).build();
    metaset = setThing(metaset, metathing);
  }

  // Does this resource have a version location attached to it?
  const resourceVersionLocation = getUrl(metathing, versionedInPredicate);
  if (resourceVersionLocation === null) {
    // No location is currently provisioned for this resource, so provision one and add location as metadata
    const baseContainerURL = pathToContainer(baseResourceURL);

    // a. Does a .versions container exist at Pod URL base?
    const versioningContainerURL = baseContainerURL + ".versions/";
    // TODO: Can I just call createContainerInContainer and have it fail if the container already exists ie. use only 1 query?
    try {
      await getSolidDataset(versioningContainerURL, options);
    } catch (e) {
      // Create it.
      await createContainerAt(versioningContainerURL, options);
    }

    // b. Does a versioning folder exist in it for this resource?
    const resourceVersionContainerURL = versioningContainerURL + pathToName(baseResourceURL) + "/";
    try {
      // Create a versioning container as required
      // TODO: Does saveSolidDatasetAt create the containers required on the path?
      const re = await createContainerAt(resourceVersionContainerURL, options);
      console.log(re);
    } catch (e) {
      // container already exists!!!
      // console.log(e);
    }

    // c. Link description resource to versioning folder
    metathing = buildThing(metathing).addUrl(versionedInPredicate, resourceVersionContainerURL).build();
    metaset = setThing(metaset, metathing);
  }

  // 3. Save the new description resource
  if (resourceVersionLocation === null || currentVersion === null) {
    metaset = await saveSolidDatasetAt(metadataURL, metaset, options);
  }

  // Return the valid (perhaps newly initialised) metaset
  return metaset;
};

////////////////////////////////////////////////////////////

interface VersionedDatasetHandle {
  baseURL: string;
  baseResourceInfo: WithServerResourceInfo;
  metaURL: string;
  metaResourceInfo: WithServerResourceInfo;
  meta: VersionedDatasetMeta;
}


interface VersionedDatasetMeta {
  hasVersion: number | null;
  versionedIn: string | null;
  contributors: string[];
  type: string | null;
  modified: number | null;
  contentType: string | null;
  mtime: number | null;
  size: number | null;
}
