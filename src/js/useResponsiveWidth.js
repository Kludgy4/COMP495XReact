import { useEffect, useState } from "react";
import { BinarySearchTree } from "./breakpointsTree";

const breakpoints = BinarySearchTree.fromObject({
  1200: 1125,
  1000: 925,
  800: 725,
  600: 525,
  400: 325,
  0: 200,
  // breakpointValue: contentWidth (contentWidth selected if breakpointValue is the next lowest num to actual width)
});

export default function useResponsiveWidth(windowWidth) {
  const [contentWidth, setContentWidth] = useState(windowWidth);
  useEffect(() => {
    const result = breakpoints.search(windowWidth);
    if (result) setContentWidth(result[1]);
  }, [windowWidth]);

  return contentWidth;
}
