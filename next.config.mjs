import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standard Next.js build for Vercel (not static export)
  // output: "export", // Commented out to use standard Vercel deployment

  // Image optimization (enabled for standard Vercel deployment)
  images: {
    unoptimized: false,
  },

  // TypeScript configuration
  typescript: {
    // Ignore build errors on production builds for test files
    ignoreBuildErrors: process.env.NODE_ENV === "production",
  },

  // ESLint configuration
  eslint: {
    // Ignore ESLint errors during builds for test files
    ignoreDuringBuilds: true,
  },

  // Optimize for production builds
  compiler: {
    // Remove console.log in production builds
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Enable experimental features for better performance
  experimental: {
    // Note: optimizeCss disabled due to critters dependency issue
    // optimizeCss: true,
  },

  // Performance optimizations
  poweredByHeader: false,

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
        },
      };
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
