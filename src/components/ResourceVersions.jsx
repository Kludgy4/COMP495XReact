import { Commit, FileDownload } from "@mui/icons-material";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, TextField, Typography } from "@mui/material";
import React, { useCallback, useContext, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { RequestContext } from "../context/RequestContext";

export default function ResourceVersions({ width }) {

  const { currentVersion } = useContext(RequestContext);

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

  const loadResourceVersion = () => {
    if (loadVersion === "") {
      setLoadVersionError(true);
      return;
    }
    console.log(`TODO: Load resource version ${loadVersion}`);
  };

  const [openShouldCommit, setOpenShouldCommit] = React.useState(false);
  const promptShouldCommit = () => {
    setOpenShouldCommit(true);
  };

  const handleClose = (shouldCommit) => {
    setOpenShouldCommit(false);
    if (shouldCommit) commitVersion();
  };

  const commitVersion = () => {
    // const currFile = await getFile();
    console.log("TODO: Commit new version");
  };

  // React.useEffect(() => {
  //   // TODO: RESET VERSION TEXT BOX
  // }, [metaset]);

  return (
    <div className="resourceVersions" style={{ width: width }}>
      {currentVersion !== 0 ? (<>
        <Typography className="basicHeader" style={{ textDecoration: "underline" }} >Versions</Typography>
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
        />
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<FileDownload />}
          disabled={false}
          size={"small"}
          onClick={() => loadResourceVersion()}
        >
          Load
        </Button>
      </>
      ) : (
        <div>No resource selected</div>
      )}
      <Dialog
        open={openShouldCommit}
        onClose={handleClose}
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
    </div >
  );
}