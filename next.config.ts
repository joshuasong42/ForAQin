import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    remotePatterns: [],
    unoptimized: true, // we serve our own webp through nginx in prod
  },
  // Allow nginx to forward client IP for the rate limiter
  serverExternalPackages: ['better-sqlite3', 'sharp'],
};

export default nextConfig;
