import React from "react";
import { SessionProvider } from "@inrupt/solid-ui-react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Login from "./components/Login";
import ScreenAdmin from "./components/ScreenAdmin";
import ScreenUser from "./components/ScreenUser";
import { PodContextProvider } from "./context/PodContext";
import { RequestContextProvider } from "./context/RequestContext";
import useAuth from "./js/useAuth";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7C4DFF" },
    secondary: { main: "#DAE0E6" },
    error: { main: "#D0021B" },
    warning: { main: "#D0021B" },
  },
});

export default function App() {
  // TODO: Compress PodContextProvider and RequestContextProvider into an "AuthProvider"
  return (
    <PodContextProvider>
      <RequestContextProvider>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <SessionProvider sessionId="session" restorePreviousSession={true}>
            <SnackbarProvider autoHideDuration={5000} />
            <Header />
            <main>
              <AppRoutes />
            </main>
          </SessionProvider>
        </ThemeProvider>
      </RequestContextProvider>
    </PodContextProvider>
  );
}

const AppRoutes = () => {
  const { loggedIn } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/user"
        element={loggedIn ? <ScreenUser /> : <Navigate replace to={"/"} />}
      />
      <Route path="/admin"
        element={loggedIn ? <ScreenAdmin /> : <Navigate replace to={"/"} />}
      />
    </Routes>
  );
};
