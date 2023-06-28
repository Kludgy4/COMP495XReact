import React, { useContext, useState } from "react";
import Button from "@mui/material/Button";
import { RequestContext } from "../context/RequestContext";
import { useSession } from "@inrupt/solid-ui-react";

export default function ShareResource({ width }) {

  const { session } = useSession();
  const { sendRequest, responseHeaders, currentVersion, metadataURL, versionLocation } = useContext(RequestContext);

  return (
    <div className="resourceVersions" style={{ width: width }}>
      ShareResource.jsx
      <Button variant="contained">Share</Button>
    </div >
  );
}