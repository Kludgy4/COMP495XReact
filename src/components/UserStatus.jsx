import { Box, Button, Grid, LinearProgress, Typography } from "@mui/material";
import React from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { displayError } from "../js/helper";
import { styled } from "@mui/material/styles";
import useResponsiveWidth from "../js/useResponsiveWidth";
import { useSession } from "@inrupt/solid-ui-react";
import useWindowSize from "../js/useWindowSize";

export default function UserStatus() {
  const [width, height] = useWindowSize();
  const contentWidth = useResponsiveWidth(width);

  const [isLoading, setIsLoading] = React.useState(true);
  const [connPodsByCategory, setConnPodsByCategory] = React.useState(null);
  const [connectedPods, setConnectedPods] = React.useState([]);

  React.useEffect(() => {
    // Get user connected pods from the DB

    // Match pods to their owning institution

    // Categorise pods (each pod has one category - (2.0 can have multiple))

    // Retrieve relevant pod data

    // (2.0 Validate pod data is correct)

    // Count number of connected (2.0 and validated) pods in each category
    // TODO: Do properly using above steps + Solid
    const userConnectedPodsByCategoryStub = [
      {
        name: "Banking",
        emoji: "🏛️",
        reqToConn: 2,
        pods: [
          { name: "Everdeen Bank", webid: "ev" },
          { name: "Caesar Co ", webid: "https://kludgy4.pods.caesar", conn: true },
          { name: "Primrose Finance", webid: "pr" },
        ]
      },
      {
        name: "Government",
        emoji: "⚖️",
        reqToConn: 1,
        pods: [
          { name: "MyCapitol", webid: "my" }
        ]
      },
      {
        name: "Employer",
        emoji: "💼",
        reqToConn: 1,
        pods: [
          { name: "Bakery Mellark", webid: "https://pods.mellark/kludgy4", conn: true }
        ]
      }
    ];

    const transformed = userConnectedPodsByCategoryStub.map(c => {
      return {
        ...c,
        numConnected: c["pods"].filter((o) => o["conn"]).length,
        progress: Math.round((c["pods"].filter((o) => o["conn"]).length / c["reqToConn"]) * 100)
      };
    });
    console.log(transformed);

    setConnPodsByCategory(transformed);

    // Display by category which institution has had a pod connected
    // as well as a progress bar of category information still required to connect
    setIsLoading(false);

  }, []);

  React.useEffect(() => {
    if (connPodsByCategory !== null) {
      setIsLoading(false);
      setConnectedPods(connPodsByCategory.map((c) => { return c.pods; }).flat().filter((o) => o["conn"]));
      // setCategoryProgress(connPodsByCategory.map((c) => { return c.pods; }).flat().filter((o) => o["conn"]));

    }
  }, [connPodsByCategory]);

  const { session } = useSession();
  React.useEffect(() => {
    // console.log(session);
  }, [session]);

  return <div id="mainContent" style={{ width: contentWidth }}>
    <Typography variant="h3" style={{ fontWeight: "bold" }}>Dashboard</Typography>
    <Typography variant="body1">A description of what the user is required to connect</Typography>
    <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
      <TextField style={{ flexGrow: 1 }} label="Pod URI" placeholder="https://comp495x.duckdns.org/Pod1/profile/card#me" />
      <Button value="connect" variant="contained">Connect</Button>
    </div>
    <Typography variant="h5">Connected Pods</Typography>
    <Grid container>
      {isLoading ? (<div>loading</div>) : (
        connectedPods.map((pod) => {
          return (
            <Grid item xs={12} key={pod["webid"]}>
              <Typography>{pod["name"]} connected at {pod["webid"]}</Typography>
            </Grid>
          );
        })
      )}
    </Grid>

    <Typography variant="h5">Connection Progress</Typography>
    {isLoading ? (
      <div>loading</div>
    ) : (
      <>
        <LinearProgress
          style={{ flexGrow: 1, height: "16px", borderRadius: "8px" }}
          variant="determinate"
          value={
            Math.round(
              100 * (
                connPodsByCategory.reduce((acc, curr) => acc + curr["numConnected"], 0) /
                connPodsByCategory.reduce((acc, curr) => acc + curr["reqToConn"], 0)
              )
            )
          }
        />
        {connPodsByCategory.map(category => {
          return (
            <div key={category["name"]} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Typography variant="h6">{category["emoji"]} {category["name"]} ({category["numConnected"]}/{category["reqToConn"]} connected)</Typography>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <LinearProgress style={{ flexGrow: 1 }} variant="determinate" value={category["progress"]} />
                <Typography style={{ minWidth: "50px", display: "flex", justifyContent: "flex-end" }}>{category["progress"]}%</Typography>
              </div>
              <Grid container>
                {category["pods"].map(pod => {
                  return (
                    <Grid item xs={3} key={pod["webid"]} style={{ display: "flex", justifyContent: "center", padding: "8px" }}>
                      {pod["conn"]
                        ? <Typography style={{ color: "green", fontWeight: "bold", textDecoration: "underline" }}>{pod["name"]}</Typography>
                        : (
                          <Typography color="error">{pod["name"]}</Typography>
                        )
                      }
                    </Grid>
                  );
                })}
              </Grid>
            </div>
          );
        })}
      </>
    )
    }
  </div>;
}
