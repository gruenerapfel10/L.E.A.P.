/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during builds
    ignoreBuildErrors: true,
  },
  // Increase the static page generation timeout to 300 seconds (5 minutes)
  staticPageGenerationTimeout: 300,
  // You can also increase the build timeout
  experimental: {
    turbo: {
      buildTimeout: 300
    }
  }
};

module.exports = nextConfig; 