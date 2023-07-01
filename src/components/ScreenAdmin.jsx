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
import { PodContext } from "../context/PodContext";
import { QueryEngine } from "@comunica/query-sparql-solid";
import dayjs from "dayjs";
import genAddrThing from "../js/addressGenerator";
import { useNavigate } from "react-router-dom";
import { useSession } from "@inrupt/solid-ui-react";

export default function ScreenAdmin() {
  const { podURL } = useContext(PodContext);
  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    if (podURL === null) {
      navigate("/");
    }
  }, [podURL]);

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
      console.log(urls);
    } catch (e) {
      setSearchWebidError("WebID Invalid");
      displayError(e.message);
    }
    // console.log(searchWebid);
  };

  const [searchDate, setSearchDate] = React.useState(dayjs());
  const searchAddressDate = () => {
    console.log("searching " + dayjs(searchDate).toString());
  };

  return (
    <div id="mainContent" style={{ height: "calc(100vh - 64px)" }}>
      <div id="adminContent" style={{ flexDirection: "column", gap: "16px" }}>
        {session.info.webId !== shareAppWebID ? (
          <div>
            <div>Please log out, then log back in with an admin WebID to access this screen</div>
            <ContextLogoutButton />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div >
  );
}
