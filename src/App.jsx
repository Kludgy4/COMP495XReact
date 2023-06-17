import { Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Header from "./components/Header";
import Login from "./components/Login";
import React from "react";
import { SessionProvider } from "@inrupt/solid-ui-react";
import { SnackbarProvider } from "notistack";
import VersionHub from "./components/VersionHub";
import { useSession } from "@inrupt/solid-ui-react";


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
  // TODO: Change this to somehow use useContext to pass podURL around efficiently
  const [podURL, setPodURL] = React.useState("");
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <SessionProvider sessionId="session" restorePreviousSession={true}>
        <SnackbarProvider autoHideDuration={5000} />
        <Header podURL={podURL} setPodURL={setPodURL} />
        <main>
          <AppRoutes podURL={podURL} setPodURL={setPodURL} />
        </main>
      </SessionProvider>
    </ThemeProvider>
  );
}

const AppRoutes = ({ podURL, setPodURL }) => {
  const { session, sessionRequestInProgress } = useSession();

  return (
    <Routes>
      <Route path="/" element={<Login podURL={podURL} setPodURL={setPodURL} />} />
      <Route
        path="/versionhub"
        element={
          !sessionRequestInProgress && session.info.isLoggedIn && podURL !== null ? (
            <VersionHub podURL={podURL} setPodURL={setPodURL} />
          ) : (
            <Navigate replace to={"/"} />
          )
        }
      />
    </Routes>
  );
};
