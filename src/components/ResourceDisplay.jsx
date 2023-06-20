import { InputLabel, MenuItem, Paper, Select, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import ReactMarkdown from "react-markdown";
import { RequestContext } from "../context/RequestContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ResourceDisplay({ width }) {
  const { displayVersion, resourceBody } = useContext(RequestContext);

  const [highlightLanguage, setHighlightLanguage] = useState("turtle");

  const handleLanguageChange = (event) => {
    setHighlightLanguage(event.target.value);
  };

  return (
    <Paper className="resourceDisplay" square style={{ width: width }} elevation={0}>
      <div id="filePreviewInfo">
        <div className="filePreviewInfoBox">
          <Typography variant="subtitle1">Version: {displayVersion}</Typography>
        </div>
        <div className="filePreviewInfoBox" style={{ width: "140px" }}>
          <Typography variant="subtitle1">Language</Typography>
          <Select fullWidth labelId="languageLabel" label="Language" value={highlightLanguage} onChange={handleLanguageChange} variant="outlined">
            <MenuItem value={"javascript"}>JavaScript</MenuItem>
            <MenuItem value={"markdown"}>Markdown</MenuItem>
            <MenuItem value={"turtle"}>Turtle</MenuItem>
          </Select>
        </div>
      </div>
      {resourceBody === "" ? (<Typography>This resource is either empty, or not plaintext. It cannot be previewed...</Typography>) : (
        <SyntaxHighlighter
          id="syntax"
          language={highlightLanguage}
          showLineNumbers={true}
          style={materialDark}
        >
          {resourceBody}
        </SyntaxHighlighter>
      )}
    </Paper>
  );
}
