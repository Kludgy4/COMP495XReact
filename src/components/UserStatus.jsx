import { Box, Grid, LinearProgress, Typography } from "@mui/material";
import React from "react";
import Stack from "@mui/material/Stack";
import { displayError } from "../js/helper";
import useResponsiveWidth from "../js/useResponsiveWidth";
import useWindowSize from "../js/useWindowSize";

export default function UserStatus() {
  const [width, height] = useWindowSize();
  const contentWidth = useResponsiveWidth(width);

  const [isLoading, setIsLoading] = React.useState(true);
  const [connPodsByCategory, setConnPodsByCategory] = React.useState(null);

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
        pods: [
          { name: "Everdeen Bank", webid: "id" },
          { name: "Caesar Co ", webid: "id", conn: true },
          { name: "Primrose Finance", webid: "id" },
        ]
      },
      {
        name: "Government",
        emoji: "⚖️",
        pods: [
          { name: "MyCapitol", webid: "id" }
        ]
      },
      {
        name: "Employer",
        emoji: "💼",
        pods: [
          { name: "Mellark's Bakery", webid: "id", conn: true }
        ]
      }
    ];


    setConnPodsByCategory(userConnectedPodsByCategoryStub);

    // Display by category which institution has had a pod connected
    // as well as a progress bar of category information still required to connect
    setIsLoading(false);

  }, []);

  React.useEffect(() => {
    if (connPodsByCategory !== null) setIsLoading(false);
  }, [connPodsByCategory]);

  return <div id="mainContent" style={{ width: contentWidth }}>
    <Typography variant="h3" style={{ fontWeight: "bold" }}>Dashboard</Typography>
    <Typography variant="body1">A description of what the user is required to connect</Typography>
    {isLoading ? (
      <div>loading</div>
    ) : connPodsByCategory.map(category => {
      return (
        <div key={category["name"]} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Typography variant="h5">{category["emoji"]} {category["name"]}</Typography>
          <LinearProgress variant="determinate" value={70} />
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
        </div>);
    })}
  </div>;
}
