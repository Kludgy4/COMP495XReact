import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getContentType,
  getFile,
  getInteger,
  getThing,
  getUrl,
} from "@inrupt/solid-client";
import { hasVersionPredicate, versionedInPredicate } from "../js/urls";
import LinkHeader from "http-link-header";
import { PodContext } from "../context/PodContext";
import { getVersionedResourceDescriptionSet } from "../js/helper";
import { useSession } from "@inrupt/solid-ui-react";

export const RequestContext = createContext({
  requestURL: "",
  requestVersion: -1,
  sendRequest: (resourceURL, version = -1) => { return null; },
  responseHeaders: new Headers(),
  resourceBody: "",
  metadataURL: { url: "" },
  currentVersion: 0,
  versionLocation: "",
  displayVersion: -1
});


export const RequestContextProvider = ({ children }) => {

  ////////////////////////////////////////////////////////////////////////////////
  /////                             Base Request                             /////
  ////////////////////////////////////////////////////////////////////////////////

  const [versionedRequest, setVersionedRequest] = useState({ url: "", version: -1 });

  // ENTRY POINT for requesting new resources
  const sendRequest = (url, version = -1) => { setVersionedRequest({ url, version }); return null; };
  // If a new resource is requested, fetch it for display
  useEffect(() => { if (versionedRequest.url !== "") { fetchResource(); } }, [versionedRequest]);

  const [resourceBlob, setResourceBlob] = useState(new Blob());
  const [body, setBody] = useState("");
  const [displayVersion, setDisplayVersion] = useState(-1);

  const fetchResource = async () => {

    // Retrieve base resource  
    const fileBlob = await getFile(versionedRequest.url, { fetch: fetchWrapper });
    if (versionedRequest.version === -1) {

      setBlobToBody(fileBlob);
    }
  };

  const [versionMeta, setVersionMeta] = useState({ versionedIn: "", hasVersion: -1 });

  React.useEffect(() => { retrieveVersionedBody(); }, [versionMeta]);
  const retrieveVersionedBody = async () => {

    // No resource yet (probably on app load)
    if (versionMeta.versionedIn === "") return;

    // We have queried the latest version, so this function call is invalid
    if (versionedRequest.version === -1) {
      setDisplayVersion(versionMeta.hasVersion);
      return;
    }

    // Retrieve the requested resource version
    if (versionMeta.hasVersion === versionedRequest.version) {
      // base resource instead
      sendRequest(versionedRequest.url);
    } else {
      // Get and display the versioned resource in place of the actual resource
      const resourceVersionLocation = versionMeta.versionedIn + versionedRequest.version;
      const fileBlob = await getFile(resourceVersionLocation, { fetch: session.fetch });
      setBlobToBody(fileBlob);
      setDisplayVersion(versionedRequest.version);
    }
  };

  const setBlobToBody = async (blob) => {
    const contentType = getContentType(blob);
    if (contentType !== null && contentType.toLowerCase().includes("text")) {
      setResourceBlob(blob);
      setBody(await blob.text());
    } else {
      // TODO: Allow nontext blob to be downloaded instead to preview (not in browser app)
    }
  };

  // https://docs.inrupt.com/developer-tools/api/javascript/solid-client/modules/resource_file.html
  // custom fetch to extract headers (??????) Edit: YES IT WORKED!!!
  const { session } = useSession();
  const [resHeaders, setResHeaders] = useState({ headers: new Headers(), url: "" });

  const [metadataRequest, setMetadataRequest] = useState({ url: "" });

  const [metadataThing, setMetadataThing] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [versionLocation, setVersionLocation] = useState("");
  const { podURL } = useContext(PodContext);

  const fetchWrapper = async (resource, options) => {
    const fetchedResource = await session.fetch(resource, options);

    const { headers, ok, redirected, status, statusText, type, url } = fetchedResource;
    const fetchResponse = { headers, ok, redirected, status, statusText, time: Date.now(), type, url };
    setResHeaders(fetchResponse);

    // Set the retrieved location of the metadata
    const descResURI = headersToDescResURI(headers);
    setMetadataRequest({ url: descResURI });
    // Retrieve it
    const metaset = await getVersionedResourceDescriptionSet(podURL, versionedRequest.url, descResURI, session.fetch);
    if (metaset === null) {
      setMetadataThing(null);
      setCurrentVersion(0);
      setVersionLocation("");
      return fetchedResource;
    }

    const metathing = getThing(metaset, resource);
    if (metathing === null) throw Error("Shouldn't happen after earlier validation");

    // An inrupt "Thing" (https://docs.inrupt.com/developer-tools/javascript/client-libraries/reference/glossary/#term-Thing)
    setMetadataThing(metathing);
    let hasVersion = getInteger(metathing, hasVersionPredicate);
    hasVersion = (hasVersion === null ? 0 : hasVersion);
    setCurrentVersion(hasVersion);
    let versionedIn = getUrl(metathing, versionedInPredicate);
    versionedIn = (versionedIn === null ? "" : versionedIn);
    setVersionLocation(versionedIn);
    setVersionMeta({ versionedIn, hasVersion });

    // Continue returning (as is a wrapper)
    return fetchedResource;
  };

  // TODO: Extract
  const headersToDescResURI = (headers) => {
    const linkHeader = headers.get("link");

    if (linkHeader !== null) {
      const parsedLinks = LinkHeader.parse(linkHeader);
      const descResURI = parsedLinks.rel("describedby")[0].uri;
      return descResURI;
    }
    return null;
  };

  return (
    <RequestContext.Provider value={{
      requestURL: versionedRequest.url,
      requestVersion: versionedRequest.version,
      sendRequest: sendRequest,
      responseHeaders: resHeaders,
      resourceBody: body,
      metadataURL: metadataRequest,
      currentVersion: currentVersion,
      versionLocation: versionLocation,
      displayVersion: displayVersion
    }}
    >
      {children}
    </RequestContext.Provider>
  );
};
