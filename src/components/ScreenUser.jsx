import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PodContext } from "../context/PodContext";
import PodHierarchy from "./PodHierarchy";
import RequestHeaders from "./RequestHeaders";
import ResourceActions from "./ResourceActions";
import ResourceDisplay from "./ResourceDisplay";

export default function ScreenUser() {
  const { podURL } = useContext(PodContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (podURL === null) {
      navigate("/");
    }
  }, [podURL]);

  // const { width, height } = useWindowSize();

  // const [leftWidth, setLeftWidth] = React.useState("15%");
  // const [middleWidth, setMiddleWidth] = React.useState("20%");
  // const [rightWidth, setRightWidth] = React.useState("65%");

  return (
    <div id="mainContent" style={{ height: "calc(100vh - 64px)" }}>
      <div id="podContent" style={{ height: "calc(0.75*(100vh - 64px))" }}>
        <PodHierarchy width={"15%"} />
        <ResourceActions width={"20%"} />
        <ResourceDisplay width={"65%"} />
      </div>
      <RequestHeaders />
    </div >
  );
}
