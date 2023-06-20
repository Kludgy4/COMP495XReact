import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getContentType,
  getFile,
  getInteger,
  getThing,
  getUrl,
} from "@inrupt/solid-client";
import { getVerdResDescSet, hasVersionPredicate, versionedInPredicate } from "../js/helper";
import LinkHeader from "http-link-header";
import { PodContext } from "../context/PodContext";
import { useSession } from "@inrupt/solid-ui-react";

export const RequestContext = createContext({
  requestResource: async (resourceURL, version = -1) => { return null; },
  responseHeaders: new Headers(),
  resourceBody: "",
  metadataURL: "",
  currentVersion: 0,
  versionLocation: ""
});


export const RequestContextProvider = ({ children }) => {

  ////////////////////////////////////////////////////////////////////////////////
  /////                             Base Request                             /////
  ////////////////////////////////////////////////////////////////////////////////

  const [versionedRequest, setVersionedRequest] = useState({ url: "", version: -1 });

  // ENTRY POINT for requesting new resources
  const requestResource = (url, version = -1) => setVersionedRequest({ url, version });
  // If a new resource is requested, fetch it for display
  useEffect(() => { if (versionedRequest.url !== "") { fetchResource(); } }, [versionedRequest]);

  const [resourceBlob, setResourceBlob] = useState(new Blob());
  const [body, setBody] = useState("");

  const fetchResource = async () => {

    if (versionedRequest.version === -1) {
      // Retrieve base resource  
      const fileBlob = await getFile(versionedRequest.url, { fetch: fetchWrapper });

      //
      const contentType = getContentType(fileBlob);
      if (contentType !== null && contentType.toLowerCase().includes("text")) {
        setResourceBlob(fileBlob);
        setBody(await fileBlob.text());
      } else {
        // TODO: Allow file to be downloaded to preview (not in browser app)
      }
    } else {
      // Retrieve versioned resource
      // getFile(versionedRequest.url, { fetch: fetchWrapper });
      // const versionedFileBlob = await getFile(versionedRequest.url, { fetch: session.fetch });
      console.log("TODO: Retrieve versioned resource");
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
    const metaset = await getVerdResDescSet(podURL, versionedRequest.url, descResURI, session.fetch);
    if (metaset === null) {
      setMetadataThing(null);
      setCurrentVersion(0);
      setVersionLocation("");
      return;
    }

    const metathing = getThing(metaset, resource);
    if (metathing === null) throw Error("Shouldn't happen after earlier validation");

    // An inrupt "Thing" (https://docs.inrupt.com/developer-tools/javascript/client-libraries/reference/glossary/#term-Thing)
    setMetadataThing(metathing);
    const hasVersion = getInteger(metathing, hasVersionPredicate);
    setCurrentVersion(hasVersion === null ? 0 : hasVersion);
    const versionedIn = getUrl(metathing, versionedInPredicate);
    setVersionLocation(versionedIn === null ? "" : versionedIn);

    // Continue returning (as is a wrapper)
    return fetchedResource;
  };

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
      requestResource: requestResource,
      responseHeaders: resHeaders,
      resourceBody: body,
      metadataURL: metadataRequest,
      currentVersion: currentVersion,
      versionLocation: versionLocation
    }}
    >
      {children}
    </RequestContext.Provider>
  );
};
