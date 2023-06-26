import { AppBar, Box, Button, IconButton, Toolbar, Typography } from "@mui/material";
import { LogoutButton, useSession } from "@inrupt/solid-ui-react";
import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PodContext } from "../context/PodContext";
import { sessionLoggedIn } from "../js/helper";

const pages = [
  { name: "Version", location: "/version" },
  { name: "Share", location: "/share" },
  { name: "View", location: "/view" },
];

export default function Header() {

  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSession();
  const { podURL, setPodURL } = useContext(PodContext);

  const handleCloseNavMenu = (navLoc) => {
    if (location.pathname === navLoc) return;

    navigate(navLoc);
  };

  return (
    <AppBar component="nav" position="sticky">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
        // sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
        >
          Solid Versioner
        </Typography>
        <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
          {pages.map((page) =>
            <Button
              key={page.name}
              onClick={() => handleCloseNavMenu(page.location)}
              style={page.location === location.pathname ? { cursor: "default", borderRadius: "0", fontWeight: "bold", color: "#282828", backgroundColor: "white" } : { fontWeight: "normal" }}
              sx={{ color: "white", display: "block" }}
            >
              {page.name}
            </Button>
          )}
        </Box>
        {/* <Box sx={{ display: { xs: "none", sm: "block" } }}> */}
        <Box sx={{
          display: "flex", gap: "12px"
        }}>
          {podURL !== null && (
            <Button onClick={() => setPodURL(null)} color="secondary" variant="outlined">Disconnect Pod</Button>
          )
          }

          {sessionLoggedIn(session) && (
            <LogoutButton onLogout={() => { setPodURL(null); navigate("/"); }}>
              <Button variant="contained" color="secondary">Logout</Button>
            </LogoutButton>
          )}
        </Box>
      </Toolbar>
    </AppBar >
  );
}
