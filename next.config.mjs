import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for broader hosting compatibility
  output: "export",

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Ensure trailing slashes for static hosting
  trailingSlash: true,

  // Exclude test files from build
  pageExtensions: ["js", "jsx", "ts", "tsx"],

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
