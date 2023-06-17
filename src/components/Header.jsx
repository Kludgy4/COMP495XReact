import { AppBar, Box, Button, IconButton, Toolbar, Typography } from "@mui/material";
import { LogoutButton, useSession } from "@inrupt/solid-ui-react";
import React from "react";
import { sessionLoggedIn } from "../js/helper";
import { useNavigate } from "react-router-dom";

export default function Header({ podURL, setPodURL }) {

  const navigate = useNavigate();

  const { session } = useSession();

  return (
    <AppBar component="nav" position="sticky">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          // sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
          sx={{ flexGrow: 1 }}
        >
          Solid Versioner
        </Typography>
        {/* <Box sx={{ display: { xs: "none", sm: "block" } }}> */}
        <Box sx={{
          display: "flex", gap: "12px"
        }}>
          {podURL !== "" && (
            <Button onClick={() => setPodURL("")} color="secondary" variant="outlined">Disconnect Pod</Button>
          )
          }

          {sessionLoggedIn(session) && (
            <LogoutButton onLogout={() => { setPodURL(""); navigate("/"); }}>
              <Button variant="contained" color="secondary">Logout</Button>
            </LogoutButton>
          )}
        </Box>
      </Toolbar>
    </AppBar >
  );
}
