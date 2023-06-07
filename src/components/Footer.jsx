import React from "react";
import useWindowSize from "../js/useWindowSize";
import useResponsiveWidth from "../js/useResponsiveWidth";
import { NavLink } from "react-router-dom";

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
