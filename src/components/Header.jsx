import React from "react";
import useWindowSize from "../js/useWindowSize";
import useResponsiveWidth from "../js/useResponsiveWidth";
import { NavLink } from "react-router-dom";
import { LogoutButton } from "@inrupt/solid-ui-react";

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
      <div
        id="headerContent"
        style={{
          width: contentWidth,
          fontSize: contentWidth <= 525 ? "1rem" : "1.25rem",
        }}
      >
        <div
          style={{
            padding: "0px 20px",
            userSelect: "none",
            backgroundColor: "white",
            color: "#354866",
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          {contentWidth <= 525 ? "Thesis" : "Thesis Project"}
        </div>

        <div id="headerContentMain">
          {/* <ActiveNavLink to="/admin">Admin</ActiveNavLink>
          <ActiveNavLink to="/user">User</ActiveNavLink> */}
        </div>
        <LogoutButton>
          <button
            style={{ fontSize: contentWidth <= 525 ? "0.75rem" : "1rem" }}
          >
            Logout
          </button>
        </LogoutButton>
      </div>
    </header>
  );
}
