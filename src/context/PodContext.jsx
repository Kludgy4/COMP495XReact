import React, { createContext, useState } from "react";

export const PodContext = createContext({
  podURL: "",
  setPodURL: (podURL) => undefined,
});

export const PodContextProvider = ({ children, initial = localStorage.getItem("podURL") }) => {
  const [podURL, setPodURL] = useState(initial);

  const setPod = (url) => {
    if (url === null) {
      localStorage.removeItem("podURL");
    } else {
      localStorage.setItem("podURL", url);
    }
    setPodURL(url);
  };

  return (
    <PodContext.Provider value={{ podURL: podURL, setPodURL: setPod }}>
      {children}
    </PodContext.Provider>
  );
};
