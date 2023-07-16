import React, { useContext } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TreeView from "@mui/lab/TreeView";
import { Paper, Typography } from "@mui/material";
import { PodContext } from "../context/PodContext";
import TreeNode from "./TreeNode";

export default function PodHierarchy({ width }) {
  const { podURL } = useContext(PodContext);

  return (
    <Paper square style={{ width: width }} className="podHierarchy">
      <Typography className="basicHeader" style={{ textDecoration: "underline" }} >Hierarchy</Typography>
      <TreeView defaultCollapseIcon={<ExpandMoreIcon />} defaultExpandIcon={<ChevronRightIcon />}>
        {podURL !== null && <TreeNode resourceURL={podURL} />}
      </TreeView>
    </Paper >
  );
}