import { enqueueSnackbar } from "notistack";

export const sessionLoggedIn = (session, sessionRequestInProgress) => {
  // console.log(session);
  return !sessionRequestInProgress && session.info.isLoggedIn;
};

export const displayError = (message) => enqueueSnackbar(message, { variant: "error" });

export const pathToName = (url) => {
  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Extract the part after the last slash
  var parts = url.split("/");
  var resourceName = parts[parts.length - 1];

  // If there is nothing after the last slash, extract the part between the last two slashes
  if (resourceName === "") {
    resourceName = parts[parts.length - 2];
  }

  return resourceName;
};

// Predicates used to version resources in a pod
export const versionedInPredicate = "https://client-comp495x.duckdns.org/ns/versionedIn";
export const hasVersionPredicate = "https://client-comp495x.duckdns.org/ns/hasVersion";
  