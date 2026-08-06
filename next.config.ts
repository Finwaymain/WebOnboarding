import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/onboarding-assets",
  trailingSlash: true,

  allowedDevOrigins: ["172.20.32.1"],

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;