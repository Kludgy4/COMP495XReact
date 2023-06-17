import { getContainedResourceUrlAll, getSolidDataset, getSourceUrl, isContainer } from "@inrupt/solid-client";
import { Article } from "@mui/icons-material";
import React from "react";
import TreeItem from "@mui/lab/TreeItem";
import { useSession } from "@inrupt/solid-ui-react";

export default function TreeNode({ resourceURL }) {

  const [data, setData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const { session, sessionRequestInProgress } = useSession();

  const getContainerData = async (containerName) => {
    const data = await getSolidDataset(containerName, { fetch: session.fetch });
    // Get the URL of all resources inside the container
    const resources = await getContainedResourceUrlAll(data);
    return resources.map((r) => {
      return <TreeNode key={r} resourceURL={r} />;
    });
  };

  const getFileData = async (url) => {
    console.log("actually get the file data with a request somehow and store centrally (context?)");
    // return { url: r, data: null, isFolder: true };
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
