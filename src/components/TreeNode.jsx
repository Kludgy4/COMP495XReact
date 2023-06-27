import React, { useContext, useState } from "react";
import { getContainedResourceUrlAll, getContentType, getFile, getSolidDataset, isContainer } from "@inrupt/solid-client";
import { Article } from "@mui/icons-material";

import { RequestContext } from "../context/RequestContext";
import TreeItem from "@mui/lab/TreeItem";
import { pathToName } from "../js/helper";
import { useSession } from "@inrupt/solid-ui-react";

export default function TreeNode({ resourceURL }) {

  const { session } = useSession();
  const [resources, setResources] = useState([]);
  const { requestResource } = useContext(RequestContext);

  const getContainerResources = async () => {
    // Get the URL of all resources inside the container
    const containerDataset = await getSolidDataset(resourceURL, { fetch: session.fetch });
    const containedResources = await getContainedResourceUrlAll(containerDataset);
    setResources(containedResources.map((r) => {
      return <TreeNode key={r} resourceURL={r} />;
    }));
  };

  // .versions string below hides the versions container in the Pod Hierarchy, remove to allow visual
  return isContainer(resourceURL) ? pathToName(resourceURL) !== ".versions" && (
    <TreeItem
      nodeId={resourceURL}
      label={pathToName(resourceURL)}
      onClick={getContainerResources}
    >
      <TreeItem nodeId={resourceURL + "temp"} />
      {resources.map(r => r)}
    </TreeItem>
  ) : (
    <TreeItem
      nodeId={resourceURL}
      label={pathToName(resourceURL)}
      onClick={() => requestResource(resourceURL)}
      icon={<Article />}
    />
  );
}