import "dayjs/locale/en-gb";
import { Button, Dialog, DialogActions, DialogTitle, TextField, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { History, Search } from "@mui/icons-material";
import React, { useContext, useEffect, useState } from "react";
import { convertUnixToDatestring, displayError, extractAddressFromThing, tryGetResourceAcl } from "../js/helper";
import { createSolidDataset, deleteSolidDataset, getFile, getInteger, getLinkedResourceUrlAll, getResourceInfo, getSolidDataset, getSolidDatasetWithAcl, getStringNoLocale, getThing, getUrl, getUrlAll, saveAclFor, saveSolidDatasetAt, setAgentResourceAccess, setPublicResourceAccess } from "@inrupt/solid-client";
import { hasVersionPredicate, shareAppWebID, sharedResourcePredicate, sharedResourcesURL, versionedInPredicate } from "../js/urls";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ContextLogoutButton from "./ContextLogoutButton";
import { DataGrid } from "@mui/x-data-grid";
import LinearProgressWithLabel from "./LinearProgressWithLabel";
import { POSIX } from "@inrupt/vocab-common-rdf";
import { PodContext } from "../context/PodContext";
import { QueryEngine } from "@comunica/query-sparql-solid";
import { RequestContext } from "../context/RequestContext";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import useResponsiveWidth from "../js/useResponsiveWidth";
import { useSession } from "@inrupt/solid-ui-react";
import useWindowSize from "../js/useWindowSize";

export default function ScreenAdmin() {
  const { podURL } = useContext(PodContext);
  const navigate = useNavigate();
  const { session } = useSession();

  const [windowWidth, windowHeight] = useWindowSize();
  const contentWidth = useResponsiveWidth(windowWidth);

  useEffect(() => {
    if (podURL === null) {
      navigate("/");
    }
  }, [podURL]);

  return (
    <div id="mainContent" style={{ height: "calc(100vh - 64px)" }}>
      <div id="adminContent" style={{ flexDirection: "column", alignItems: "center" }}>
        {session.info.webId !== shareAppWebID ? (
          <>
            <div>Please log out, then log back in with an admin WebID to access this screen</div>
            <ContextLogoutButton />
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: contentWidth, flexGrow: 1, overflow: "scroll" }}>
            <AddressHistory />
            <AddressAtDate />
            <TestingArea />
          </div>
        )}
      </div>
    </div >
  );
}

const AddressHistory = () => {

  const { session } = useSession();
  const { sendRequest, versionLocation } = useContext(RequestContext);
  const { podURL } = useContext(PodContext);

  const [addressHistory, setAddressHistory] = useState([]);
  const [searchWebid, setSearchWebid] = useState("");
  const [searchWebidError, setSearchWebidError] = useState("");

  useEffect(() => {
    setSearchWebidError("");
  }, [searchWebid]);

  const getURLAddressAndVersions = async (datasetURL, thingURL = datasetURL) => {
    const urlAddresses = [];

    // 1. Get base resource
    const sharedURLDataset = await getSolidDataset(datasetURL, { fetch: session.fetch });
    // TODO: Fix weird hash fragment shennanigans
    const sharedAddressThing = getThing(sharedURLDataset, datasetURL + "#" + thingURL);
    if (sharedAddressThing === null) {
      console.log("Shared resource does not have address thing: ", thingURL, sharedURLDataset);
      return [];
    }

    // 2. Get resource history
    //   a. Get resource metadata
    const linkedResources = getLinkedResourceUrlAll(sharedURLDataset);
    const metadataURL = linkedResources["describedby"][0];
    let metaset;
    try {
      metaset = await getSolidDataset(metadataURL, { fetch: session.fetch });
    } catch (e) {
      console.log("No metadata set");
      return [];
    }
    const metathing = getThing(metaset, datasetURL);
    if (metathing === null) {
      console.log("No versions available for this file");
      return [];
    }

    const modTime = getInteger(metathing, POSIX.mtime);
    const address = { ...extractAddressFromThing(sharedAddressThing), versionDate: modTime };
    if (address === null) {
      console.log("No address present in shared file");
      return [];
    }
    urlAddresses.push(address);

    //   b. Get versions of the file (with addresses?) as well
    const versionsLocation = getUrl(metathing, versionedInPredicate);
    const versionsAvailable = getInteger(metathing, hasVersionPredicate);
    if (versionsLocation === null || versionsAvailable === null) {
      return urlAddresses;
    }

    for (let i = 1; i < versionsAvailable; i++) {
      const versionURL = versionsLocation + i;
      const versionAddress = await getURLAddressAndVersions(versionURL, datasetURL);
      urlAddresses.push(...versionAddress);
      console.log("TODO: Get address from " + versionURL);
    }

    return urlAddresses;
  };

  const [part, setPart] = useState(1);
  const [whole, setWhole] = useState(1);
  const retrieveHistory = async () => {
    setAddressHistory([]);
    // Retrieve all urls shared by the selected user with ShareApp 
    let sharedResourcesDataset;
    try {
      sharedResourcesDataset = await getSolidDataset(sharedResourcesURL, { fetch: session.fetch });
    } catch (e) {
      setSearchWebidError("WebID Invalid");
      displayError(e.message);
      return;
    }

    const userSharedResourcesThing = getThing(sharedResourcesDataset, sharedResourcesURL + "#" + searchWebid);
    if (userSharedResourcesThing === null) {
      setSearchWebidError("WebID has shared no resources");
      return;
    }
    const sharedURLs = getUrlAll(userSharedResourcesThing, sharedResourcePredicate);
    let numSharedParsed = 0;
    setPart(numSharedParsed);
    setWhole(sharedURLs.length);

    // Check for home addresses in each shared url one by one
    // TODO: Do this asynchronously for performance
    const userAddresses = [];
    for (const sharedURL of sharedURLs) {
      const sharedAddresses = await getURLAddressAndVersions(sharedURL);
      if (sharedAddresses) userAddresses.push(...sharedAddresses);
      setPart(++numSharedParsed);
    }
    setPart(sharedURLs.length);
    // Push these out for display to the user
    const indexMappedAddresses = userAddresses.sort((a, b) => a - b).map(
      (addr, index) => ({
        id: index,
        ...addr,
        versionDate: convertUnixToDatestring(addr.versionDate)
      }));
    setAddressHistory(indexMappedAddresses);
  };

  return (<>
    <Typography variant="h5">WebID Address History</Typography>
    <div style={{ display: "flex", flexDirection: "row", gap: "12px", width: "100%", alignItems: "flex-start" }}>
      <TextField
        fullWidth
        value={searchWebid}
        onChange={e => setSearchWebid(e.target.value)}
        placeholder="https://comp495x.duckdns.org/ExamplePod/profile/card#me"
        error={searchWebidError !== ""}
        helperText={searchWebidError}
        label="Search WebID"
        style={{ marginBottom: "12px" }}
      />
      <div>
        <Button
          variant="contained"
          size="small"
          startIcon={<History />}
          onClick={retrieveHistory}
        >
          Retrieve History
        </Button>
      </div>
    </div>
    <LinearProgressWithLabel part={part} whole={whole} />
    <div style={{ minHeight: "400px" }}>
      <DataGrid
        rows={addressHistory}
        columns={[
          { field: "versionDate", headerName: "Version Date", flex: 1, sortable: true },
          { field: "street", headerName: "Street", flex: 1, sortable: false },
          { field: "postalCode", headerName: "Postcode", flex: 1, sortable: false },
          { field: "locality", headerName: "Locality", flex: 1, sortable: false },
          { field: "region", headerName: "Region", flex: 1, sortable: false },
          { field: "country", headerName: "Country", flex: 1, sortable: false }
        ]}
        disableColumnSelector={true}
      />
    </div>
  </>);
};

const AddressAtDate = () => {

  const [searchDate, setSearchDate] = useState(dayjs());
  const searchAddressDate = () => {
    console.log("searching " + dayjs(searchDate).toString());
  };

  const [userAddresses, setUserAddresses] = useState([]);

  return (<>
    <Typography variant="h5">Address of All Users at Date</Typography>

    <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <DatePicker
          value={searchDate}
          onChange={newDate => setSearchDate(newDate)}
        />
      </LocalizationProvider>
      <Button
        variant="contained"
        size="small"
        startIcon={<Search />}
        onClick={searchAddressDate}
      >
        Search
      </Button>
    </div>
    <div style={{ minHeight: "400px" }}>
      <DataGrid
        rows={userAddresses}
        columns={[
          { field: "webid", headerName: "WebID", flex: 2, sortable: true },
          { field: "address", headerName: "Home Address", flex: 1, sortable: false },
        ]}
        disableColumnSelector={true}
      />
    </div>
  </>);
};

////////////////////////////////////////////////////////////////////////////////
/////                             Testing Area                             /////
////////////////////////////////////////////////////////////////////////////////

const TestingArea = () => {

  const { session } = useSession();

  const [resourceURL, setResourceURL] = useState("");
  const urlChange = (event) => {
    setResourceURL(event.target.value);
  };

  const getResourceContents = async () => {
    // console.log(resourceURL);
    try {
      const info = await getFile(resourceURL, { fetch: session.fetch });
      console.log(info);
      console.log(session.info);
    } catch (e) {
      displayError(e.message);
    }
  };

  const resetSharedResources = async () => {
    // Reset the dataset
    try {
      const sharedResourcesDataset = await getSolidDataset(sharedResourcesURL, { fetch: session.fetch });
      await deleteSolidDataset(sharedResourcesDataset, { fetch: session.fetch });
    } catch (e) {
      displayError(e.message);
    }
    const blankDataset = createSolidDataset();
    const createdDataset = await saveSolidDatasetAt(sharedResourcesURL, blankDataset, { fetch: session.fetch });

    // Reset ACL to allow appending
    const datasetWithAcl = await getSolidDatasetWithAcl(sharedResourcesURL, { fetch: session.fetch });
    let updatedAcl = tryGetResourceAcl(datasetWithAcl);
    // TODO: Can we prevent reading but still allow appending for users sharing data?
    updatedAcl = setPublicResourceAccess(updatedAcl, { read: true, append: true, write: false, control: false });
    updatedAcl = setAgentResourceAccess(updatedAcl, shareAppWebID, { read: true, append: true, write: true, control: true });
    await saveAclFor(datasetWithAcl, updatedAcl, { fetch: session.fetch });
  };

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const closeConfirmDialog = (s) => {
    setConfirmDialogOpen(false);
    if (s) resetSharedResources();
  };

  const test = async () => {
    console.log("Start!");

    const engine = new QueryEngine();
    // const bindingsStream = await engine.queryBindings(`
    //     PREFIX client: <https://client-comp495x.duckdns.org/ns/>

    //     SELECT ?streetAddress
    //     WHERE {
    //       ?indexEntry client:sharedBy ?profile .
    //       ?s <https://client-comp495x.duckdns.org/ns/sharedBy> ?o
    //     } LIMIT 100
    //   `, {
    //   sources: [sharedResourcesURL],
    //   "@comunica/actor-http-inrupt-sold-client-authn:session": session,
    // });

    const query = `
      SELECT *
      WHERE {
        ?s <${sharedResourcePredicate}> ?o
      } LIMIT 100
    `;

    const bindingsStream = await engine.queryBindings(
      query,
      {
        sources: [sharedResourcesURL],
        "@comunica/actor-http-inrupt-solid-client-authn:session": session,
      }
    );

    bindingsStream.on("data", (b) => {
      console.log(b.toString());
    });

    console.log("Done!");
  };

  return (<>
    <Typography variant="h5">Testing</Typography>
    {session.info.webId}
    <div style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
      <Typography>Shared Resources</Typography>
      <Button
        variant="outlined"
        color="error"
        size="small"
        onClick={() => setConfirmDialogOpen(true)}
      >
        Reset
      </Button>
    </div>
    <Button
      variant="contained"
      color="primary"
      onClick={() => test()}
    >
      Test
    </Button>
    <Dialog
      open={confirmDialogOpen}
      onClose={() => closeConfirmDialog(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {"Disconnect all shared resources?"}
      </DialogTitle>
      <DialogActions>
        <Button onClick={() => closeConfirmDialog(false)} color="secondary">No</Button>
        <Button onClick={() => closeConfirmDialog(true)} autoFocus color="secondary">
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  </>);
};
