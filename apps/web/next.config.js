/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: ['@brainbolt/shared-types'],

  experimental: {
    externalDir: true,   // 🔥 REQUIRED for monorepo inside Docker
  },
};

module.exports = nextConfig;
