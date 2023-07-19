import "dayjs/locale/en-gb";
import React, { useContext, useEffect, useState } from "react";
import { createSolidDataset, deleteSolidDataset, getSolidDataset, getSolidDatasetWithAcl, getThing, getThingAll, getUrlAll, saveAclFor, saveSolidDatasetAt, setAgentResourceAccess, setPublicResourceAccess } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { History, Search } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogTitle, TextField, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { PodContext } from "../context/PodContext";
import { addressObjToString, convertUnixToDatestring, displayError, getURLAddressAndVersions, tryGetResourceAcl } from "../js/helper";
import { shareAppWebID, sharedResourcePredicate, sharedResourcesURL } from "../js/urls";
import useResponsiveWidth from "../js/useResponsiveWidth";
import useWindowSize from "../js/useWindowSize";
import ContextLogoutButton from "./ContextLogoutButton";
import LinearProgressWithLabel from "./LinearProgressWithLabel";

export default function ScreenAdmin() {
  const { podURL } = useContext(PodContext);
  const navigate = useNavigate();
  const { session } = useSession();

  const { width } = useWindowSize();
  const contentWidth = useResponsiveWidth(width);

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

  const [addressHistory, setAddressHistory] = useState([]);

  return (<>
    <Typography variant="h5">WebID Address History</Typography>
    <AddressHistorySearch setAddressHistory={setAddressHistory} />
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
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        pageSizeOptions={[5, 10, 25]}
      />
    </div>
  </>);
};

const AddressHistorySearch = ({ setAddressHistory }) => {

  const { session } = useSession();

  const [searchWebid, setSearchWebid] = useState("");
  const [searchWebidError, setSearchWebidError] = useState("");
  useEffect(() => setSearchWebidError(""), [searchWebid]);

  const [part, setPart] = useState(1);
  const [whole, setWhole] = useState(1);
  const retrieveHistory = async () => {
    setAddressHistory([]);
    // Retrieve all urls shared by the selected user with ShareApp 
    let sharedResourcesDataset;
    try {
      sharedResourcesDataset = await getSolidDataset(sharedResourcesURL, { fetch: session.fetch });
    } catch (e) {
      setSearchWebidError("sharedResources.ttl inaccessible");
      displayError(e.message);
      return;
    }

    const userSharedResourcesThing = getThing(sharedResourcesDataset, searchWebid);
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
      const sharedAddresses = await getURLAddressAndVersions(sharedURL, { fetch: session.fetch });
      if (sharedAddresses) userAddresses.push(...sharedAddresses);
      setPart(++numSharedParsed);
    }
    setPart(sharedURLs.length);
    // Push these out for display to the user

    const indexMappedAddresses = userAddresses.sort((a, b) => b.versionDate - a.versionDate).map(
      (addr, index) => ({
        id: index,
        ...addr,
        versionDate: convertUnixToDatestring(addr.versionDate)
      })
    );

    setAddressHistory(indexMappedAddresses);
  };

  return (<>
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
  </>);
};

const AddressAtDate = () => {

  const [userAddresses, setUserAddresses] = useState([]);

  return (<>
    <Typography variant="h5">Address of All Users at Date</Typography>
    <AddressAtDateSearch setUserAddresses={setUserAddresses} />
    <div style={{ minHeight: "400px" }}>
      <DataGrid
        rows={userAddresses}
        columns={[
          { field: "webid", headerName: "WebID", flex: 2, sortable: true },
          { field: "address", headerName: "Home Address", flex: 2, sortable: false },
          { field: "dateRange", headerName: "Stay Duration", flex: 1, sortable: false },
        ]}
        disableColumnSelector={true}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        pageSizeOptions={[5, 10]}
      />
    </div>
  </>);
};

const AddressAtDateSearch = ({ setUserAddresses }) => {

  const { session } = useSession();

  const [searchDate, setSearchDate] = useState(dayjs());
  const [part, setPart] = useState(1);
  const [whole, setWhole] = useState(1);

  const searchAddressDate = async () => {
    setUserAddresses([]);

    // Retrieve all urls shared by the selected user with ShareApp 
    let sharedResourcesDataset;
    try {
      sharedResourcesDataset = await getSolidDataset(sharedResourcesURL, { fetch: session.fetch });
    } catch (e) {
      displayError(e.message);
      return;
    }

    const sharedWebids = getThingAll(sharedResourcesDataset);
    setPart(0);
    setWhole(sharedWebids.length);

    const userAddresses = [];
    for (const webidThing of sharedWebids) {
      const webidAddress = {
        webid: webidThing.url,
        address: "",
        dateRange: "",
      };

      // Iterate over all shared resources
      const sharedResources = getUrlAll(webidThing, sharedResourcePredicate);
      let webidAddresses = [];
      for (const sharedResource of sharedResources) {
        const sharedResourceAddresses = await getURLAddressAndVersions(sharedResource, { fetch: session.fetch });
        webidAddresses.push(...sharedResourceAddresses);
      }

      webidAddresses = webidAddresses.sort((a, b) => a.versionDate - b.versionDate);

      // Find correct address for given time/date
      // console.log("searching " + dayjs(searchDate).toString());
      // +86400 ensures the end of the selected date, so the most recent of identically dated addresses is chosen
      const searchTimestamp = dayjs(searchDate).unix() + 86400;
      const datedAddrIndex = webidAddresses.findLastIndex(addr => searchTimestamp >= addr.versionDate);

      if (datedAddrIndex !== -1) {
        webidAddress["address"] = addressObjToString(webidAddresses[datedAddrIndex]);
        const f = "DD/MM/YYYY";
        if (datedAddrIndex < webidAddresses.length - 2) {
          console.log(webidAddresses[datedAddrIndex].versionDate, searchTimestamp);
          webidAddress["dateRange"] = dayjs.unix(webidAddresses[datedAddrIndex].versionDate).format(f) + " - " + dayjs.unix(webidAddresses[datedAddrIndex + 1].versionDate).format(f);
        } else {
          webidAddress["dateRange"] = dayjs.unix(webidAddresses[datedAddrIndex].versionDate).format(f) + " - " + dayjs().format(f);
        }
      }

      userAddresses.push(webidAddress);

      setPart(userAddresses.length);
    }
    setUserAddresses(userAddresses.map((a, index) => ({ id: index, ...a })));
    setPart(sharedWebids.length);
  };

  const handleDateChange = (newDate) => {
    setSearchDate(newDate);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <DatePicker
            value={searchDate}
            onChange={handleDateChange}
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
      <LinearProgressWithLabel part={part} whole={whole} />
    </>
  );
};

////////////////////////////////////////////////////////////////////////////////
/////                             Testing Area                             /////
////////////////////////////////////////////////////////////////////////////////

const TestingArea = () => {

  const { session } = useSession();

  const resetSharedResources = async () => {
    // Reset the dataset
    try {
      const sharedResourcesDataset = await getSolidDataset(sharedResourcesURL, { fetch: session.fetch });
      await deleteSolidDataset(sharedResourcesDataset, { fetch: session.fetch });
    } catch (e) {
      displayError(e.message);
    }
    const blankDataset = createSolidDataset();
    await saveSolidDatasetAt(sharedResourcesURL, blankDataset, { fetch: session.fetch });

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

  const test = () => {
    console.log("Running TESTing function");
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
