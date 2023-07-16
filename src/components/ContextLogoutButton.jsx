import React, { useContext } from "react";
import { LogoutButton } from "@inrupt/solid-ui-react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { PodContext } from "../context/PodContext";

export default function ContextLogoutButton() {
  const { setPodURL } = useContext(PodContext);
  const navigate = useNavigate();

  return (
    <LogoutButton onLogout={() => { setPodURL(null); navigate("/"); }}>
      <Button variant="contained" color="secondary">Logout</Button>
    </LogoutButton>
  );
}
