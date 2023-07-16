import React, { useContext, useEffect, useState } from "react";
import { Button, MenuItem, Paper, Select, Switch, TextField, Typography } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { RequestContext } from "../context/RequestContext";

export default function ResourceDisplay({ width }) {
  const { requestURL, displayVersion, resourceBody, hasVersion, sendRequest } = useContext(RequestContext);

  const [highlightLanguage, setHighlightLanguage] = useState("turtle");

  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editorText, setEditorText] = useState("");

  useEffect(() => {
    // Can only edit the latest version
    setCanEdit(displayVersion === hasVersion);
  }, [displayVersion, hasVersion]);

  useEffect(() => {
    if (canEdit || editing) {
      setEditorText(resourceBody);
    }
  }, [resourceBody, canEdit, editing]);

  const handleLanguageChange = (event) => {
    setHighlightLanguage(event.target.value);
  };

  const handleEditingChange = (event) => {
    setEditing(event.target.checked);
  };

  const handleEditorTextChange = (e) => {
    setEditorText(e.target.value);
  };

  const saveUpdatedFile = () => {
    console.log(`Saving\n${editorText}\nat\n${requestURL}`);
    // TODO: update metadata to include the current user
    // Update the file


    setEditing(false);
    sendRequest(requestURL);
  };

  return (
    <Paper className="resourceDisplay" square style={{ width: width, maxHeight: "100%" }} elevation={0}>
      <div id="filePreviewInfo">
        {editing ? (
          <div className="filePreviewInfoBox">
            <Button onClick={saveUpdatedFile}>Save</Button>
          </div>
        ) : (
          <div className="filePreviewInfoBox">
            <Typography variant="subtitle1">Version: {displayVersion}</Typography>
          </div>
        )}
        {canEdit &&
          <div className="filePreviewInfoBox">
            <Switch
              checked={editing}
              onChange={handleEditingChange}
              inputProps={{ "aria-label": "controlled" }}
            />
          </div>
        }
        <div className="filePreviewInfoBox" style={{ width: "140px" }}>
          <Typography variant="subtitle1">Language</Typography>
          <Select fullWidth labelId="languageLabel" label="Language" value={highlightLanguage} onChange={handleLanguageChange} variant="outlined">
            <MenuItem value={"javascript"}>JavaScript</MenuItem>
            <MenuItem value={"markdown"}>Markdown</MenuItem>
            <MenuItem value={"turtle"}>Turtle</MenuItem>
          </Select>
        </div>
      </div>
      {
        editing ? (
          <TextField
            multiline
            value={editorText}
            fullWidth
            style={{
              overflow: "scroll",
              height: "100%"
            }}
            onChange={handleEditorTextChange}
          >
            editor
          </TextField>
        ) : resourceBody === "" ? (
          <Typography>This resource is either empty, or not plaintext. It cannot be previewed...</Typography>

        ) : (
          <SyntaxHighlighter
            id="syntax"
            language={highlightLanguage}
            showLineNumbers={true}
            style={materialDark}
          >
            {resourceBody}
          </SyntaxHighlighter>
        )

      }
    </Paper >
  );
}
