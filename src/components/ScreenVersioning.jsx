import React, { useContext } from "react";
import { PodContext } from "../context/PodContext";
import PodHierarchy from "./PodHierarchy";
import RequestHeaders from "./RequestHeaders";
import ResourceDisplay from "./ResourceDisplay";
import ResourceVersions from "./ResourceVersions";
import { useNavigate } from "react-router-dom";
import useWindowSize from "../js/useWindowSize";

export default function ScreenVersioning() {
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
        <ResourceVersions width={rightWidth} />
        <ResourceDisplay width={middleWidth} />
      </div>
      <RequestHeaders />
    </div >
  );
}
