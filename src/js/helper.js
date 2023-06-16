import { enqueueSnackbar } from "notistack";

export const sessionLoggedIn = (session, sessionRequestInProgress) => {
  // console.log(session);
  return !sessionRequestInProgress && session.info.isLoggedIn;
};

export const displayError = (message) => enqueueSnackbar(message, { variant: "error" });
