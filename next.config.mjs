/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
  experimental: {
    serverComponentsExternalPackages: ['twitter-api-v2', 'gray-matter'],
  },
};

export default nextConfig;
