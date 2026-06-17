/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },  // ← yeh add karo
      { protocol: "https", hostname: "*.s3.amazonaws.com" },    // ← aur yeh
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
export default nextConfig;