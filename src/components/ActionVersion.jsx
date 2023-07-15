import { Commit, FileDownload, Refresh } from "@mui/icons-material";
import { Dialog, DialogActions, DialogTitle, TextField, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import { buildThing, getFile, getSolidDataset, getThing, saveFileInContainer, saveSolidDatasetAt, setThing } from "@inrupt/solid-client";
import Button from "@mui/material/Button";
import { RequestContext } from "../context/RequestContext";
import { hasVersionPredicate } from "../js/urls";
import { useSession } from "@inrupt/solid-ui-react";

export default function ActionVersion() {

  const { session } = useSession();
  const { sendRequest, responseHeaders, currentVersion, metadataURL, versionLocation } = useContext(RequestContext);

  const [loadVersion, setLoadVersion] = useState(1);
  const [loadVersionError, setLoadVersionError] = useState(false);

  const changeLoadVersion = (event) => {
    const ver = event.target.value;
    if (ver === "" || ver >= 1 && ver <= currentVersion) {
      setLoadVersionError(false);
      setLoadVersion(ver);
    } else {
      setLoadVersionError(true);
    }
  };

  const [openShouldCommit, setOpenShouldCommit] = React.useState(false);
  const promptShouldCommit = () => {
    setOpenShouldCommit(true);
  };

  const handleClose = (shouldCommit) => {
    setOpenShouldCommit(false);
    if (shouldCommit) commitVersion();
  };

  const loadResourceVersion = () => {
    if (loadVersion === "") {
      setLoadVersionError(true);
      return;
    }
    sendRequest(responseHeaders.url, parseInt(loadVersion, 10));
  };

  const commitVersion = async () => {
    // Version file using linked versioning folder
    const currFile = await getFile(responseHeaders.url, { fetch: session.fetch });
    saveFileInContainer(versionLocation, currFile, { slug: currentVersion.toString(), fetch: session.fetch });

    // Update metadata of file to reflect new version
    console.log(metadataURL.url);
    let metaset = await getSolidDataset(metadataURL.url, { fetch: session.fetch });
    let metathing = getThing(metaset, responseHeaders.url);
    metathing = buildThing(metathing).setInteger(hasVersionPredicate, currentVersion + 1).build();
    metaset = setThing(metaset, metathing);
    await saveSolidDatasetAt(metadataURL.url, metaset, { fetch: session.fetch });
    sendRequest(responseHeaders.url);
  };

  // React.useEffect(() => {
  //   // TODO: RESET VERSION TEXT BOX
  // }, [metaset]);

  return (
    <>
      <Typography variant="body1">Latest Version: {currentVersion}</Typography>
      <Button
        variant="contained"
        startIcon={<Commit />}
        disabled={false}
        size={"small"}
        onClick={() => promptShouldCommit()}
      >
        Commit
      </Button>
      <Typography variant="body1">Load Version: </Typography>
      <TextField
        type="number"
        onChange={changeLoadVersion}
        value={loadVersion}
        size="small"
        error={loadVersionError}
        helperText={loadVersionError ? `Load Version must be between 1 and ${currentVersion}` : ""}
        fullWidth
      />
      <div style={{ display: "flex", gap: "8px" }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<FileDownload />}
          disabled={false}
          size="small"
          onClick={() => loadResourceVersion()}
          style={{ flexGrow: 1, flexBasis: 0 }}
        >
          Load
        </Button>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          style={{ flexGrow: 1, flexBasis: 0 }}
          startIcon={<Refresh />}
          onClick={() => sendRequest(responseHeaders.url)}
        >
          Refresh Preview
        </Button>
      </div>
      <Dialog
        open={openShouldCommit}
        onClose={() => handleClose(false)}
      >
        <DialogTitle >
          {"Create a new resource version?"}
        </DialogTitle>
        <DialogActions>
          <Button color="secondary" onClick={() => handleClose(false)} autoFocus>No</Button>
          <Button color="success" onClick={() => handleClose(true)}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
      <Typography variant="body1">Contributors: </Typography>
      <Typography variant="body2">No edits made yet... </Typography>
    </ >
  );
}