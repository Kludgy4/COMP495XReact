import { Button, TextField } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { PodContext } from "../context/PodContext";
import { displayError } from "../js/helper";
import { getResourceInfoWithAcl } from "@inrupt/solid-client";
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
      const info = await getResourceInfoWithAcl(resourceURL, { fetch: session.fetch });
      console.log(info);
      console.log(session.info);
    } catch (e) {
      displayError(e.message);
    }
  };

  return (
    <div id="mainContent" style={{ height: "calc(100vh - 64px)" }}>
      <div id="adminContent">
        <TextField
          label="Resource URL"
          value={resourceURL}
          onChange={urlChange}
          fullWidth
        />
        <Button
          onClick={getResourceContents}
          variant="contained"
        >
          e
        </Button>
      </div>
    </div >
  );
}
