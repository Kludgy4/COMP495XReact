import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Paper from "@mui/material/Paper";
import React from "react";
import TreeItem from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import useWindowSize from "../js/useWindowSize";

export default function Login({ podURL, setPodURL }) {

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
        <Paper className="left" square style={{ width: leftWidth, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <Typography>Hierarchy</Typography>
          <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
          >
            <TreeItem nodeId="1" label="Applications">
              <TreeItem nodeId="2" label="Calendar" />
            </TreeItem>
            <TreeItem nodeId="5" label="Documents">
              <TreeItem nodeId="10" label="OSS" />
              <TreeItem nodeId="6" label="MUI">
                <TreeItem nodeId="8" label="index.js" />
              </TreeItem>
            </TreeItem>
          </TreeView>

        </Paper>
        <Paper className="middle" square style={{ width: middleWidth, height: "100%" }} elevation={0}></Paper>
        <div className="right" style={{ width: rightWidth, height: "100%" }}></div>
      </div>
      <Paper className="bottom" style={{ height: bottomHeight }} elevation={2}></Paper>
    </div >
  );
}
