/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: true,
    ppr: "incremental",
    after: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4001",
        pathname: "/work_image/**",
      },
    ],
  },
};

export default nextConfig;
