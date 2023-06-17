import React, { useContext } from "react";
import { Paper } from "@mui/material";
import ReactMarkdown from "react-markdown";
import { RequestContext } from "../context/RequestContext";

export default function ResourceDisplay({ width }) {
  const { body } = useContext(RequestContext);

  return (
    <Paper className="middle" square style={{ width: width }} elevation={0}>
      <ReactMarkdown>{body}</ReactMarkdown>
    </Paper>
  );
}