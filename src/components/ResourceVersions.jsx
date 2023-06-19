import "reactflow/dist/style.css";
import React, { useCallback, useContext, useEffect, useState } from "react";
import ReactFlow, { Background, Controls, addEdge, applyEdgeChanges, applyNodeChanges, useEdgesState, useNodesState } from "reactflow";
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

  const [metaset, setMetaset] = useState(null);
  const [currentVersion, setLatestVersion] = useState(0);

  const versionPredicate = "https://client-comp495x.duckdns.org/ns/hasVersion";

  React.useEffect(() => { if (metadataURL !== "") getNewMetaset(); }, [metadataURL]);
  const getNewMetaset = async () => {
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
      setMetaset(metaset);
      setLatestVersion(currentVersion);
      // const timeCreated = getInteger(thing, POSIX.mtime);
      // console.log(currentVersion);

    } else {
      // No metadata????? ERROR!
      throw Error("No Description Resource found???");
    }
  };

  // const defaultNodes = [];
  // const defaultEdges = [];

  // const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  // const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);

  // useEffect(() => {
  //   // TODO: Build versioning graph
  //   if (metaset !== null) {
  //     let numVersions = currentVersion;
  //     numVersions = 5;

  //     const createdNodes = [];
  //     for (let i = 1; i <= numVersions; i++) {
  //       const newNode = {
  //         id: i.toString(),
  //         data: { label: "v" + i.toString() },
  //         position: { x: ((i - 1) * 200).toString(), y: "0" },
  //       };
  //       if (i !== 1) newNode["targetPosition"] = "left";
  //       else newNode["type"] = "input";

  //       if (i !== 5) newNode["sourcePosition"] = "right";
  //       else newNode["type"] = "output";

  //       createdNodes.push(newNode);
  //     }

  //     const createdEdges = [];
  //     for (let i = 1; i < numVersions; i++) {
  //       createdEdges.push({
  //         id: i.toString() + "-" + (i + 1).toString(),
  //         source: i.toString(),
  //         target: (i + 1).toString()
  //       });
  //     }
  //     console.log("Updating versioning graph");
  //     // console.log(JSON.stringify(createdNodes));
  //     console.log(JSON.stringify(createdEdges));
  //     setNodes(createdNodes);
  //     setEdges(createdEdges);
  //   }
  // }, [currentVersion]);

  const onInit = (reactFlowInstance) => console.log("flow loaded:", reactFlowInstance);

  return (
    <Paper className="resourceVersions" style={{ position: "relative" }} elevation={2}>
      {/* <ReactFlow
        style={{ width: "100%", height: "100%" }}
        nodes={nodes}
        edges={edges}
        onInit={onInit}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={true}
      // edgesFocusable={false}
      >
        <Background color="#ffffff" />
      </ReactFlow> */}
      <Button
        variant="contained"
        startIcon={<Commit />}
        disabled={false}
        size={"small"}
        style={{ position: "absolute", top: 8, right: 8 }}
        onClick={() => console.log("TODO: Commit new version")}
      >
        Commit
      </Button>
    </Paper >
  );
}