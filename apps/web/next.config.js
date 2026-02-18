/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: ['@brainbolt/shared-types'],
};

module.exports = nextConfig;
