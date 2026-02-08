import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // This setting reduces how often the server re-compiles pages,
  // which stops the "RangeError" from crashing your terminal.
  onDemandEntries: {
    // Keep pages in memory for 60 seconds (default is 25)
    maxInactiveAge: 60 * 1000,
    // Keep 5 pages in memory at once (default is 2)
    pagesBufferLength: 5,
  },
};

export default nextConfig;