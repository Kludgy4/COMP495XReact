import {
  buildThing,
  createContainerAt,
  createContainerInContainer,
  getInteger,
  getSolidDataset,
  getThing,
  getUrl,
  saveSolidDatasetAt,
  setThing
} from "@inrupt/solid-client";
import { enqueueSnackbar } from "notistack";

export const displayError = (message) => enqueueSnackbar(message, { variant: "error" });

export const pathToName = (url) => {
  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Extract the part after the last slash
  var parts = url.split("/");
  var resourceName = parts[parts.length - 1];

  // If there is nothing after the last slash, extract the part between the last two slashes
  if (resourceName === "") {
    resourceName = parts[parts.length - 2];
  }

  return resourceName;
};

// Predicates used to version resources in a pod
export const versionedInPredicate = "https://client-comp495x.duckdns.org/ns/versionedIn";
export const hasVersionPredicate = "https://client-comp495x.duckdns.org/ns/hasVersion";


/**

 * @param {*} metaset The SolidDataset
 * @returns 
 */
 
/**
 * Checks that the Resource Description "dataset" is valid, and contains what
 * is required for versioning. Adds versioning predicates if missing and sets
 * up folders required for versioning
 * @param {*} podURL The base "pod" url from which the user is accessing files 
 * @param {*} baseResourceURL The URL of the unversioned resource
 * @param {*} metadataURL The URL pointing to the "description resource" of the base resource
 * @param {*} authFetch A function that can make authenticated fetch requests to the above resources
 * @returns A VERsioneD RESource DESCription SET that can be used to extract metadata info about a file
 */
export const getVerdResDescSet = async (podURL, baseResourceURL, metadataURL, authFetch) => {
  // console.log(`Getting new metadata from ${metadataURL}`);

  let metaset = await getSolidDataset(metadataURL, { fetch: authFetch });
  let metathing = getThing(metaset, baseResourceURL);
  // Check if the Description Resource is of the expected configuration
  if (metathing === null) {
    // No metadata at all? ERROR!
    throw Error("No Description Resource found??? AHHHH");
  }

  // Retrieve the current version for display
  const currentVersion = getInteger(metathing, hasVersionPredicate);
  if (currentVersion === null) {
    // Resource is currently unversioned, add metadata to support versioning
    metathing = buildThing(metathing).addInteger(hasVersionPredicate, 1).build();
    metaset = setThing(metaset, metathing);
    metaset = await saveSolidDatasetAt(metadataURL, metaset, { fetch: authFetch });
  }

  // Retrieve the resource versioing location
  const resourceVersionLocation = getUrl(metathing, versionedInPredicate);
  if (resourceVersionLocation === null) {
    // No location is currently provisioned for this resource, so provision one and add location as metadata

    // 1. Does a .versions container exist at Pod URL base?
    const versioningContainerURL = podURL + ".versions/";
    const r = await authFetch(versioningContainerURL);
    if (r.status === 404) {
      // Create it.
      await createContainerInContainer(podURL, { fetch: authFetch, slugSuggestion: ".versions" });
    }

    // 2. Does a versioning folder exist in it for this resource?
    const baseLength = podURL.length;
    if (!baseResourceURL.startsWith(podURL)) {
      displayError("Pod URL not a part of resource URL");
      return null;
    }
    const resourceVersionContainerURL = versioningContainerURL + baseResourceURL.substring(baseLength) + "/";
    try {
      const re = await createContainerAt(resourceVersionContainerURL, { fetch: authFetch });
      console.log(re);
    } catch (e) {
      // container already exists!!!
      // console.log(e);
    }

    // 3. Link file to versioning folder
    metathing = buildThing(metathing).addUrl(versionedInPredicate, resourceVersionContainerURL).build();
    metaset = setThing(metaset, metathing);
    metaset = await saveSolidDatasetAt(metadataURL, metaset, { fetch: authFetch });
  }

  // Return the valid (perhaps newly initialised) metaset
  return metaset;
};
