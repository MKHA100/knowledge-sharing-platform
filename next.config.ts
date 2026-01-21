import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger request bodies for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Configure allowed dev origins
  allowedDevOrigins: ["192.168.1.8"],
  // Images configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
