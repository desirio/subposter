/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['twitter-api-v2'],
  },
};

export default nextConfig;
