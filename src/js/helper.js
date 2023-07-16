import { DCTERMS, POSIX, RDF, SCHEMA_INRUPT } from "@inrupt/vocab-common-rdf";
import {
  buildThing, createAclFromFallbackAcl, createContainerAt, createContainerInContainer, getInteger, getLinkedResourceUrlAll, getResourceAcl, getResourceInfo, getSolidDataset, getStringNoLocale, getThing, getUrl, hasAccessibleAcl, hasFallbackAcl, hasResourceAcl, saveSolidDatasetAt, setThing
} from "@inrupt/solid-client";
import { contentTypePredicate, hasVersionPredicate, versionedInPredicate } from "./urls";
import { getVersionedDataset, getVersionedDatasetHandle } from "./versioningLayer";
import dayjs from "dayjs";
import { enqueueSnackbar } from "notistack";

export const displayError = (message) => enqueueSnackbar(message, { variant: "error" });

export const pathToName = (url) => {
  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Extract the part after the last slash
  const parts = url.split("/");
  let resourceName = parts[parts.length - 1];

  // If there is nothing after the last slash, extract the part between the last two slashes
  if (resourceName === "") {
    resourceName = parts[parts.length - 2];
  }

  return resourceName;
};

export const pathToContainer = (url) => {
  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Extract the part after the last slash
  const parts = url.split("/");
  const containerParts = parts.slice(0, -1);
  const containerName = containerParts.join("/") + "/";

  return containerName;
};

// Get the ACL for a given resource dataset. Creates an ACL if it is not available
export const tryGetResourceAcl = (resourceDataset) => {
  let sharedResourcesAcl;
  if (!hasResourceAcl(resourceDataset)) {
    if (!hasAccessibleAcl(resourceDataset)) {
      throw new Error("1. No perms to change access rights");
    }
    if (!hasFallbackAcl(resourceDataset)) {
      throw new Error("2. No perms to see who can access this resource");
    }
    sharedResourcesAcl = createAclFromFallbackAcl(resourceDataset);
  } else {
    sharedResourcesAcl = getResourceAcl(resourceDataset);
  }
  return sharedResourcesAcl;
};

export const extractAddressFromThing = (addressThing) => {
  const addr = {
    street: getStringNoLocale(addressThing, SCHEMA_INRUPT.streetAddress),
    postalCode: getStringNoLocale(addressThing, SCHEMA_INRUPT.postalCode),
    locality: getStringNoLocale(addressThing, SCHEMA_INRUPT.addressLocality),
    region: getStringNoLocale(addressThing, SCHEMA_INRUPT.addressRegion),
    country: getStringNoLocale(addressThing, SCHEMA_INRUPT.addressCountry),
  };
  if (
    addr.street === null ||
    addr.postalCode === null ||
    addr.locality === null ||
    addr.region === null ||
    addr.country === null
  ) {
    return null;
  }
  return addr;
};

export const convertUnixToDatestring = (timestamp) => {
  return dayjs.unix(timestamp).locale("en-au").format("DD/MM/YYYY HH:mm:ss");
};

////////////////////////////////////////////////////////////////////////////////
/////                             Address Layer                            /////
////////////////////////////////////////////////////////////////////////////////

export const getURLAddressAndVersions = async (datasetURL, options) => {

  const datasetHandle = await getVersionedDatasetHandle(datasetURL, options);
  const hasVersion = datasetHandle.meta.hasVersion !== null ? datasetHandle.meta.hasVersion : 1;

  const urlAddresses = [];
  for (let version = 1; version <= hasVersion; version++) {
    const { dataset, handle } = await getVersionedDataset(datasetHandle, version, options);

    const datasetAddressThing = getThing(dataset, datasetURL);
    if (datasetAddressThing === null) {
      console.log("Shared resource does not have address thing: ", datasetURL, dataset);
      return [];
    }
    const address = { ...extractAddressFromThing(datasetAddressThing), versionDate: handle.meta.mtime };
    if (address === null) {
      console.log("No address present in shared file");
      return [];
    }
    urlAddresses.push(address);
  }

  return urlAddresses;
};

export const addressObjToString = (o) => {
  return `${o.street}, ${o.locality} ${o.postalCode}, ${o.region}, ${o.country}`;
};


////////////////////////////////////////////////////////////////////////////////
/////                           Versioning Layer                           /////
////////////////////////////////////////////////////////////////////////////////
/*
export const getVersionedDataset = async (baseURL, version, options) => {

  const metadata = await getURLMetadata(baseURL, options);

  // The resource requested is not available if
  if (
    //   a. A versioning predicate is not available and anything but version 1 is requested
    (!metadata[hasVersionPredicate] || !metadata[versionedInPredicate]) && version !== 1 ||
    //   b. The version requested is outside of the available bounds
    version < 1 || version > metadata[hasVersionPredicate]
  ) {
    throw new Error("Requested resource version does not exist");
  }

  // Base case
  if (version === metadata[hasVersionPredicate]) return {
    dataset: await getSolidDataset(baseURL, options),
    metadata: metadata
  };

  // Versioned case
  const versionedURL = metadata[versionedInPredicate] + version;
  return {
    dataset: await getSolidDataset(versionedURL, options),
    metadata: await getURLMetadata(versionedURL, options)
  };
};

export const getURLMetadata = async (url, options) => {
  // Get the metadata
  const baseDataset = await getResourceInfo(url, options);
  const linkedResources = getLinkedResourceUrlAll(baseDataset);
  const metadataURL = linkedResources["describedby"][0];

  const metaset = await getSolidDataset(metadataURL, options);
  const metathing = getThing(metaset, url);
  if (metathing === null) {
    throw new Error("No description resource metadata available");
  }

  // Extract the metadata into a convenient format
  return {
    [hasVersionPredicate]: getInteger(metathing, hasVersionPredicate),
    [versionedInPredicate]: getUrl(metathing, versionedInPredicate),
    [RDF.type]: getUrl(metathing, RDF.type),
    [DCTERMS.modified]: getInteger(metathing, DCTERMS.modified),
    [contentTypePredicate]: getStringNoLocale(metathing, contentTypePredicate),
    [POSIX.mtime]: getInteger(metathing, POSIX.mtime),
    [POSIX.size]: getInteger(metathing, POSIX.size)
  };
};
*/
