import { SessionProvider, LoginButton } from "@inrupt/solid-ui-react";
import React from "react";
import useWindowSize from "../js/useWindowSize";
import Header from "./Header";

export default function App() {
  return (
    <div id="app">
      <Header />

      <main>
        <SessionProvider sessionId="some-id">
          <LoginButton
            oidcIssuer="https://inrupt.net"
            redirectUrl="https://localhost:3000/"
          />
        </SessionProvider>
      </main>

      <footer>footer</footer>
    </div>
  );
}
