import { CardActions, CardContent, CardHeader, Typography } from "@mui/material";
import { LoginButton, useSession } from "@inrupt/solid-ui-react";
import React, { useContext } from "react";
import { getResourceInfo, isContainer } from "@inrupt/solid-client";
import Card from "@mui/material/Card";
import { PodContext } from "../context/PodContext";
import TextField from "@mui/material/TextField";
import useAuth from "../js/useAuth";
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

  const { session } = useSession();
  const { loggedIn, sessionIn, podIn } = useAuth();

  React.useEffect(() => {
    if (loggedIn) navigate("/version");
  }, [loggedIn]);

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
          display: "flex",
          flexDirection: "column",
          padding: "16px",
        }}
        variant="outlined"
      >
        <CardHeader title={sessionIn ? "Connect Pod" : "WebID Login"} />

        <CardContent style={{ height: "100%" }}>
          <TextField
            id="idprovider-textbox"
            name="username"
            fullWidth
            onChange={textChange}
            placeholder="https://login.inrupt.com/"
            value={oidcIssuer}
            variant={sessionIn ? "filled" : "outlined"}
            error={invalidOidc}
            helperText={invalidOidc ? "Invalid Provider" : ""}
            label={sessionIn ? session.info.webId : "Solid ID Provider"}
            disabled={sessionIn}
            style={{ marginBottom: "12px" }}
          />
          <TextField
            id="podurl-textbox"
            name="username"
            fullWidth
            onChange={podChange}
            placeholder="https://mypod.provider/"
            value={tempPodURL}
            variant={podIn ? "filled" : "outlined"}
            error={invalidTempPodURL}
            helperText={invalidTempPodURL ? "Invalid Pod URL" : ""}
            label={podIn ? "" : "Pod URL"}
            disabled={podIn}
            style={sessionIn ? {} : { display: "none" }}
          />
        </CardContent>
        <CardActions style={{ display: "flex", flexDirection: "row-reverse" }}>
          {
            !sessionIn ?
              <LoginButton
                oidcIssuer={oidcIssuer}
                redirectUrl={window.location.href}
                onError={() => setInvalidOidc(true)}
              >
                <button>{sessionIn ? "Connect" : "Login"}</button>
              </LoginButton>
              : !podIn ?
                <button onClick={submitPod}>Connect</button>
                :
                <Typography variant="h6">Connected</Typography>
          }
        </CardActions>
      </Card>
    </div >
  );
}
