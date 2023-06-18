import React, { createContext, useState } from "react";

export const RequestContext = createContext({
  response: {},
  setResponse: (response) => undefined,
  metadataURL: "",
  setMetadataURL: (metadata) => undefined,
  fileBlob: new Blob(),
  setBlob: (blob) => undefined,
  body: "",
});

export const RequestContextProvider = ({
  children,
  initialResponse = {},
  initialMetadataURL = "",
  initialBlob = new Blob(),
  initialBody = "",
}) => {
  const [response, setResponse] = useState(initialResponse);
  const [metadataURL, setMetadataURL] = useState(initialMetadataURL);
  const [blob, setBlob] = useState(initialBlob);
  const [body, setBody] = useState(initialBody);

  const extractBodyText = async () => {
    const text = await blob.text();
    setBody(text);
  };

  React.useEffect(() => { extractBodyText(); }, [blob]);
  React.useEffect(() => { extractBodyText(); }, [blob]);

  return (
    <RequestContext.Provider value={{
      response: response,
      setResponse: setResponse,
      metadataURL: metadataURL,
      setMetadataURL: setMetadataURL,
      blob: blob,
      setBlob: setBlob,
      body: body
    }}
    >
      {children}
    </RequestContext.Provider>
  );
};
