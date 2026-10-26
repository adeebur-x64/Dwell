import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  output: "export",
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
