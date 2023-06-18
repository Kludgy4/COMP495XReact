import React, { useContext } from "react";
import Headers from "./Headers";
import Paper from "@mui/material/Paper";
import { PodContext } from "../context/PodContext";
import PodHierarchy from "./PodHierarchy";
import { RequestContext } from "../context/RequestContext";
import ResourceDisplay from "./ResourceDisplay";
import ResourceTimeline from "./ResourceTimeline";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { useSession } from "@inrupt/solid-ui-react";
import useWindowSize from "../js/useWindowSize";

export default function VersionHub() {
  const { podURL } = useContext(PodContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (podURL === null) {
      navigate("/");
    }
  }, [podURL]);

  const [width, height] = useWindowSize();

  const [leftWidth, setLeftWidth] = React.useState("15%");
  const [middleWidth, setMiddleWidth] = React.useState("65%");
  const [rightWidth, setRightWidth] = React.useState("20%");

  return (
    <div id="mainContent" style={{ height: "calc(100vh - 64px)" }}>
      <div id="podContent">
        <PodHierarchy width={leftWidth} />
        <ResourceDisplay width={middleWidth} />
        <Headers width={rightWidth} />
      </div>
      <ResourceTimeline />
    </div >
  );
}
