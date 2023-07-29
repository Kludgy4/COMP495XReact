import { WithServerResourceInfo, buildThing, createContainerAt, getInteger, getLinkedResourceUrlAll, getResourceInfo, getSolidDataset, getStringNoLocale, getThing, getUrl, getUrlAll, saveSolidDatasetAt, setThing } from "@inrupt/solid-client";
import { DCTERMS, POSIX, RDF } from "@inrupt/vocab-common-rdf";
import { pathToContainer, pathToName } from "./helper";
import { contentTypePredicate, hasVersionPredicate, versionedInPredicate } from "./urls";

// Layer is sometimes inefficiently used given its virtual nature. This means it often
// doubles up on operations when used in practise, but it is convenient to use 

/**
 * Retrieves a resource, and its description resource, and returns them in a "handle" with
 * which future versioned queries can be made. Base resource data or metadata can be directly
 * read from this handle, which is passed into getVersionedDataset
 * @param url The "base" url of the resource to retrieve a versioned handle for
 * @param options The options used in Inrupt functions (here a fetch request)
 * @returns A handle of base resource info that can be used to make versioned queries
 */
export const getVersionedDatasetHandle = async (url: string, options): Promise<VersionedDatasetHandle> => {

  // Get the resource
  let baseDataset;
  try {
    baseDataset = await getResourceInfo(url, options);
  } catch (e) {
    throw new Error(`Resource at '${url}' is not available: ${e.message}`);
  }

  // Get the metadata
  const linkedResources = getLinkedResourceUrlAll(baseDataset);
  const metadataResources = linkedResources["describedby"];
  if (metadataResources === undefined) {
    throw new Error(`No Solid compliant metadata file available for '${url}'`);
  }
  const metadataURL = metadataResources[0];

  // Get metadata SolidDataset differently depending on whether you are getting a handle
  // for the base resource, or a versioned resource
  let metaset;
  try {
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
 * Performs a versioned query to the dataset using the provided handle. Equivalent to passing in a
 * url and version, as if that version were passed in the header of the request, abstracts away from
 * the application details required to simulate versioning. Returns an Inrupt SolidDataset and a new handle
 * for the resource if required. As if calling getSolidDataset + a version.
 * @param versionedDatasetHandle Used to make efficient, error-checked versioned queries close to how real interface would
 * @param version The version of the resource to retrieve. Can only be in the range [1 <= version <= hasVersion]
 * @param options The options used in Inrupt functions (here a fetch request)
 * @returns An Inrupt "SolidDataset" that represents the queried resource
 */
export const getVersionedDataset = async (versionedDatasetHandle: VersionedDatasetHandle, version: number, options) => {

  const handle = versionedDatasetHandle;
  const meta = versionedDatasetHandle.meta;

  // Is this resource versioned?
  if (meta.hasVersion === null || meta.versionedIn === null) {
    if (version === 1) {
      // The resource requested is the base resource, so versioned request successful
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
 * @param baseResourceURL The URL of the unversioned resource
 * @param metadataURL The URL pointing to the "description resource" of the base resource
 * @param authFetch A function that can make authenticated fetch requests to the above resources
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
