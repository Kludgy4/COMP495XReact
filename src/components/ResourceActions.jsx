import React, { useContext } from "react";
import { Box, Tab, Tabs, styled } from "@mui/material";
import { RequestContext } from "../context/RequestContext";
import ActionShare from "./ActionShare";
import ActionVersion from "./ActionVersion";

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const StyledTab = styled((props) => <Tab disableRipple {...props} />)(
  ({ theme }) => ({
    textTransform: "none",
    fontWeight: theme.typography.fontWeightRegular,
    fontSize: theme.typography.pxToRem(12),
    marginRight: theme.spacing(0),
    padding: "4px 8px",
    color: "rgba(255, 255, 255, 0.7)",
    "&.Mui-selected": {
      color: "#ffffff",
    },
    "&.Mui-focusVisible": {
      backgroundColor: "rgba(100, 95, 228, 0.32)",
    },
  }),
);

export default function ResourceActions({ width }) {

  const { hasVersion } = useContext(RequestContext);

  const [actionTab, setActionTab] = React.useState(0);
  const handleChange = (event, newValue) => setActionTab(newValue);

  return (
    <div className="resourceVersions" style={{ width: width }}>
      {hasVersion === 0 ? (
        <div>No resource selected</div>
      ) : (<>
        <Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
          <Tabs value={actionTab} onChange={handleChange} aria-label="Action Tabs" variant="fullWidth">
            <StyledTab label="Version" {...a11yProps(0)} />
            <StyledTab label="Share" {...a11yProps(1)} />
          </Tabs>
        </Box>
        {actionTab === 0 && <ActionVersion />}
        {actionTab === 1 && <ActionShare />}
      </>
      )}
    </div>
  );
}