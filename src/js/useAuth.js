import { useContext, useEffect, useState } from "react";
import { useSession } from "@inrupt/solid-ui-react";
import { PodContext } from "../context/PodContext";

export default function useAuth() {
  const { session, sessionRequestInProgress } = useSession();
  const { podURL } = useContext(PodContext);
  const [loggedIn, setIsLoggedIn] = useState(false);
  const [sessionIn, setSessionIn] = useState(false);
  const [podIn, setPodIn] = useState(false);

  useEffect(() => {
    setSessionIn(session.info.isLoggedIn);
    setPodIn(podURL !== null);
    setIsLoggedIn(
      !sessionRequestInProgress &&
      session.info.isLoggedIn &&
      podURL !== null
    );
  }, [sessionRequestInProgress, session.info.isLoggedIn, podURL]);

  return { loggedIn, sessionIn, podIn };
}
