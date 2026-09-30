import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  allowedDevOrigins: [
    '*.run.app',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
