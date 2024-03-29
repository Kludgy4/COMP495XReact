import React, { useContext, useState } from "react";
import { addUrl, getFile, getThing, getUrlAll, removeUrl, saveFileInContainer, saveSolidDatasetAt, setInteger, setThing } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { DCTERMS } from "@inrupt/vocab-common-rdf";
import { Commit, FileDownload, Refresh, Restore } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Typography } from "@mui/material";
import { RequestContext } from "../context/RequestContext";
import { saveUpdatedFile } from "../js/helper";
import { hasVersionPredicate } from "../js/urls";
import { getVersionedDatasetHandle } from "../js/versioningLayer";

export default function ActionVersion() {

  const { session } = useSession();
  const { requestURL, sendRequest, hasVersion, versionLocation, contributors, displayVersion, resourceBody, contentType } = useContext(RequestContext);

  const [loadVersion, setLoadVersion] = useState(1);
  const [loadVersionError, setLoadVersionError] = useState(false);

  const changeLoadVersion = (event) => {
    const ver = event.target.value;
    if (ver === "" || ver >= 1 && ver <= hasVersion) {
      setLoadVersionError(false);
      setLoadVersion(ver);
    } else {
      setLoadVersionError(true);
    }
  };

  const [openShouldCommit, setOpenShouldCommit] = useState(false);
  const promptShouldCommit = () => {
    setOpenShouldCommit(true);
  };

  const handleCloseShouldCommit = (shouldCommit) => {
    setOpenShouldCommit(false);
    if (shouldCommit) commitVersion();
  };

  const loadResourceVersion = () => {
    if (loadVersion === "") {
      setLoadVersionError(true);
      return;
    }
    sendRequest(requestURL, parseInt(loadVersion, 10));
  };

  const commitVersion = async () => {
    const options = { fetch: session.fetch };

    // 1. Copy/paste the base file into the .versions folder provisioned earlier as a version
    const baseFile = await getFile(requestURL, options);
    await saveFileInContainer(versionLocation, baseFile, { slug: hasVersion.toString(), fetch: session.fetch });

    const [baseHandle, verHandle] = await Promise.all([
      getVersionedDatasetHandle(requestURL, options),
      getVersionedDatasetHandle(versionLocation + hasVersion, options)
    ]);
    let baseMetaset = baseHandle.metaResourceInfo;
    let verMetaset = verHandle.metaResourceInfo;
    let baseMetathing = getThing(baseMetaset, baseHandle.baseURL);
    let verMetathing = getThing(verMetaset, verHandle.baseURL);

    for (const contributorWebid of getUrlAll(baseMetathing, DCTERMS.contributor)) {
      // 2. Add contributors to the metadata of the version file
      verMetathing = addUrl(verMetathing, DCTERMS.contributor, contributorWebid);
      // 3. Update the metadata of the base file (remove contributors and add +1 to version num)
      baseMetathing = removeUrl(baseMetathing, DCTERMS.contributor, contributorWebid);
    }
    baseMetathing = setInteger(baseMetathing, hasVersionPredicate, baseHandle.meta.hasVersion + 1);
    baseMetaset = setThing(baseMetaset, baseMetathing);

    // 2. cont
    verMetaset = setThing(verMetaset, verMetathing);

    await Promise.all([
      saveSolidDatasetAt(baseHandle.metaURL, baseMetaset, options),
      saveSolidDatasetAt(verHandle.metaURL, verMetaset, options)
    ]);

    sendRequest(requestURL);
  };

  const [openShouldRestore, setOpenShouldRestore] = useState(false);
  const promptShouldRestore = () => {
    setOpenShouldRestore(true);
  };

  const handleCloseShouldRestore = (shouldRestore) => {
    setOpenShouldRestore(false);
    if (shouldRestore) restoreVersion();
  };

  const restoreVersion = async () => {
    await saveUpdatedFile(resourceBody, requestURL, hasVersion, contentType, session, contributors);
    sendRequest(requestURL);
  };

  return (
    <>
      <Typography variant="body1">Latest Version: {hasVersion}</Typography>

      <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
        <Button
          variant="contained"
          startIcon={<Commit />}
          disabled={false}
          size={"small"}
          onClick={() => promptShouldCommit()}
        >
          Commit
        </Button>
        {hasVersion !== displayVersion && (
          <Button
            variant="contained"
            startIcon={<Restore />}
            disabled={false}
            size={"small"}
            onClick={() => promptShouldRestore()}
          >
            Restore
          </Button>
        )}
      </div>
      <Typography variant="body1">Load Version: </Typography>
      <TextField
        type="number"
        onChange={changeLoadVersion}
        value={loadVersion}
        size="small"
        error={loadVersionError}
        helperText={loadVersionError ? `Load Version must be between 1 and ${hasVersion}` : ""}
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
          onClick={() => sendRequest(requestURL)}
        >
          Refresh Preview
        </Button>
      </div>
      <Dialog open={openShouldCommit} onClose={() => handleCloseShouldCommit(false)}>
        <DialogTitle >
          {"Create a new resource version?"}
        </DialogTitle>
        <DialogActions>
          <Button color="secondary" onClick={() => handleCloseShouldCommit(false)} autoFocus>No</Button>
          <Button color="success" onClick={() => handleCloseShouldCommit(true)}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openShouldRestore} onClose={() => handleCloseShouldRestore(false)}>
        <DialogTitle >
          {"Overwrite the current base resource with an older version?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            To restore this older version of this resource, the current resource will be overwritten. Please
            commit any changes you wish to keep before restoring.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => handleCloseShouldRestore(false)} autoFocus>No</Button>
          <Button color="success" onClick={() => handleCloseShouldRestore(true)}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
      <Typography variant="body1">Contributors: </Typography>
      {contributors.length > 0 ?
        contributors.map((c, i) =>
          <Typography key={c} variant="body2">{i + 1}. {c}</Typography>
        ) : (
          <Typography variant="body2">No edits made yet... </Typography>
        )}
    </ >
  );
}