import { Commit, FileDownload } from "@mui/icons-material";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, TextField, Typography } from "@mui/material";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { buildThing, createContainerAt, createContainerInContainer, getInteger, getSolidDataset, getThing, getUrl, saveSolidDatasetAt, setThing } from "@inrupt/solid-client";
import Button from "@mui/material/Button";
import { POSIX } from "@inrupt/vocab-common-rdf";
import { PodContext } from "../context/PodContext";
import { RequestContext } from "../context/RequestContext";
import { displayError } from "../js/helper";
import { useSession } from "@inrupt/solid-ui-react";

export default function ResourceVersions({ width }) {

  const { session, sessionRequestInProgress } = useSession();
  const { response, metadataURL } = useContext(RequestContext);
  const { podURL } = useContext(PodContext);

  const [metaset, setMetaset] = useState(null);
  const [currentVersion, setLatestVersion] = useState(0);

  const hasVersionPredicate = "https://client-comp495x.duckdns.org/ns/hasVersion";
  const versionedInPredicate = "https://client-comp495x.duckdns.org/ns/versionedIn";

  React.useEffect(() => { if (metadataURL !== "") getNewMetaset(); }, [metadataURL]);
  const getNewMetaset = async () => {
    let metaset = await getSolidDataset(metadataURL, { fetch: session.fetch });
    let metathing = getThing(metaset, response.url);
    // Check we weren't given a scuffed description resource
    if (metathing !== null) {
      // Retrieve the current version for display
      let currentVersion = getInteger(metathing, hasVersionPredicate);
      if (currentVersion === null) {
        // Resource is currently unversioned, add metadata to support versioning
        metathing = buildThing(metathing).addInteger(hasVersionPredicate, 1).build();
        metaset = setThing(metaset, metathing);

        metaset = await saveSolidDatasetAt(metadataURL, metaset, { fetch: session.fetch });
        metathing = getThing(metaset, response.url);
        currentVersion = getInteger(metathing, hasVersionPredicate);
      }

      const baseVersionLocation = getUrl(metathing, versionedInPredicate);
      if (baseVersionLocation === null) {
        // No location is currently provisioned for this resource, so provision one and add location as metadata
        // 1. Check if versioning container already exists at Pod URL base, if not, create it
        const versioningContainerURL = podURL + ".versions/";
        const r = await session.fetch(versioningContainerURL);
        if (r.status === 404) {
          // Make versioning container
          await createContainerInContainer(podURL, { fetch: session.fetch, slugSuggestion: ".versions" });
        }

        // 2. Create versioning folder
        // console.log(response.url);
        // const versioningContainer = versioningContainerURL;
        // console.log(versioningContainer);
        const baseLength = podURL.length;
        if (!response.url.startsWith(podURL)) {
          displayError("Pod URL not a part of resource URL");
          return;
        }
        const resourceVersionContainerURL = versioningContainerURL + response.url.substring(baseLength) + "/";
        try {
          const re = await createContainerAt(resourceVersionContainerURL, { fetch: session.fetch });
          console.log(re);
        } catch (e) {
          // container already exists!!!
          // console.log(e);
        }

        // 3. Link file to versioning folder
        metathing = buildThing(metathing).addUrl(versionedInPredicate, resourceVersionContainerURL).build();
        metaset = setThing(metaset, metathing);
        metaset = await saveSolidDatasetAt(metadataURL, metaset, { fetch: session.fetch });
      }
      console.log(baseVersionLocation);

      setMetaset(metaset);
      setLatestVersion(currentVersion);
      // const timeCreated = getInteger(thing, POSIX.mtime);
      // console.log(currentVersion);

    } else {
      // No metadata????? ERROR!
      throw Error("No Description Resource found???");
    }
  };

  React.useEffect(() => {
    // TODO: UPDATE AVAILABLE VERSIONS OF RESOURCE TO SELECT
  }, [currentVersion]);

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
    console.log("TODO: Commit new version");
  };

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
          <Button color="secondary" onClick={() => handleClose(false)}>No</Button>
          <Button color="success" onClick={() => handleClose(true)} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </div >
  );
}