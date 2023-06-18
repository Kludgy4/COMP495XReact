import React, { useContext, useState } from "react";
import { buildThing, getInteger, getSolidDataset, getThing, saveSolidDatasetAt, setThing } from "@inrupt/solid-client";
import Button from "@mui/material/Button";
import { Commit } from "@mui/icons-material";
import { POSIX } from "@inrupt/vocab-common-rdf";
import { Paper } from "@mui/material";
import { RequestContext } from "../context/RequestContext";
import { useSession } from "@inrupt/solid-ui-react";

export default function ResourceTimeline() {

  const { session, sessionRequestInProgress } = useSession();
  const { response, metadataURL } = useContext(RequestContext);

  const [latestVersion, setLatestVersion] = useState(1);

  const versionPredicate = "https://client-comp495x.duckdns.org/ns/hasVersion";
  const getCurrentVersion = async () => {
    let metaset = await getSolidDataset(metadataURL, { fetch: session.fetch });
    let metathing = getThing(metaset, response.url);
    // Check we weren't given a scuffed description resource
    if (metathing !== null) {
      // Retrieve the current version for display
      let currentVersion = getInteger(metathing, versionPredicate);
      if (currentVersion === null) {
        // Resource is currently unversioned, add metadata to support versioning
        metathing = buildThing(metathing).addInteger(versionPredicate, 1).build();
        metaset = setThing(metaset, metathing);
        metaset = await saveSolidDatasetAt(metadataURL, metaset, { fetch: session.fetch });
        metathing = getThing(metaset, response.url);
        currentVersion = getInteger(metathing, versionPredicate);
      }

      // const timeCreated = getInteger(thing, POSIX.mtime);
      console.log(currentVersion);

    } else {
      // No metadata????? ERROR!
      throw Error("No Description Resource found???");
    }
  };

  React.useEffect(() => { if (metadataURL !== "") getCurrentVersion(); }, [metadataURL]);

  return (
    <Paper className="bottom" style={{ position: "relative" }} elevation={2}>
      <Button
        variant="contained"
        startIcon={<Commit />}
        disabled={false}
        size={"small"}
        style={{ position: "absolute", bottom: 8, right: 8 }}
        onClick={() => console.log("TODO: Commit new version")}
      >
        Commit
      </Button>
    </Paper>
  );
}