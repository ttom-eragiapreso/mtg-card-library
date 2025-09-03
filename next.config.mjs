/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: [
      'tesseract.js',
      'sharp',
      '@gutenye/ocr-node',
      'onnxruntime-node'
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle native modules and problematic packages
    if (isServer) {
      // Exclude problematic sharp modules from bundling
      config.externals = config.externals || []
      config.externals.push({
        '@img/sharp-libvips-dev': 'commonjs @img/sharp-libvips-dev',
        '@img/sharp-wasm32': 'commonjs @img/sharp-wasm32',
        'sharp': 'commonjs sharp'
      })
    }
    
    // Ignore node-specific modules in client bundle
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
    }
    
    return config
  },
}

export default nextConfig;
