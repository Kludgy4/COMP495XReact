import React, { useContext } from "react";
import Button from "@mui/material/Button";
import { Commit } from "@mui/icons-material";
import { Paper } from "@mui/material";

export default function ResourceTimeline() {
  return (
    <Paper className="bottom" style={{ position: "relative" }} elevation={2}>
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
  );
}