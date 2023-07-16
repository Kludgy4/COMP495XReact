import { Button, InputLabel, MenuItem, Paper, Select, Switch, TextField, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import ReactMarkdown from "react-markdown";
import { RequestContext } from "../context/RequestContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { displayError } from "../js/helper";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ResourceDisplay({ width }) {
  const { requestURL, displayVersion, resourceBody, currentVersion, sendRequest } = useContext(RequestContext);

  const [highlightLanguage, setHighlightLanguage] = useState("turtle");

  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editorText, setEditorText] = useState("");

  useEffect(() => {
    // Can only edit the latest version
    setCanEdit(displayVersion === currentVersion);
  }, [displayVersion, currentVersion]);

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
          // <Editor onChange={handleEditorTextChange} initText={editorText}/>
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

      {/* {
        resourceBody === "" ? (
        ): (
          editing? (
              // <Editor onChange={handleEditorTextChange} initText={editorText}/>
              <TextField
      multiline
      value = { editorText }
      fullWidth
      style = {{
                overflow: "scroll",
                height: "100%"
              }}
      onChange={handleEditorTextChange}
    >
      editor
    </TextField>
  ) : (
    <SyntaxHighlighter
      id="syntax"
      language={highlightLanguage}
      showLineNumbers={true}
      style={materialDark}
    >
      {resourceBody}
    </SyntaxHighlighter>
  )) 
}*/}
    </Paper >
  );
}

const Editor = ({ onChange, initText }) => {

  const theme = {};

  const onError = (error) => displayError(error);

  const initialConfig = {
    namespace: "MyEditor",
    theme,
    onError,
    editorState: initText
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <PlainTextPlugin
        contentEditable={
          <ContentEditable
            style={{
              height: "100%",
              width: "100%",
              padding: "12px",
              border: "1px solid white"
            }}
          />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={onChange} />
    </LexicalComposer>
  );
};
