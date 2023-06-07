import { LoginButton } from "@inrupt/solid-ui-react";
import React from "react";

export default function Login() {
  return (
    <LoginButton
      oidcIssuer="https://inrupt.net"
      redirectUrl="https://localhost:3000/"
    />
  );
}
