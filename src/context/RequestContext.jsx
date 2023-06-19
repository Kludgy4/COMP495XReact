import React, { createContext, useContext, useState } from "react";
import {
  buildThing,
  createContainerAt,
  createContainerInContainer,
  getContainedResourceUrlAll,
  getContentType,
  getFile,
  getInteger,
  getSolidDataset,
  getThing,
  getUrl,
  isContainer,
  saveSolidDatasetAt,
  setThing
} from "@inrupt/solid-client";
import LinkHeader from "http-link-header";
import { PodContext } from "../context/PodContext";
import { displayError } from "../js/helper";
import { useSession } from "@inrupt/solid-ui-react";

export const RequestContext = createContext({
  requestResource: async (resourceURL) => { return null; },
  responseHeaders: new Headers(),
  resourceBody: "",
  currentVersion: 0,
  versionLocation: ""
});

export const RequestContextProvider = ({ children }) => {

  ////////////////////////////////////////////////////////////////////////////////
  /////                             Base Request                             /////
  ////////////////////////////////////////////////////////////////////////////////

  const { session } = useSession();
  const [resHeaders, setResHeaders] = useState({ headers: new Headers() });
  const [resourceBlob, setResourceBlob] = useState(new Blob());

  const fetchWrapper = async (resource, options) => {
    const fetchResource = await session.fetch(resource, options);
    // TODO: Do this better
    const fetchHeaders = {
      headers: fetchResource.headers,
      ok: fetchResource.ok,
      redirected: fetchResource.redirected,
      status: fetchResource.status,
      statusText: fetchResource.statusText,
      type: fetchResource.type,
      url: fetchResource.url
    };
    setResHeaders(fetchHeaders);

    // Continue returning (as is a wrapper)
    return fetchResource;
  };

  const requestResource = async (url) => {
    // https://docs.inrupt.com/developer-tools/api/javascript/solid-client/modules/resource_file.html
    // custom fetch to extract headers (??????) Edit: YES IT WORKED!!!
    const fileBlob = await getFile(url, { fetch: fetchWrapper });

    const contentType = getContentType(fileBlob);
    if (contentType !== null && contentType.toLowerCase().includes("text")) {
      setResourceBlob(fileBlob);
    } else {
      // TODO: Allow file to be downloaded to preview (not in browser app)
    }
  };

  ////////////////////////////////////////////////////////////////////////////////
  /////                     Automatic Blob Text Retrieval                    /////
  ////////////////////////////////////////////////////////////////////////////////

  const [body, setBody] = useState("");

  // Simple function to extract the returned body of the resource request 
  React.useEffect(() => { extractBodyText(); }, [resourceBlob]);
  const extractBodyText = async () => {
    const text = await resourceBlob.text();
    setBody(text);
  };

  ////////////////////////////////////////////////////////////////////////////////
  /////                     Automatic Metadata Retrieval                     /////
  ////////////////////////////////////////////////////////////////////////////////

  const [metadataURL, setMetadataURL] = useState("");
  React.useEffect(() => {
    // Extract and set the metadata location from the headers
    const linkHeader = resHeaders.headers.get("link");
    if (linkHeader !== null) {
      const parsedLinks = LinkHeader.parse(linkHeader);
      const metaURL = parsedLinks.rel("describedby")[0].uri;
      setMetadataURL(metaURL);
    }
  }, [resHeaders]);

  // Retrieve resource metadata for use
  React.useEffect(() => { if (metadataURL !== "") fetchResourceMeta(); }, [metadataURL]);

  // An inrupt "Thing" (https://docs.inrupt.com/developer-tools/javascript/client-libraries/reference/glossary/#term-Thing)
  const [metadataThing, setMetadataThing] = useState(null);

  // Predicates used to version resources in a pod
  const hasVersionPredicate = "https://client-comp495x.duckdns.org/ns/hasVersion";
  const versionedInPredicate = "https://client-comp495x.duckdns.org/ns/versionedIn";

  const fetchResourceMeta = async () => {
    const metaset = await fetchMetadataSet();
    const metathing = getThing(metaset, resHeaders.url);
    if (metathing === null) throw Error("Shouldn't happen after earlier validation");

    setMetadataThing(metathing);
  };

  ////////////////////////////////////////////////////////////////////////////////
  /////                     Automatic Metadata Management                    /////
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * Checks that the Resource Description "dataset" is valid, and contains what
   * is required for versioning. Adds versioning predicates if missing and sets
   * up folders required for versioning
   * @param {*} metaset The SolidDataset
   * @returns 
   */
  const fetchMetadataSet = async () => {
    let metaset = await getSolidDataset(metadataURL, { fetch: session.fetch });
    const metathing = getThing(metaset, resHeaders.url);
    // Check if the Description Resource is of the expected configuration
    if (metathing === null) {
      // No metadata at all? ERROR!
      throw Error("No Description Resource found??? AHHHH");
    }

    // Retrieve the current version for display
    metaset = await validateCurrentVersion(metaset, metathing);
    metaset = await validateVersionLocation(metaset, metathing);
    return metaset;
  };

  /**
   * Checks if the current version of the resource is available. If none is available,
   * this resource is assumed to be unversioned, and is initialised with hasVersion = 1
   * @param {*} metaset 
   * @param {*} metathing 
   * @returns The valid "metaset" containing the current resource version
   */
  const validateCurrentVersion = async (metaset, metathing) => {
    const currentVersion = getInteger(metathing, hasVersionPredicate);
    if (currentVersion === null) {
      // Resource is currently unversioned, add metadata to support versioning
      metathing = buildThing(metathing).addInteger(hasVersionPredicate, 1).build();
      metaset = setThing(metaset, metathing);

      metaset = await saveSolidDatasetAt(metadataURL, metaset, { fetch: session.fetch });
    }
    return metaset;
  };

  const { podURL } = useContext(PodContext);

  /**
   * Checks if this resource has a valid versioning location attached to it. If none
   * has been set yet, it initialises this location at the root of the current pod,
   * and sets that in the metadata.
   * @param {*} metaset 
   * @param {*} metathing 
   * @returns The valid "metaset" containing the location this resource's versions are stored in
   */
  const validateVersionLocation = async (metaset, metathing) => {
    const resourceVersionLocation = getUrl(metathing, versionedInPredicate);
    if (resourceVersionLocation === null) {
      // No location is currently provisioned for this resource, so provision one and add location as metadata
      // 1. Check if versioning container already exists at Pod URL base, if not, create it
      const versioningContainerURL = podURL + ".versions/";
      const r = await session.fetch(versioningContainerURL);
      if (r.status === 404) {
        // Make versioning container
        await createContainerInContainer(podURL, { fetch: session.fetch, slugSuggestion: ".versions" });
      }

      // 2. Create versioning folder
      // console.log(response.url);
      // const versioningContainer = versioningContainerURL;
      // console.log(versioningContainer);
      const baseLength = podURL.length;
      if (!resHeaders.url.startsWith(podURL)) {
        displayError("Pod URL not a part of resource URL");
        return;
      }
      const resourceVersionContainerURL = versioningContainerURL + resHeaders.url.substring(baseLength) + "/";
      try {
        const re = await createContainerAt(resourceVersionContainerURL, { fetch: session.fetch });
        console.log(re);
      } catch (e) {
        // container already exists!!!
        // console.log(e);
      }

      // 3. Link file to versioning folder
      metathing = buildThing(metathing).addUrl(versionedInPredicate, resourceVersionContainerURL).build();
      metaset = setThing(metaset, metathing);
      metaset = await saveSolidDatasetAt(metadataURL, metaset, { fetch: session.fetch });

    }
    return metaset;
  };

  ////////////////////////////////////////////////////////////////////////////////
  /////                     Automatic Metadata Extraction                    /////
  ////////////////////////////////////////////////////////////////////////////////

  const [currentVersion, setCurrentVersion] = useState(0);
  const [versionLocation, setVersionLocation] = useState("");
  React.useEffect(() => {
    // Metadata is always validated before being set
    if (metadataThing !== null) {
      const curver = getInteger(metadataThing, hasVersionPredicate);
      const verloc = getUrl(metadataThing, versionedInPredicate);

      setCurrentVersion(curver);
      setVersionLocation(verloc);
    }
  }, [metadataThing]);

  return (
    <RequestContext.Provider value={{
      requestResource: requestResource,
      responseHeaders: resHeaders,
      resourceBody: body,
      currentVersion: currentVersion,
      versionLocation: versionLocation
    }}
    >
      {children}
    </RequestContext.Provider>
  );
};
