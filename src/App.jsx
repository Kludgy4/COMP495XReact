import { Navigate, Route, Routes } from "react-router-dom";
import AdminDash from "./components/AdminDash";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Login from "./components/Login";
import React from "react";
import { SessionProvider } from "@inrupt/solid-ui-react";
import { SnackbarProvider } from "notistack";
import UserStatus from "./components/UserStatus";
import { useSession } from "@inrupt/solid-ui-react";

export default function App() {
  return (
    <SessionProvider sessionId="session" restorePreviousSession={true}>
      <SnackbarProvider autoHideDuration={5000} />
      <Header />
      <main>
        <AppRoutes />
      </main>
      <Footer />
    </SessionProvider>
  );
}

const AppRoutes = () => {
  const { session, sessionRequestInProgress } = useSession();
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/user"
        element={
          !sessionRequestInProgress && session.info.isLoggedIn ? (
            <UserStatus />
          ) : (
            <Navigate replace to={"/"} />
          )
        }
      />
      <Route
        path="/admin"
        element={
          !sessionRequestInProgress && session.info.isLoggedIn ? (
            <AdminDash />
          ) : (
            <Navigate replace to={"/"} />
          )
        }
      />
    </Routes>
  );
};
