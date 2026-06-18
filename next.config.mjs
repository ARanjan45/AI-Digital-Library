/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
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
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Next.js force-reverts config.devtool back to 'eval-source-map' on a
      // normal assignment. Define it as a getter/setter so the revert's
      // assignment becomes a no-op and our value actually sticks.
      Object.defineProperty(config, "devtool", {
        get() {
          return "source-map";
        },
        set() {},
      });
    }
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;