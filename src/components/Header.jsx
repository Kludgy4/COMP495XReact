import { LogoutButton, useSession } from "@inrupt/solid-ui-react";
import { NavLink, useNavigate } from "react-router-dom";
import React from "react";
import { sessionLoggedIn } from "../js/helper";
import useResponsiveWidth from "../js/useResponsiveWidth";
import useWindowSize from "../js/useWindowSize";

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

  const navigate = useNavigate();

  const { session } = useSession();

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
        {sessionLoggedIn(session) && (
          <LogoutButton onLogout={() => navigate("/")}>
            <button
              style={{ fontSize: contentWidth <= 525 ? "0.75rem" : "1rem" }}
            >
              Logout
            </button>
          </LogoutButton>
        )}
      </div>
    </header>
  );
}
