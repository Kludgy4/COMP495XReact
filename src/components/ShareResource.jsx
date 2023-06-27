import { Commit, FileDownload, Refresh } from "@mui/icons-material";
import { Dialog, DialogActions, DialogTitle, TextField, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import { buildThing, getFile, getSolidDataset, getThing, saveFileInContainer, saveSolidDatasetAt, setThing } from "@inrupt/solid-client";
import Button from "@mui/material/Button";
import { RequestContext } from "../context/RequestContext";
import { hasVersionPredicate } from "../js/helper";
import { useSession } from "@inrupt/solid-ui-react";

export default function ShareResource({ width }) {

  const { session } = useSession();
  const { requestResource, responseHeaders, currentVersion, metadataURL, versionLocation } = useContext(RequestContext);

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
    requestResource(responseHeaders.url, parseInt(loadVersion, 10));
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
    requestResource(responseHeaders.url);
  };

  // React.useEffect(() => {
  //   // TODO: RESET VERSION TEXT BOX
  // }, [metaset]);

  return (
    <div className="resourceVersions" style={{ width: width }}>
      ShareResource.jsx
      <Button variant="contained">Share</Button>
    </div >
  );
}