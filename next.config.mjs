/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next-fecocy",
  serverExternalPackages: ["googleapis"],
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
