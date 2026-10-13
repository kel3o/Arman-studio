import type { NextConfig } from "next"

const isDev = process.env.NODE_ENV !== "production"

const nextConfig: NextConfig = {
  ...(isDev ? {} : { output: "export" as const }),
  images: { unoptimized: true },
  trailingSlash: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
}

if (isDev) {
  nextConfig.rewrites = async () => [
    {
      source: "/gemini/:path*",
      destination: "https://generativelanguage.googleapis.com/:path*",
    },
  ]
}

export default nextConfig
