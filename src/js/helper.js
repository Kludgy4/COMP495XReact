import { enqueueSnackbar } from "notistack";

export const sessionLoggedIn = (session) => {
  console.log(session);
  return !session.tokenRequestInProgress && session.info.isLoggedIn;
};

export const displayError = (message) => enqueueSnackbar(message, { variant: "error" });
