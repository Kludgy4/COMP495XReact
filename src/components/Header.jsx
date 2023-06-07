import React from "react";
import useWindowSize from "../js/useWindowSize";
import useResponsiveWidth from "../js/useResponsiveWidth";
import { NavLink } from "react-router-dom";

const ActiveNavLink = (props) => {
  return (
    <NavLink
      className={({ isActive }) => {
        return isActive ? "headerButtonActive" : "headerButton";
      }}
      {...props}
    />
  );
};

export default function Header() {
  const [width, height] = useWindowSize();
  const contentWidth = useResponsiveWidth(width);

  return (
    <header>
      <div id="headerContent" style={{ width: contentWidth }}>
        <div
          style={{
            padding: "10px 20px",
            userSelect: "none",
            backgroundColor: "white",
            color: "#354866",
          }}
        >
          Thesis Project
        </div>
        <div id="headerContentMain">
          {/* <ActiveNavLink to="/admin">Admin</ActiveNavLink>
          <ActiveNavLink to="/user">User</ActiveNavLink> */}
        </div>
        <ActiveNavLink to="/">Login</ActiveNavLink>
      </div>
    </header>
  );
}
