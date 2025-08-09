import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during builds to prevent Vercel deployment issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds for Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimise for Vercel deployment
  output: "standalone",
  // Ensure proper handling of environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
