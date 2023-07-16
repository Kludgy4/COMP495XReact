import React, { useContext, useState } from "react";
import { createSolidDataset, deleteFile, getContainedResourceUrlAll, getSolidDataset, isContainer, saveFileInContainer, saveSolidDatasetAt, setThing } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { Article, Delete, Edit, NoteAdd, PrecisionManufacturing, Refresh } from "@mui/icons-material";
import TreeItem from "@mui/lab/TreeItem";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ListItemIcon, Menu, MenuItem, TextField } from "@mui/material";
import { RequestContext } from "../context/RequestContext";
import genAddrThing from "../js/addressGenerator";
import { displayError, pathToName } from "../js/helper";
import { getVersionedDatasetHandle } from "../js/versioningLayer";

export default function TreeNode({ resourceURL, parentRefresh }) {

  const { session } = useSession();
  const [resources, setResources] = useState([]);
  const { requestURL, sendRequest } = useContext(RequestContext);

  const [newResDialogOpen, setNewResDialogOpen] = useState(false);
  const [renameResDialogOpen, setRenameResDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getContainerResources = async () => {
    // Get the URL of all resources inside the container
    const containerDataset = await getSolidDataset(resourceURL, { fetch: session.fetch });
    const containedResources = await getContainedResourceUrlAll(containerDataset);
    const resources = containedResources.map((r) => {
      return <TreeNode key={r} resourceURL={r} parentRefresh={getContainerResources} />;
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
    closeContextMenu();
  };

  const refreshAddress = async () => {
    const addrDataset = await getSolidDataset(resourceURL, { fetch: session.fetch });
    closeContextMenu();
    await genAddrDatasetAt(addrDataset, resourceURL);
    sendRequest(requestURL);
  };

  const genAddrDatasetAt = async (addrDataset, url) => {
    const addrThing = genAddrThing(url);
    addrDataset = setThing(addrDataset, addrThing);
    console.log(addrDataset, url);
    await saveSolidDatasetAt(url, addrDataset, { fetch: session.fetch });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const createMarkdownResource = async (newResourceName) => {
    console.log(`Creating a new file at ${resourceURL + newResourceName}`);

    const fileType = "text/markdown";
    const filename = newResourceName + ".md";

    try {
      await saveFileInContainer(
        resourceURL,
        new File([], filename, { type: fileType }),
        { slug: filename, contentType: fileType, fetch: session.fetch }
      );
      getContainerResources();

    } catch (e) {
      displayError(`Creating ${filename} at ${resourceURL} failed`);
    }
  };

  const renameResource = (newname) => {
    console.log(`Editing file with name ${resourceURL} to be name ${newname}`);
  };

  const deleteAddress = async () => {
    const verHandle = await getVersionedDatasetHandle(resourceURL, { fetch: session.fetch });
    // Delete versions in background
    try {
      await deleteFile(resourceURL, { fetch: session.fetch });
      if (parentRefresh) parentRefresh();
      console.log(`deleting ${verHandle.meta.versionedIn}`);
      if (verHandle.meta.versionedIn) {
        const containerDataset = await getSolidDataset(verHandle.meta.versionedIn, { fetch: session.fetch });
        const containedResources = await getContainedResourceUrlAll(containerDataset, { fetch: session.fetch });
        await Promise.all(containedResources.map(resurl => deleteFile(resurl, { fetch: session.fetch })));
        deleteFile(verHandle.meta.versionedIn, { fetch: session.fetch });
      }
    } catch (e) {
      displayError(e.message);
      console.log(e);
    }
    sendRequest("");
  };

  const createMenuItems = () => {
    const menuItems = [];

    if (isContainer(resourceURL)) {
      menuItems.push(
        <MenuItem onClick={() => setNewResDialogOpen(true)} key="createfile">
          <ListItemIcon><NoteAdd /></ListItemIcon>
          Create File
        </MenuItem>
      );
      menuItems.push(
        <MenuItem onClick={() => genAddrInFolder()} key="genaddr">
          <ListItemIcon><PrecisionManufacturing /></ListItemIcon>
          Generate address.ttl
        </MenuItem>
      );
    } else {
      menuItems.push(
        <MenuItem onClick={() => setRenameResDialogOpen(true)} key="renamefile">
          <ListItemIcon><Edit /></ListItemIcon>
          Rename File
        </MenuItem>
      );
      if (pathToName(resourceURL) === "address.ttl") {
        menuItems.push(
          <MenuItem onClick={() => refreshAddress()} key="refaddr">
            <ListItemIcon><Refresh /></ListItemIcon>
            Refresh Address
          </MenuItem>
        );
      }
      menuItems.push(
        <MenuItem onClick={() => setDeleteDialogOpen(true)} key="deladdr">
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          Delete
        </MenuItem>
      );
    }

    return menuItems;
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
      onClose={closeContextMenu}
      anchorReference="anchorPosition"
      anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
    >
      {createMenuItems()}
    </Menu>
    <TextInputDialog
      title="Create Markdown File?"
      body="Create a new markdown file with the following name"
      handleInputSuccess={createMarkdownResource}
      open={newResDialogOpen}
      setOpen={setNewResDialogOpen}
      closeContextMenu={closeContextMenu}
    />
    <TextInputDialog
      title="Rename File?"
      body="Rename the selected markdown file with the following name"
      handleInputSuccess={renameResource}
      open={renameResDialogOpen}
      setOpen={setRenameResDialogOpen}
      closeContextMenu={closeContextMenu}
    />
    <ConfirmDialog
      body="Delete this file?"
      handleConfirm={deleteAddress}
      open={deleteDialogOpen}
      setOpen={setDeleteDialogOpen}
      closeContextMenu={closeContextMenu}
    />
  </>;
}

const TextInputDialog = ({ handleInputSuccess, title, body, open, setOpen, closeContextMenu }) => {

  const [error, setError] = useState(false);
  const [textInput, setTextInput] = useState("");

  const handleClose = () => {
    setTextInput("");
    setOpen(false);
    closeContextMenu();
  };

  const handleCloseSuccess = () => {
    if (textInput === "") {
      setError(true);
      return;
    }
    handleInputSuccess(textInput);
    handleClose();
  };

  const textChanged = (e) => {
    setTextInput(e.target.value);
    setError(false);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {body}
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="newfilename"
          type="text"
          fullWidth
          variant="standard"
          value={textInput}
          onChange={textChanged}
          error={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">Cancel</Button>
        <Button onClick={handleCloseSuccess} color="secondary">Create</Button>
      </DialogActions>
    </Dialog>
  );
};

const ConfirmDialog = ({ handleConfirm, body, open, setOpen, closeContextMenu }) => {

  const handleClose = () => {
    setOpen(false);
    closeContextMenu();
  };

  const handleCloseSuccess = () => {
    handleConfirm();
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent><DialogContentText>{body}</DialogContentText></DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">No</Button>
        <Button onClick={handleCloseSuccess} color="secondary">Yes</Button>
      </DialogActions>
    </Dialog>
  );
};