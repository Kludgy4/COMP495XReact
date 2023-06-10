import { CardActions, CardContent, CardHeader } from "@mui/material";
import { LoginButton, useSession } from "@inrupt/solid-ui-react";
import Card from "@mui/material/Card";
import React from "react";
import TextField from "@mui/material/TextField";
import { sessionLoggedIn } from "../js/helper";
import { useNavigate } from "react-router-dom";
import useResponsiveWidth from "../js/useResponsiveWidth";
import useWindowSize from "../js/useWindowSize";

export default function Login() {
  const [width, height] = useWindowSize();
  const contentWidth = useResponsiveWidth(width);
  const navigate = useNavigate();

  const [oidcIssuer, setOidcIssuer] = React.useState("");
  const [invalidOidc, setInvalidOidc] = React.useState(false);

  const textChange = (event) => {
    setInvalidOidc(false);
    setOidcIssuer(event.target.value);
  };

  const { session } = useSession();

  React.useEffect(() => {
    if (sessionLoggedIn(session)) {
      console.log(session);
      navigate("/user");
    }
    console.log(session.info.isLoggedIn);
  }, [
    session,
    session.info.isLoggedIn,
    session.tokenRequestInProgress,
    navigate,
  ]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <Card
        style={{
          width: contentWidth >= 325 ? 325 : "100%",
          // height: contentWidth >= 525 ? 525 : "100%",
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          height: "230px",
        }}
      >
        <CardHeader title="Thesis Login" />

        <CardContent style={{ height: "100%" }}>
          <TextField
            id="idprovider-textbox"
            label="Solid ID Provider"
            onChange={textChange}
            placeholder="https://login.inrupt.com/"
            value={oidcIssuer}
            variant="outlined"
            error={invalidOidc}
            helperText={invalidOidc ? "Invalid Provider" : ""}
            fullWidth
            name="username"
          />
        </CardContent>
        <CardActions style={{ display: "flex", flexDirection: "row-reverse" }}>
          <LoginButton
            // oidcIssuer="https://inrupt.net"
            oidcIssuer={oidcIssuer}
            redirectUrl={window.location.href}
            onError={() => setInvalidOidc(true)}
          >
            <button>Login</button>
          </LoginButton>
        </CardActions>
      </Card>
    </div>
  );
}
