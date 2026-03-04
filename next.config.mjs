/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Baileys uses native Node.js modules that need to be externalized
  serverExternalPackages: [
    "@whiskeysockets/baileys",
    "pino",
    "@hapi/boom",
  ],
}

export default nextConfig
