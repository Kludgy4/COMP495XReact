import { DCTERMS, POSIX, RDF } from "@inrupt/vocab-common-rdf";
import React, { createContext, useState } from "react";
import { getInteger, getLinkedResourceUrlAll, getSolidDataset, getStringNoLocale, getThing, getUrl } from "@inrupt/solid-client";
import { hasVersionPredicate, versionedInPredicate } from "../js/urls";
import { displayError } from "../js/helper";
import { getSpaceUntilMaxLength } from "@testing-library/user-event/dist/utils";
import { useSession } from "@inrupt/solid-ui-react";

export const VersionContext = createContext({
  getVersionedDataset: (baseURL, version) => undefined,
  getAvailableVersions: (baseURL) => undefined,
});

// TODO: Cache invalidation
// metadata cache
const versioningMetadata = {};

export const VersionContextProvider = ({ children, initial = localStorage.getItem("podURL") }) => {
  // TODO: Am I using the non react state cache correctly? Or should I swap to non-cache?
  // https://stackoverflow.com/questions/57444154/why-need-useref-and-not-mutable-variable
  const getVersionedDataset = async (baseURL, version, options) => {

    const metadata = await getCachedMetadata(baseURL, options);
    // The resource requested is not available if
    if (
      //   a. The version requested is outside of the available bounds
      version < 1 ||
      version > metadata[hasVersionPredicate] ||
      //   b. A versioning predicate is not available and anything but version 1 is requested
      (!metadata[hasVersionPredicate] || !metadata[versionedInPredicate]) && version !== 1
    ) {
      throw new Error("Requested resource version does not exist");
    }

    // Base case
    if (version === 1) return getSolidDataset(baseURL, options);

    // Versioned case
    const versionedURL = metadata[versionedInPredicate] + version;
    return getSolidDataset(versionedURL, options);
  };

  const getAvailableVersions = (baseURL) => {
    return 1;
  };

  return (
    <VersionContext.Provider value={{ getVersionedDataset, getAvailableVersions }}>
      {children}
    </VersionContext.Provider>
  );
};

const invalidateCachedMetadata = (baseURL) => delete versioningMetadata.baseURL;
const getCachedMetadata = async (baseURL, options) => {
  let metadata = versioningMetadata[baseURL];
  if (!metadata) {
    // Resource has not yet been retrieved
    metadata = await getURLMetadata(baseURL);
    versioningMetadata[baseURL] = metadata;
  }
  return metadata;
};

const getURLMetadata = async (url, options) => {
  // Get the metadata
  const baseDataset = await getSolidDataset(url, options);
  const linkedResources = getLinkedResourceUrlAll(baseDataset);
  const metadataURL = linkedResources["describedby"][0];

  const metaset = await getSolidDataset(metadataURL, options);
  const metathing = getThing(metaset, url);
  if (metathing === null) {
    throw new Error("No description resource metadata available");
  }

  // Extract the metadata into a convenient format
  const metadata = {};
  const hasVersion = getInteger(metathing, hasVersionPredicate);
  if (hasVersion) metadata[hasVersionPredicate] = hasVersion;

  const versionedIn = getUrl(metathing, versionedInPredicate);
  if (versionedIn) metadata[versionedInPredicate] = versionedIn;

  const type = getUrl(metathing, RDF.type);
  if (type) metadata[RDF.type] = type;

  const modified = getInteger(metathing, DCTERMS.modified);
  if (modified) metadata[DCTERMS.modified] = modified;

  const pred = "http://www.w3.org/ns/ma-ont#format";
  const format = getStringNoLocale(metathing, pred);
  if (format) metadata[pred] = format;

  const mtime = getInteger(metathing, POSIX.mtime);
  if (mtime) metadata[POSIX.mtime] = mtime;

  const size = getInteger(metathing, POSIX.size);
  if (size) metadata[POSIX.size] = size;

  return metadata;
};
