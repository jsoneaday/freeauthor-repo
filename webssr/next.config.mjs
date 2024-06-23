/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4001",
        pathname: "/workimg/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4001",
        pathname: "/profile/avatar/**",
      },
    ],
  },
};

export default nextConfig;
