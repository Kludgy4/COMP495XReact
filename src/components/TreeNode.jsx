import React, { useContext } from "react";
import { getContainedResourceUrlAll, getContentType, getFile, getSolidDataset, getSourceUrl, isContainer } from "@inrupt/solid-client";
import { Article } from "@mui/icons-material";
import { RequestContext } from "../context/RequestContext";
import TreeItem from "@mui/lab/TreeItem";
import { useSession } from "@inrupt/solid-ui-react";

export default function TreeNode({ resourceURL }) {

  const [data, setData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const { session, sessionRequestInProgress } = useSession();
  const { setBlob, setHeaders } = useContext(RequestContext);

  const getContainerData = async (containerName) => {
    const data = await getSolidDataset(containerName, { fetch: session.fetch });
    // Get the URL of all resources inside the container
    const resources = await getContainedResourceUrlAll(data);
    return resources.map((r) => {
      return <TreeNode key={r} resourceURL={r} />;
    });
  };

  const getFileData = async (url) => {
    // const supportedType = [
    //   "text/*",
    // ];
    // https://docs.inrupt.com/developer-tools/api/javascript/solid-client/modules/resource_file.html
    const fileBlob = await getFile(url, { fetch: session.fetch });
    // console.log("TODO: Retrieve request data and store/display centrally (context?)");
    const contentType = getContentType(fileBlob);
    if (contentType !== null && contentType.toLowerCase().includes("text")) {
      setBlob(fileBlob);
    }
  };

  const fetchResource = async () => {
    console.log("retrieving...");
    let resourceData;
    if (isContainer(resourceURL)) {
      resourceData = await getContainerData(resourceURL);
    } else {
      resourceData = await getFileData(resourceURL);
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
    <TreeItem nodeId={resourceURL} label={extractResourceName(resourceURL)} onClick={fetchResource}>
      <TreeItem nodeId={resourceURL + "temp"} />
      {!isLoading && data.map(r => r)}
    </TreeItem>
  ) : (
    <TreeItem nodeId={resourceURL} label={extractResourceName(resourceURL)} onClick={fetchResource} icon={<Article />} />
  );
}
