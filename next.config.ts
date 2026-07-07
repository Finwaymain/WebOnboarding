import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/onboarding-assets",
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
