import React, { createContext, useState } from "react";

export const RequestContext = createContext({
  headers: [],
  setHeaders: (headers) => undefined,
  fileBlob: new Blob(),
  setBlob: (blob) => undefined,
  body: "",
});

export const RequestContextProvider = ({
  children,
  initialHeaders = [],
  initialBlob = new Blob(),
  initialBody = "",
}) => {
  const [headers, setHeaders] = useState(initialHeaders);
  const [blob, setBlob] = useState(initialBlob);
  const [body, setBody] = useState(initialBody);

  const extractBodyText = async () => {
    const text = await blob.text();
    setBody(text);
  };

  React.useEffect(() => { extractBodyText(); }, [blob]);

  return (
    <RequestContext.Provider value={{
      headers: headers,
      setHeaders: setHeaders,
      blob: blob,
      setBlob: setBlob,
      body: body
    }}
    >
      {children}
    </RequestContext.Provider>
  );
};
