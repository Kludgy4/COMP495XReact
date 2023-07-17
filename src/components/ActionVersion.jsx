import React, { useContext, useState } from "react";
import { addUrl, buildThing, getFile, getSolidDataset, getThing, getUrlAll, removeUrl, saveFileInContainer, saveSolidDatasetAt, setInteger, setThing } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { DCTERMS } from "@inrupt/vocab-common-rdf";
import { Commit, FileDownload, Refresh } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogTitle, TextField, Typography } from "@mui/material";
import { RequestContext } from "../context/RequestContext";
import { hasVersionPredicate } from "../js/urls";
import { getVersionedDatasetHandle } from "../js/versioningLayer";

export default function ActionVersion() {

  const { session } = useSession();
  const { requestURL, requestVersion, sendRequest, hasVersion, metadataURL, versionLocation, contributors } = useContext(RequestContext);

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
    sendRequest(requestURL, parseInt(loadVersion, 10));
  };

  const commitVersion = async () => {
    const options = { fetch: session.fetch };

    const baseFile = await getFile(requestURL, options);
    const currVersion = hasVersion.toString();
    await saveFileInContainer(versionLocation, baseFile, { slug: currVersion, fetch: session.fetch });

    // Version file using linked versioning folder
    /*const verUrl = versionLocation + currVersion;
    const verHandle = await getVersionedDatasetHandle(verUrl, options);
    console.log(verHandle);
    let [verMetaset, metaset] = await Promise.all([
      getSolidDataset(verHandle.metaURL, options),
      getSolidDataset(metadataURL, options)
    ]);

    // Update metadata of versioned file to include its contributors
    let verContributorsThing = getThing(verHandle.metaResourceInfo, verHandle.baseURL);
    let metathing = getThing(metaset, requestURL);
    const conUrls = getUrlAll(metathing, DCTERMS.contributor);
    for (const contributorWebid of conUrls) {
      verContributorsThing = addUrl(verContributorsThing, DCTERMS.contributor, contributorWebid);
      metathing = removeUrl(metathing, DCTERMS.contributor, contributorWebid);
    }
    verMetaset = setThing(verMetaset, verContributorsThing);
    console.log("saving", verMetaset, "\nat\n", verHandle.metaURL);

    // Update metadata of file to reflect new version
    console.log("latest", currVersion);
    metathing = setInteger(metathing, hasVersionPredicate, currVersion + 1);
    metaset = setThing(metaset, metathing);

    await Promise.all([
      saveSolidDatasetAt(metadataURL, metaset, options),
      saveSolidDatasetAt(verHandle.metaURL, verMetaset, options),
    ]);

    sendRequest(requestURL);*/
  };

  // React.useEffect(() => {
  //   // TODO: RESET VERSION TEXT BOX
  // }, [metaset]);

  return (
    <>
      <Typography variant="body1">Latest Version: {hasVersion}</Typography>
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
      {contributors.length > 0 ?
        contributors.map((c, i) =>
          <Typography key={c} variant="body2">{i + 1}. {c}</Typography>
        ) : (
          <Typography variant="body2">No edits made yet... </Typography>
        )}
    </ >
  );
}