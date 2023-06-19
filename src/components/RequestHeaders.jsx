import { Paper, Typography } from "@mui/material";
import React, { useContext } from "react";
import { RequestContext } from "../context/RequestContext";

const HeadersField = ({ k, v }) => {
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
      <Typography variant="body1" color="lightblue">{k}:</Typography>
      <Typography variant="body1">{JSON.stringify(v)}</Typography>
    </div>
  );
};

export default function RequestHeaders() {
  const { responseHeaders } = useContext(RequestContext);

  return (
    <Paper className="requestHeaders" style={{ height: "100%" }} elevation={2}>
      <div id="headersContent" style={{ overflow: "auto", overflowWrap: "normal" }}>
        <div className="metasection">
          <Typography className="metatitle" variant="subtitle1">General</Typography>
          <Typography variant="body1">{responseHeaders.statusText} {responseHeaders.url}</Typography>
          <HeadersField k={"Status"} v={responseHeaders.status} />
        </div>
        <div className="metasection">
          <Typography className="metatitle" variant="subtitle1">Headers</Typography>
          {
            "headers" in responseHeaders &&
            Array.from(responseHeaders.headers.entries())
              .filter(h => h[0] !== "link")
              .map(h => <HeadersField key={h[0]} k={h[0]} v={h[1]} />)
          }
        </div>
        <div className="metasection">
          <Typography className="metatitle" variant="subtitle1" >Links</Typography>
          {responseHeaders.headers.get("link") !== null && responseHeaders.headers.get("link").split(",").map(l => {
            const linkParts = l.split(";");
            return (
              <div key={linkParts[0]}>
                <Typography color="lightblue">{linkParts[1].substring(6).slice(0, -1)}:</Typography>
                <a style={{ marginLeft: "8px" }} href={linkParts[0].trim().slice(1, -1)}>{linkParts[0]}</a>
              </div>
            );
          })}
        </div>
        <div className="metasection">
          <Typography className="metatitle" variant="subtitle1" >Meta</Typography>

        </div>
      </div>
    </Paper >
  );
}