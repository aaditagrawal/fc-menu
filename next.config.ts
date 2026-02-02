import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages
  output: 'export',

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800, // 7 days
    unoptimized: true,
  },

  // Compression and caching
  compress: true,

  // Reduce function invocations
  experimental: {
    optimizePackageImports: ['@tanstack/react-query', 'lucide-react'],
  },

};

export default nextConfig;
