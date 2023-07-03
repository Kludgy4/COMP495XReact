import * as React from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import PropTypes from "prop-types";
import Typography from "@mui/material/Typography";

export default function LinearProgressWithLabel(props) {
  const value = (props.part / props.whole) * 100;
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress variant="determinate" value={value} {...props} />
      </Box>
      <Box sx={{ minWidth: 110 }}>
        <Typography variant="body2" color="text.secondary">{
          `${props.part} / ${props.whole} (${Math.round(value)}%)`
        }</Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  part: PropTypes.number.isRequired,
  whole: PropTypes.number.isRequired,
};
