import Button from "@mui/material/Button";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Commit } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Paper from "@mui/material/Paper";
import React from "react";
import TextField from "@mui/material/TextField";
import TreeNode from "./TreeNode";
import TreeView from "@mui/lab/TreeView";
import Typography from "@mui/material/Typography";
import fileClient from "solid-file-client";
import { useNavigate } from "react-router-dom";
import { useSession } from "@inrupt/solid-ui-react";
import useWindowSize from "../js/useWindowSize";

export default function VersionHub({ podURL, setPodURL }) {

  const { session, sessionRequestInProgress } = useSession();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (podURL === "") {
      navigate("/");
    }
  }, [podURL]);

  const [width, height] = useWindowSize();

  const [leftWidth, setLeftWidth] = React.useState("20%");
  const [middleWidth, setMiddleWidth] = React.useState("80%");
  const [rightWidth, setRightWidth] = React.useState("20%");
  const [bottomHeight, setBottomHeight] = React.useState("15%");

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <div id="mainContent">
        <Paper className="left" square style={{ width: leftWidth, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", overflow: "auto" }}>
          <Typography style={{ width: "100%", padding: "8px", textDecoration: "underline" }}>Hierarchy</Typography>
          <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
          >
            <TreeNode resourceURL={podURL} />
          </TreeView>
        </Paper>
        <Paper className="middle" square style={{ width: middleWidth, height: "100%" }} elevation={0}>
          file
        </Paper>
        <div className="right" style={{ width: rightWidth, height: "100%" }}>
          <Typography style={{ width: "100%", padding: "8px", textDecoration: "underline" }}>Headers</Typography>
          <div id="headersContent" style={{ width: "100%", overflow: "auto" }}>

          </div>
        </div>
      </div>
      <Paper className="bottom" style={{ height: bottomHeight, position: "relative" }} elevation={2}>
        <Button
          variant="contained"
          startIcon={<Commit />}
          disabled={false}
          size={"small"}
          style={{ position: "absolute", bottom: 8, right: 8 }}
          onClick={() => console.log("TODO: Commit new version")}
        >
          Commit
        </Button>
      </Paper>
    </div >
  );
}
