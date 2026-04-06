/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma', '@anthropic-ai/sdk'],
}

export default nextConfig
