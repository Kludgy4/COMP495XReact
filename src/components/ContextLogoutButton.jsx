import React, { useContext, useEffect, useState } from "react";
import { Button } from "@mui/material";
import { LogoutButton } from "@inrupt/solid-ui-react";
import { PodContext } from "../context/PodContext";
import { useNavigate } from "react-router-dom";

export default function ContextLogoutButton() {
  const { setPodURL } = useContext(PodContext);
  const navigate = useNavigate();

  return (
    <LogoutButton onLogout={() => { setPodURL(null); navigate("/"); }}>
      <Button variant="contained" color="secondary">Logout</Button>
    </LogoutButton>
  );
}
