import { Article, PrecisionManufacturing } from "@mui/icons-material";
import { ListItemIcon, Menu, MenuItem } from "@mui/material";
import React, { useContext, useState } from "react";
import { createSolidDataset, deleteSolidDataset, getContainedResourceUrlAll, getContentType, getFile, getSolidDataset, isContainer, saveSolidDatasetAt, setThing } from "@inrupt/solid-client";
import { RequestContext } from "../context/RequestContext";
import TreeItem from "@mui/lab/TreeItem";
import genAddrThing from "../js/addressGenerator";
import { pathToName } from "../js/helper";
import { useSession } from "@inrupt/solid-ui-react";

export default function TreeNode({ resourceURL }) {

  const { session } = useSession();
  const [resources, setResources] = useState([]);
  const { sendRequest } = useContext(RequestContext);

  const getContainerResources = async () => {
    // Get the URL of all resources inside the container
    const containerDataset = await getSolidDataset(resourceURL, { fetch: session.fetch });
    const containedResources = await getContainedResourceUrlAll(containerDataset);
    const resources = containedResources.map((r) => {
      return <TreeNode key={r} resourceURL={r} />;
    });
    setResources(resources);
  };

  const [contextMenu, setContextMenu] = useState(null);
  const handleContextMenu = (event) => {
    event.preventDefault();
    setContextMenu(contextMenu === null ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 } : null);
  };

  const genAddrInFolder = async () => {
    const addrDatasetLocation = resourceURL + "address.ttl";

    // await deleteSolidDataset(addrDatasetLocation, { fetch: session.fetch });

    let addrDataset = createSolidDataset();
    const addrThing = genAddrThing(addrDatasetLocation);
    addrDataset = setThing(addrDataset, addrThing);
    await saveSolidDatasetAt(addrDatasetLocation, addrDataset, { fetch: session.fetch });

    handleClose();
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  // .versions string below hides the versions container in the Pod Hierarchy, remove to allow visual
  return isContainer(resourceURL) ? pathToName(resourceURL) !== ".versions" && (
    <TreeItem
      nodeId={resourceURL}
      label={<div onContextMenu={handleContextMenu} >{pathToName(resourceURL)}</div>}
      onClick={getContainerResources}
    >
      <TreeItem key={resourceURL + "temp"} nodeId={resourceURL + "temp"} />
      {resources.map(r => r)}
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <MenuItem onClick={() => genAddrInFolder()}>
          <ListItemIcon>
            <PrecisionManufacturing />
          </ListItemIcon>
          Generate address here
        </MenuItem>
      </Menu>
    </TreeItem>
  ) : (
    <TreeItem
      nodeId={resourceURL}
      label={pathToName(resourceURL)}
      onClick={() => sendRequest(resourceURL)}
      icon={<Article />}
    />
  );
}
