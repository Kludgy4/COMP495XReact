import { SessionProvider, LoginButton } from "@inrupt/solid-ui-react";
import React from "react";
import useWindowSize from "./js/useWindowSize";
import Header from "./components/Header";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import UserStatus from "./components/UserStatus";
import AdminDash from "./components/AdminDash";
import useResponsiveWidth from "./js/useResponsiveWidth";
import Footer from "./components/Footer";

export default function App() {
  const [width, height] = useWindowSize();
  const contentWidth = useResponsiveWidth(width);

  return (
    <>
      <Header />
      <main>
        <SessionProvider sessionId="some-id">
          <div id="mainContent" style={{ width: contentWidth }}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/user" element={<UserStatus />} />
              <Route path="/admin" element={<AdminDash />} />
            </Routes>
          </div>
        </SessionProvider>
      </main>
      <Footer />
    </>
  );
  //   return (
  //     <div id="app">
  //       <Header />

  //       <main>
  //
  <LoginButton
    oidcIssuer="https://inrupt.net"
    redirectUrl="https://localhost:3000/"
  />;
  //         </SessionProvider>
  //       </main>

  //       <footer>footer</footer>
  //     </div>
  //   );
}
