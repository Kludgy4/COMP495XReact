import { InputLabel, MenuItem, Paper, Select } from "@mui/material";
import React, { useContext, useState } from "react";
import ReactMarkdown from "react-markdown";
import { RequestContext } from "../context/RequestContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ResourceDisplay({ width }) {
  const { resourceBody } = useContext(RequestContext);

  const [highlightLanguage, setHighlightLanguage] = useState("turtle");

  const handleLanguageChange = (event) => {
    setHighlightLanguage(event.target.value);
  };

  return (
    <Paper className="resourceDisplay" square style={{ width: width }} elevation={0}>
      <div id="languageSelect">
        <InputLabel id="languageLabel">Language</InputLabel>
        <Select labelId="languageLabel" label="Language" value={highlightLanguage} onChange={handleLanguageChange} variant="outlined">
          <MenuItem value={"javascript"}>JavaScript</MenuItem>
          <MenuItem value={"markdown"}>Markdown</MenuItem>
          <MenuItem value={"turtle"}>Turtle</MenuItem>
        </Select>
      </div>
      <SyntaxHighlighter
        id="syntax"
        language={highlightLanguage}
        showLineNumbers={true}
        style={materialDark}
      >
        {resourceBody}
      </SyntaxHighlighter>
    </Paper>
  );
}
