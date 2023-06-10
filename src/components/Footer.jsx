import React from "react";
import useResponsiveWidth from "../js/useResponsiveWidth";
import useWindowSize from "../js/useWindowSize";

export default function Header() {
  const [width, height] = useWindowSize();
  const contentWidth = useResponsiveWidth(width);

  return (
    <footer>
      <div id="footerContent" style={{ width: contentWidth }}>
        Created by Matthew Brian
      </div>
    </footer>
  );
}
