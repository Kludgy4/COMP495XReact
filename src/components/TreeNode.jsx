import React, { useContext } from "react";
import { getContainedResourceUrlAll, getContentType, getFile, getSolidDataset, isContainer } from "@inrupt/solid-client";
import { Article } from "@mui/icons-material";
import LinkHeader from "http-link-header";
import { RequestContext } from "../context/RequestContext";
import TreeItem from "@mui/lab/TreeItem";
import { useSession } from "@inrupt/solid-ui-react";

export default function TreeNode({ resourceURL }) {

  const [data, setData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const { session, sessionRequestInProgress } = useSession();
  const { setBlob, setMetadataURL, setResponse } = useContext(RequestContext);

  const getContainerData = async (containerName) => {
    const data = await getSolidDataset(containerName, { fetch: session.fetch });
    // Get the URL of all resources inside the container
    const resources = await getContainedResourceUrlAll(data);
    return resources.map((r) => {
      return <TreeNode key={r} resourceURL={r} />;
    });
  };

  const fetchWrapper = async (resource, options) => {
    const fetchData = await session.fetch(resource, options);
    const sanitizedData = {
      headers: fetchData.headers,
      ok: fetchData.ok,
      redirected: fetchData.redirected,
      status: fetchData.status,
      statusText: fetchData.statusText,
      type: fetchData.type,
      url: fetchData.url
    };
    setResponse(sanitizedData);

    // Get metadata
    const link = sanitizedData.headers.get("link");
    const linkParsed = LinkHeader.parse(link);
    const metaURL = linkParsed.rel("describedby")[0].uri;
    setMetadataURL(metaURL);


    return fetchData;
  };

  const getResourceData = async (url) => {
    // const supportedType = [
    //   "text/*",
    // ];
    // https://docs.inrupt.com/developer-tools/api/javascript/solid-client/modules/resource_file.html
    // custom fetch to extract headers (??????) Edit: YES IT WORKED!!!
    const fileBlob = await getFile(url, { fetch: fetchWrapper });

    const contentType = getContentType(fileBlob);
    if (contentType !== null && contentType.toLowerCase().includes("text")) {
      setBlob(fileBlob);
    }
  };

  const getData = async () => {
    console.log("retrieving...");
    let resourceData;
    if (isContainer(resourceURL)) {
      resourceData = await getContainerData(resourceURL);
    } else {
      resourceData = await getResourceData(resourceURL);
    }
    setData(resourceData);
  };

  React.useEffect(() => {
    if (data !== null) setIsLoading(false);
  }, [data]);

  const extractResourceName = (url) => {
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

  return isContainer(resourceURL) ? (
    <TreeItem nodeId={resourceURL} label={extractResourceName(resourceURL)} onClick={getData}>
      <TreeItem nodeId={resourceURL + "temp"} />
      {!isLoading && data.map(r => r)}
    </TreeItem>
  ) : (
    <TreeItem nodeId={resourceURL} label={extractResourceName(resourceURL)} onClick={getData} icon={<Article />} />
  );
}
