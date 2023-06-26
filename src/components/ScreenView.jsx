import React, { useContext } from "react";
import { PodContext } from "../context/PodContext";
import { useNavigate } from "react-router-dom";

export default function ScreenView() {
  const { podURL } = useContext(PodContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (podURL === null) {
      navigate("/");
    }
  }, [podURL]);

  return (
    <div id="mainContent" style={{ height: "calc(100vh - 64px)" }}>
      <div id="podContent">
        content
      </div>
    </div >
  );
}
