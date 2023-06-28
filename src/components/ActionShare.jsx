import { Button, Typography } from "@mui/material";
import React, { useContext } from "react";
import { buildThing, createAcl, createAclFromFallbackAcl, getAgentAccess, getFallbackAcl, getResourceAcl, getResourceInfoWithAcl, getSolidDataset, getThing, hasAccessibleAcl, hasAcl, hasFallbackAcl, hasResourceAcl, saveAclFor, saveSolidDatasetAt, setAgentResourceAccess, setThing } from "@inrupt/solid-client";
import { RequestContext } from "../context/RequestContext";
import { Share } from "@mui/icons-material";
import { useSession } from "@inrupt/solid-ui-react";

export default function ActionShare() {

  const { session } = useSession();
  const { requestURL, sendRequest, responseHeaders, currentVersion, metadataURL, versionLocation } = useContext(RequestContext);

  const shareResource = async () => {
    console.log(`WIP: Share resource ${requestURL}`);

    const selectedResource = await getResourceInfoWithAcl(requestURL, { fetch: session.fetch });
    if (!hasAccessibleAcl(selectedResource)) return;

    // 1. Get/Create a Resource ACL to modify
    let resourceAcl = getResourceAcl(selectedResource);
    if (!hasResourceAcl(selectedResource) && hasFallbackAcl(selectedResource)) {
      console.log("Creating new resource acl");
      resourceAcl = createAclFromFallbackAcl(selectedResource);
    }


    if (resourceAcl !== null) {
      // 2. Add access to the WebID of ShareApp
      resourceAcl = setAgentResourceAccess(resourceAcl, "https://comp495x.duckdns.org/ShareApp/profile/card#me", {
        append: false,
        control: false,
        read: true,
        write: false
      });

      // 3. Save modified Resource ACL
      console.log("Saving modified resource acl");
      saveAclFor(selectedResource, resourceAcl, { fetch: session.fetch });
    }

    // const aclObj = getAgentAccess(selectedResource, session.info.webId);

    // console.log(selectedResource);
    // const fileAndAcl = getFileWithAcl(selectedResource);
    // // TODO: Also grant access to available versions (.versions/.../.acl)
    // if (aclDataset !== null && aclObj.write && aclObj.read) {
    //   console.log("Access is grantable by the current user");
    //   console.log("test" + aclDataset);
    // }

    // let metaset = await getSolidDataset(metadataURL.url, { fetch: session.fetch });


    // let metathing = getThing(metaset, responseHeaders.url);
    // metathing = buildThing(metathing).setInteger(hasVersionPredicate, currentVersion + 1).build();
    // metaset = setThing(metaset, metathing);
    // await saveSolidDatasetAt(metadataURL.url, metaset, { fetch: session.fetch });
    // sendRequest(responseHeaders.url);
  };

  return <>
    <Typography>Grant access to this app for all versions of the currently selected resource</Typography>
    <Button
      variant="contained"
      startIcon={<Share />}
      disabled={false}
      size={"small"}
      onClick={() => shareResource()}
    >
      Share
    </Button>
  </>;
}
