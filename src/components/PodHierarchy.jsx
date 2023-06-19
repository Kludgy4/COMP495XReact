import { Button, Paper, Typography } from "@mui/material";
import React, { useContext } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { PodContext } from "../context/PodContext";
import TreeNode from "./TreeNode";
import TreeView from "@mui/lab/TreeView";

export default function PodHierarchy({ width }) {
  const { podURL } = useContext(PodContext);

  return (
    <Paper square style={{ width: width }} className="podHierarchy">
      <Typography className="basicHeader" style={{ textDecoration: "underline" }} >Hierarchy</Typography>
      <TreeView defaultCollapseIcon={<ExpandMoreIcon />} defaultExpandIcon={<ChevronRightIcon />}>
        <TreeNode resourceURL={podURL} />
      </TreeView>
    </Paper >
  );
}