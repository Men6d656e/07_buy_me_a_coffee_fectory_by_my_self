import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow wagmi/viem packages which use ES module syntax
  transpilePackages: ["wagmi", "viem", "@wagmi/core", "@wegmi/connectors"],
};

export default nextConfig;
