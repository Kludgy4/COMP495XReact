import React, { createContext, useEffect, useState } from "react";
import {
  getContentType,
  getFile,
} from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { displayError } from "../js/helper";
import { getVersionedDataset, getVersionedDatasetHandle } from "../js/versioningLayer";

export const RequestContext = createContext({
  requestURL: "",
  requestVersion: -1,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendRequest: (resourceURL, version = -1) => { return null; },
  responseHeaders: new Headers(),
  resourceBody: "",
  metadataURL: "",
  hasVersion: 0,
  versionLocation: "",
  displayVersion: -1,
  contentType: "",
  contributors: []
});
// TODO: TODO: TODO: TODO: Remove most of these and just pass back the handle

export const RequestContextProvider = ({ children }) => {

  const resetState = () => {
    setResHeaders({ headers: new Headers(), url: "" });
    setBody("");
    setHasVersion(0);
    setVersionLocation("");
    setDisplayVersion(-1);
    setMetadataURL("");
    setContentType("");
    setContributors([]);
  };

  ////////////////////////////////////////////////////////////////////////////////
  /////                             Base Request                             /////
  ////////////////////////////////////////////////////////////////////////////////

  const [versionedRequest, setVersionedRequest] = useState({ url: "", version: -1 });

  // ENTRY POINT for requesting new resources
  const sendRequest = (url, version = -1) => { setVersionedRequest({ url, version }); return null; };
  // If a new resource is requested, fetch it for display
  useEffect(() => {
    if (versionedRequest.url !== "") fetchResource(); else resetState();
  }, [versionedRequest]);

  const { session } = useSession();
  const [body, setBody] = useState("");
  const [displayVersion, setDisplayVersion] = useState(-1);
  const [hasVersion, setHasVersion] = useState(0);
  const [versionLocation, setVersionLocation] = useState("");
  const [metadataURL, setMetadataURL] = useState("");
  const [resHeaders, setResHeaders] = useState({ headers: new Headers(), url: "" });
  const [contentType, setContentType] = useState("");
  const [contributors, setContributors] = useState([]);

  const fetchResource = async () => {

    // Retrieve base resource  
    try {
      const handle = await getVersionedDatasetHandle(versionedRequest.url, { fetch: session.fetch });
      setHasVersion(handle.meta.hasVersion);
      setVersionLocation(handle.meta.versionedIn);
      setMetadataURL(handle.metaURL);
      const queryVersion = versionedRequest.version !== -1 ? versionedRequest.version : handle.meta.hasVersion;
      setDisplayVersion(queryVersion);

      const { handle: verHandle } = await getVersionedDataset(handle, queryVersion, { fetch: session.fetch });
      setContentType(getContentType(verHandle.baseResourceInfo));
      setContributors(verHandle.meta.contributors);
      // TODO: Get blob without second nigh identical request
      const fileBlob = await getFile(verHandle.baseURL, { fetch: fetchWrapper });
      //   const fileBlob = await getFile(resourceVersionLocation, { fetch: session.fetch });
      setBlobToBody(fileBlob);

    } catch (e) {
      displayError(e.message);
      setHasVersion(0);
      setVersionLocation("");
      return;
    }
  };

  const setBlobToBody = async (blob) => {
    const contentType = getContentType(blob);
    if (contentType !== null && contentType.toLowerCase().includes("text")) {
      setBody(await blob.text());
    } else {
      // TODO: Allow nontext blob to be downloaded instead to preview (not in browser app)
    }
  };


  // custom fetch to extract headers (??????) Edit: YES IT WORKED!!!
  const fetchWrapper = async (resource, options) => {

    const fetchedResource = await session.fetch(resource, options);

    const { headers, ok, redirected, status, statusText, type, url } = fetchedResource;
    const fetchResponse = { headers, ok, redirected, status, statusText, time: Date.now(), type, url };
    setResHeaders(fetchResponse);

    return fetchedResource;
  };

  return (
    <RequestContext.Provider value={{
      requestURL: versionedRequest.url,
      requestVersion: versionedRequest.version,
      sendRequest: sendRequest,
      responseHeaders: resHeaders,
      resourceBody: body,
      metadataURL: metadataURL,
      hasVersion: hasVersion,
      versionLocation: versionLocation,
      displayVersion: displayVersion,
      contentType: contentType,
      contributors: contributors
    }}
    >
      {children}
    </RequestContext.Provider>
  );
};
