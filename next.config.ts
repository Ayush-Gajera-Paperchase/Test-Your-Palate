import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network host for Next.js dev websocket (webpack HMR)
  // Add any additional local IPs or origins (include protocol+port if needed).
  allowedDevOrigins: ['192.168.31.127'],
};

export default nextConfig;
