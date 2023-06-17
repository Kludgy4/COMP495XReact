import { CardActions, CardContent, CardHeader, Typography } from "@mui/material";
import { LoginButton, useSession } from "@inrupt/solid-ui-react";
import React, { useContext } from "react";
import { getResourceInfo, isContainer } from "@inrupt/solid-client";
import Card from "@mui/material/Card";
import { PodContext } from "../context/PodContext";
import TextField from "@mui/material/TextField";
import { sessionLoggedIn } from "../js/helper";
import { useNavigate } from "react-router-dom";
import useResponsiveWidth from "../js/useResponsiveWidth";
import useWindowSize from "../js/useWindowSize";

export default function Login() {
  const navigate = useNavigate();

  const [width, height] = useWindowSize();
  const contentWidth = useResponsiveWidth(width);

  const [oidcIssuer, setOidcIssuer] = React.useState("");
  const [invalidOidc, setInvalidOidc] = React.useState(false);

  const { podURL, setPodURL } = useContext(PodContext);
  const [tempPodURL, setTempPodURL] = React.useState("");
  const [invalidTempPodURL, setInvalidTempPodURL] = React.useState(false);

  const textChange = (event) => {
    setInvalidOidc(false);
    setOidcIssuer(event.target.value);
  };

  const podChange = (event) => {
    setInvalidTempPodURL(false);
    setTempPodURL(event.target.value);
  };

  const submitPod = async (event) => {
    event.preventDefault();
    console.log(`Check if following pod is valid ${tempPodURL}`);
    try {
      const info = await getResourceInfo(tempPodURL, { fetch: session.fetch });
      if (isContainer(info)) {
        setPodURL(tempPodURL);
      }
    } catch (e) {
      setInvalidTempPodURL(true);
    }
  };

  const { session, sessionRequestInProgress } = useSession();
  const [webidConnected, setWebidConnected] = React.useState(false);

  React.useEffect(() => {
    if (sessionLoggedIn(session, sessionRequestInProgress)) {
      setWebidConnected(true);
    } else {
      setWebidConnected(false);
    }
  }, [session, session.info.isLoggedIn, sessionRequestInProgress]);

  React.useEffect(() => {
    if (webidConnected && podURL !== null) {
      console.log(session);
      navigate("/versionhub");
    }
    console.log(session.info.isLoggedIn);
  }, [webidConnected, podURL]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%"
      }}
    >
      <Card
        style={{
          width: contentWidth >= 525 ? 525 : "100%",
          height: contentWidth >= 525 ? "auto" : "100%",
          // height: contentWidth >= 525 ? 525 : "100%",
          display: "flex",
          flexDirection: "column",
          padding: "16px",
        }}
        variant="outlined"
      >
        <CardHeader title={webidConnected ? "Connect Pod" : "WebID Login"} />

        <CardContent style={{ height: "100%" }}>
          <TextField
            id="idprovider-textbox"
            name="username"
            fullWidth
            onChange={textChange}
            placeholder="https://login.inrupt.com/"
            value={oidcIssuer}
            variant={webidConnected ? "filled" : "outlined"}
            error={invalidOidc}
            helperText={invalidOidc ? "Invalid Provider" : ""}
            label={webidConnected ? session.info.webId : "Solid ID Provider"}
            disabled={webidConnected}
            style={{ marginBottom: "12px" }}
          />
          <TextField
            id="podurl-textbox"
            name="username"
            fullWidth
            onChange={podChange}
            placeholder="https://mypod.provider/"
            value={tempPodURL}
            variant={podURL !== null ? "filled" : "outlined"}
            error={invalidTempPodURL}
            helperText={invalidTempPodURL ? "Invalid Pod URL" : ""}
            label={podURL !== null ? "" : "Pod URL"}
            disabled={podURL !== null}
            style={webidConnected ? {} : { display: "none" }}
          />
        </CardContent>
        <CardActions style={{ display: "flex", flexDirection: "row-reverse" }}>
          {webidConnected ?
            podURL !== null ?
              <Typography variant="h6">Connected</Typography> :
              <button onClick={submitPod}>Connect</button> :
            <LoginButton
              // oidcIssuer="https://inrupt.net"
              oidcIssuer={oidcIssuer}
              redirectUrl={window.location.href}
              onError={() => setInvalidOidc(true)}
            >
              <button>{webidConnected ? "Connect" : "Login"}</button>
            </LoginButton>
          }

        </CardActions>
      </Card>
    </div >
  );
}
