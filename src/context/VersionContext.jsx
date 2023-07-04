import { DCTERMS, POSIX, RDF } from "@inrupt/vocab-common-rdf";
import React, { createContext, useState } from "react";
import { getInteger, getLinkedResourceUrlAll, getResourceInfo, getSolidDataset, getStringNoLocale, getThing, getUrl } from "@inrupt/solid-client";
import { hasVersionPredicate, versionedInPredicate } from "../js/urls";

export const VersionContext = createContext({
  getVersionedDataset: (baseURL, version, options) => undefined,
  getVersionedMetadata: (baseURL, options) => undefined,
});

export const VersionContextProvider = ({ children }) => {

  const getVersionedDataset = async (baseURL, version, options) => {

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
    if (version === 1) return getSolidDataset(baseURL, options);

    // Versioned case
    const versionedURL = metadata[versionedInPredicate] + version;
    return getSolidDataset(versionedURL, options);
  };

  const getURLMetadata = async (url, options) => {
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
    const pred = "http://www.w3.org/ns/ma-ont#format";
    return {
      [hasVersionPredicate]: getInteger(metathing, hasVersionPredicate),
      [versionedInPredicate]: getUrl(metathing, versionedInPredicate),
      [RDF.type]: getUrl(metathing, RDF.type),
      [DCTERMS.modified]: getInteger(metathing, DCTERMS.modified),
      [pred]: getStringNoLocale(metathing, pred),
      [POSIX.mtime]: getInteger(metathing, POSIX.mtime),
      [POSIX.size]: getInteger(metathing, POSIX.size)
    };
  };

  return (
    <VersionContext.Provider value={{ getVersionedDataset, getURLMetadata }}>
      {children}
    </VersionContext.Provider>
  );
};

