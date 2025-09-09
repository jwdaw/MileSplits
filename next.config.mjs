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
