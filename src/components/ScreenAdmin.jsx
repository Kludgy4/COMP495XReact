import { Button, Dialog, DialogActions, DialogTitle, TextField, Typography, fabClasses } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { createSolidDataset, deleteSolidDataset, getFile, getResourceInfoWithAcl, getSolidDataset, getSolidDatasetWithAcl, saveAclFor, saveSolidDatasetAt, setAgentResourceAccess, setPublicResourceAccess } from "@inrupt/solid-client";
import { displayError, tryGetResourceAcl } from "../js/helper";
import { shareAppWebID, sharedResourcesURL } from "../js/urls";
import { PodContext } from "../context/PodContext";
import { useNavigate } from "react-router-dom";
import { useSession } from "@inrupt/solid-ui-react";

export default function ScreenAdmin() {
  const { podURL } = useContext(PodContext);
  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    if (podURL === null) {
      navigate("/");
    }
  }, [podURL]);

  const [resourceURL, setResourceURL] = useState("");
  const urlChange = (event) => {
    setResourceURL(event.target.value);
  };

  const getResourceContents = async () => {
    // console.log(resourceURL);
    try {
      const info = await getFile(resourceURL, { fetch: session.fetch });
      console.log(info);
      console.log(session.info);
    } catch (e) {
      displayError(e.message);
    }
  };

  const resetSharedResources = async () => {
    // Reset the dataset
    try {
      const sharedResourcesDataset = await getSolidDataset(sharedResourcesURL, { fetch: session.fetch });
      await deleteSolidDataset(sharedResourcesDataset, { fetch: session.fetch });
    } catch (e) {
      displayError(e.message);
    }
    const blankDataset = createSolidDataset();
    const createdDataset = await saveSolidDatasetAt(sharedResourcesURL, blankDataset, { fetch: session.fetch });

    // Reset ACL to allow appending
    const datasetWithAcl = await getSolidDatasetWithAcl(sharedResourcesURL, { fetch: session.fetch });
    let updatedAcl = tryGetResourceAcl(datasetWithAcl);
    // TODO: Can we prevent reading but still allow appending for users sharing data?
    updatedAcl = setPublicResourceAccess(updatedAcl, { read: true, append: true, write: false, control: false });
    updatedAcl = setAgentResourceAccess(updatedAcl, shareAppWebID, { read: true, append: true, write: true, control: true });
    await saveAclFor(datasetWithAcl, updatedAcl, { fetch: session.fetch });
  };

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const closeConfirmDialog = (s) => {
    setConfirmDialogOpen(false);
    if (s) resetSharedResources();
  };

  return (
    <div id="mainContent" style={{ height: "calc(100vh - 64px)" }}>
      <div id="adminContent" style={{ flexDirection: "column", gap: "16px" }}>
        <Typography>{session.info.webId}</Typography>
        <div style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
          <Typography>Shared Resources</Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => setConfirmDialogOpen(true)}
          >
            Reset
          </Button>
        </div>
        <Dialog
          open={confirmDialogOpen}
          onClose={() => closeConfirmDialog(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Disconnect all shared resources?"}
          </DialogTitle>
          <DialogActions>
            <Button onClick={() => closeConfirmDialog(false)} color="secondary">No</Button>
            <Button onClick={() => closeConfirmDialog(true)} autoFocus color="secondary">
              Yes
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div >
  );
}
