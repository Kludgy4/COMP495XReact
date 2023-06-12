import React from "react";
import useResponsiveWidth from "../js/useResponsiveWidth";
import useWindowSize from "../js/useWindowSize";

export default function AdminDash() {
  const [width, height] = useWindowSize();
  const contentWidth = useResponsiveWidth(width);
  return (
    <div id="mainContent" style={{ width: contentWidth }}>
      admin
    </div>
  );
}
