/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['twitter-api-v2', 'gray-matter'],
  },
};

export default nextConfig;
