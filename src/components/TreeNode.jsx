import { Article, Delete, PrecisionManufacturing, Refresh } from "@mui/icons-material";
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
    const addrDataset = createSolidDataset();
    genAddrDatasetAt(addrDataset, addrDatasetLocation);
    handleClose();
  };

  const refreshAddress = async () => {
    const addrDataset = await getSolidDataset(resourceURL, { fetch: session.fetch });
    genAddrDatasetAt(addrDataset, resourceURL);
    handleClose();
  };

  const genAddrDatasetAt = async (addrDataset, url) => {
    const addrThing = genAddrThing(url);
    addrDataset = setThing(addrDataset, addrThing);
    console.log(addrDataset, url);
    await saveSolidDatasetAt(url, addrDataset, { fetch: session.fetch });

  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const createMenuItems = () => {
    const menuItems = [];

    if (isContainer(resourceURL)) {
      menuItems.push(
        <MenuItem onClick={() => genAddrInFolder()} key="genaddr">
          <ListItemIcon><PrecisionManufacturing /></ListItemIcon>
          Generate address.ttl
        </MenuItem>
      );
    } else {
      if (pathToName(resourceURL) === "address.ttl") {
        menuItems.push(
          <MenuItem onClick={() => refreshAddress()} key="refaddr">
            <ListItemIcon><Refresh /></ListItemIcon>
            Refresh Address
          </MenuItem>
        );
      }
      menuItems.push(
        <MenuItem onClick={() => deleteAddress()} key="deladdr">
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          Delete
        </MenuItem>
      );
    }

    return menuItems;
  };

  const deleteAddress = () => {
    deleteSolidDataset(resourceURL, { fetch: session.fetch });
  };

  // .versions string below hides the versions container in the Pod Hierarchy, remove to allow visual
  return <>
    {isContainer(resourceURL) ? pathToName(resourceURL) !== ".versions" && (
      <TreeItem
        nodeId={resourceURL}
        label={<div onContextMenu={handleContextMenu} >{pathToName(resourceURL)}</div>}
        onClick={getContainerResources}
      >
        <TreeItem key={resourceURL + "temp"} nodeId={resourceURL + "temp"} />
        {resources.map(r => r)}

      </TreeItem>
    ) : (
      <TreeItem
        nodeId={resourceURL}
        label={<div onContextMenu={handleContextMenu} >{pathToName(resourceURL)}</div>}
        onClick={() => sendRequest(resourceURL)}
        icon={<Article />}
      />
    )}
    <Menu
      open={contextMenu !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
    >
      {createMenuItems()}
    </Menu>
  </>;
}
