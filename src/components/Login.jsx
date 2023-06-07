import { LoginButton, useSession } from "@inrupt/solid-ui-react";
import useWindowSize from "../js/useWindowSize";
import useResponsiveWidth from "../js/useResponsiveWidth";
import Card from "@mui/material/Card";
import { CardActions, CardContent, CardHeader } from "@mui/material";
import TextField from "@mui/material/TextField";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const [width, height] = useWindowSize();
  const contentWidth = useResponsiveWidth(width);
  const location = useLocation();
  const navigate = useNavigate();

  const [oidcIssuer, setOidcIssuer] = React.useState("");
  const [invalidOidc, setInvalidOidc] = React.useState(false);

  const textChange = (event) => {
    setInvalidOidc(false);
    setOidcIssuer(event.target.value);
  };

  const { session, sessionRequestInProgress, fetch, login, logout } =
    useSession();

  React.useEffect(() => {
    if (!sessionRequestInProgress && session.info.isLoggedIn) {
      navigate("/admin");
    }
    // console.log(session.info.isLoggedIn);
  }, [session]);

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
            id="outlined-basic"
            label="Solid ID Provider"
            onChange={textChange}
            placeholder="https://login.inrupt.com/"
            value={oidcIssuer}
            variant="outlined"
            error={invalidOidc}
            helperText={invalidOidc ? "Invalid Provider" : ""}
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
