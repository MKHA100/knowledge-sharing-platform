import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger request bodies for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    // Enable optimized loading
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Configure allowed dev origins
  allowedDevOrigins: ["192.168.1.8"],
  // Images configuration with optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ['image/avif', 'image/webp'], // Modern formats for better compression
    minimumCacheTTL: 60, // Cache images for 60 seconds minimum
  },
  // Compression
  compress: true,
  // Disable powered-by header for security
  poweredByHeader: false,
};

export default nextConfig;
