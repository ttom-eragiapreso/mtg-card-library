/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable cache to prevent styling issues between environments
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Force clean builds in production
  generateBuildId: async () => {
    // Use current timestamp to force fresh builds
    return `build-${Date.now()}`
  },

  // Optimize CSS loading
  experimental: {
    optimizeCss: true,
    turbo: {},
  },

  // Ensure consistent styling between environments
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
