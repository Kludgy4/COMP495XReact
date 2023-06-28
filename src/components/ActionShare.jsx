import { Button, Typography } from "@mui/material";
import React, { useContext } from "react";
import { buildThing, createAcl, createAclFromFallbackAcl, getAgentAccess, getAgentDefaultAccess, getFallbackAcl, getResourceAcl, getResourceInfo, getResourceInfoWithAcl, getSolidDataset, getThing, hasAccessibleAcl, hasAcl, hasFallbackAcl, hasResourceAcl, isContainer, saveAclFor, saveSolidDatasetAt, setAgentDefaultAccess, setAgentResourceAccess, setThing } from "@inrupt/solid-client";
import { RequestContext } from "../context/RequestContext";
import { Share } from "@mui/icons-material";
import { universalAccess } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";

// Checks there is a resource ACL available, creates one if not
const tryInitAcl = async (resourceInfo, fetch) => {

  if (!hasAccessibleAcl(resourceInfo)) return;

  // 1. Get a resource ACL file, new if not available, exisiting if is available
  let aclDataset = getResourceAcl(resourceInfo);
  if (!hasResourceAcl(resourceInfo) && hasFallbackAcl(resourceInfo)) {
    console.log("Creating new resource acl");
    aclDataset = createAclFromFallbackAcl(resourceInfo);
  }

  // 2. Save modified Resource ACL
  if (aclDataset !== null) {
    console.log("Saving modified resource acl");
    await saveAclFor(resourceInfo, aclDataset, { fetch });
  }
  return aclDataset;
};

export default function ActionShare() {

  const { session } = useSession();
  const { requestURL, versionLocation } = useContext(RequestContext);

  const shareResource = async () => {
    if (!session.info.webId) return;

    console.log(`WIP: Share resource ${requestURL}`);

    const shareAppWebID = "https://comp495x.duckdns.org/ShareApp/profile/card#me";

    // 3. Create resource acl and grant resource access to the ShareApp WebID 
    const resourceInfo = await getResourceInfoWithAcl(requestURL, { fetch: session.fetch });
    await tryInitAcl(resourceInfo, session.fetch);
    await universalAccess.setAgentAccess(requestURL, shareAppWebID, { read: true }, { fetch: session.fetch });

    // 4. Create an acl for the folder with this resource's versions,
    //    and grant ShareApp WebID access to child resources
    const versionsResourceInfo = await getResourceInfoWithAcl(versionLocation, { fetch: session.fetch });
    let aclDataset = await tryInitAcl(versionsResourceInfo, session.fetch);
    if (!hasAccessibleAcl(versionsResourceInfo) || !aclDataset) return;
    aclDataset = setAgentDefaultAccess(aclDataset, shareAppWebID, { read: true, append: false, write: false, control: false });
    await saveAclFor(versionsResourceInfo, aclDataset, { fetch: session.fetch });
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
