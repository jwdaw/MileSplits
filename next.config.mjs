/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint configuration
  eslint: {
    // Ignore ESLint errors during builds for test files
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration
  typescript: {
    // Ignore build errors on production builds for test files
    ignoreBuildErrors: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
