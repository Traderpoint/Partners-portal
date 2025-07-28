/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    HOSTBILL_API_URL: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',
    HOSTBILL_API_ID: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
    HOSTBILL_API_KEY: process.env.HOSTBILL_API_KEY || 'b8f7a3e9c2d1f4e6a8b9c3d2e1f5a7b4',
    MIDDLEWARE_URL: process.env.MIDDLEWARE_URL || 'http://localhost:3005',
  },
}

module.exports = nextConfig
