import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: 'out',
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
