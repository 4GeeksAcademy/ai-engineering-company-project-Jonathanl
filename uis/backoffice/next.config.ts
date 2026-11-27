import type { NextConfig } from "next";

const backendUrl = (process.env.BACKEND_URL ?? "http://backend:8000").replace(/\/$/, "");
const backendProxyPath = process.env.BACKOFFICE_BACKEND_PROXY_PATH ?? "/backend";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async rewrites() {
    return [
      {
        source: `${backendProxyPath}/:path*`,
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
