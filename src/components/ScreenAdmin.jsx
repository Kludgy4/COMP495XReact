import "dayjs/locale/en-gb";
import * as $rdf from "rdflib";
import { Button, Dialog, DialogActions, DialogTitle, TextField, Typography, fabClasses } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { History, Search } from "@mui/icons-material";
import React, { useContext, useEffect, useState } from "react";
import { createSolidDataset, deleteSolidDataset, getFile, getResourceInfoWithAcl, getSolidDataset, getSolidDatasetWithAcl, getThing, getUrl, getUrlAll, saveAclFor, saveSolidDatasetAt, setAgentResourceAccess, setPublicResourceAccess } from "@inrupt/solid-client";
import { displayError, tryGetResourceAcl } from "../js/helper";
import { shareAppWebID, sharedResourcePredicate, sharedResourcesURL } from "../js/urls";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ContextLogoutButton from "./ContextLogoutButton";
import { DataGrid } from "@mui/x-data-grid";
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
  const [t, setT] = useState([]);

  const [addressHistory, setAddressHistory] = useState([]);
  const [searchWebid, setSearchWebid] = useState("");
  const [searchWebidError, setSearchWebidError] = useState("");
  const changeSearchWebid = (event) => {
    setSearchWebid(event.target.value);
    setSearchWebidError("");
  };

  const retrieveHistory = async () => {
    try {
      await getSolidDataset(searchWebid, { fetch: session.fetch });
      const dataset = await getSolidDataset(sharedResourcesURL, { fetch: session.fetch });
      const t = getThing(dataset, sharedResourcesURL + "#" + searchWebid);
      if (t === null) {
        setSearchWebidError("WebID has shared no resources");
        return;
      }

      const urls = getUrlAll(t, sharedResourcePredicate);

      // Determine which resources hold a date

      // setT(urls);
      // console.log(urls);
    } catch (e) {
      setSearchWebidError("WebID Invalid");
      displayError(e.message);
    }
    // console.log(searchWebid);
  };

  return (<>
    <Typography variant="h5">WebID Address History</Typography>
    <div style={{ display: "flex", flexDirection: "row", gap: "12px", width: "100%", alignItems: "flex-start" }}>
      <TextField
        fullWidth
        value={searchWebid}
        onChange={changeSearchWebid}
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
    {t}
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
    //   "@comunica/actor-http-inrupt-solid-client-authn:session": session,
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

    // const bindings = await bindingsStream.toArray();
    // console.log(bindings);

    // rdflib?? (solid???)
    // const doc = $rdf.sym(sharedResourcesURL);
    // const store = $rdf.graph();
    // const bindings = await bindingsStream.toArray();
    // console.log(bindings[3].get("s").value);
    // console.log(bindings[3].get("p").value);
    // console.log(bindings[3].get("o").value);
    // console.log(bindings);

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
