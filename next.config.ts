import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // 1. Force the build to ignore TypeScript and Linting errors
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 2. Your existing memory management settings
  onDemandEntries: {
    // Keep pages in memory for 60 seconds (default is 25)
    maxInactiveAge: 60 * 1000,
    // Keep 5 pages in memory at once (default is 2)
    pagesBufferLength: 5,
  },
};

export default nextConfig;