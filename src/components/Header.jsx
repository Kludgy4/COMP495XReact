import React, { useContext } from "react";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { PodContext } from "../context/PodContext";
import useAuth from "../js/useAuth";
import ContextLogoutButton from "./ContextLogoutButton";

const pages = [
  { name: "User", location: "/user" },
  { name: "Admin", location: "/admin" },
];

export default function Header() {

  const { setPodURL } = useContext(PodContext);
  const location = useLocation();
  const { loggedIn, sessionIn, podIn } = useAuth();

  return (
    <AppBar component="nav" position="sticky">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          style={{ marginRight: "24px" }}
        >
          Solid Versioner
        </Typography>

        <Box sx={{ flexGrow: 1, display: "flex" }}>
          {loggedIn && pages.map((page) =>
            <Link
              className={page.location === location.pathname ? "navLink navLinkCurrent" : "navLink navLinkOther"}
              to={page.location}
              key={page.name}
            >
              {page.name}
            </Link>
          )}
        </Box>
        <Box sx={{
          display: "flex", gap: "12px"
        }}>
          {podIn && (
            <Button onClick={() => setPodURL(null)} color="secondary" variant="outlined">Disconnect Pod</Button>
          )}
          {sessionIn && <ContextLogoutButton />}
        </Box>
      </Toolbar>
    </AppBar >
  );
}
