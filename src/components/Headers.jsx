import React, { useContext } from "react";
import { RequestContext } from "../context/RequestContext";
import { Typography } from "@mui/material";

export default function Headers({ width }) {
  const { headers } = useContext(RequestContext);

  return (
    <div className="right" style={{ width: width, height: "100%" }}>
      <Typography style={{ width: "100%", padding: "8px", textDecoration: "underline" }}>Headers</Typography>
      <div id="headersContent" style={{ width: "100%", overflow: "auto" }}>
      </div>
    </div>
  );
}