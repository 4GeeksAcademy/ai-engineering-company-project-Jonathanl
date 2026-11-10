import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	outputFileTracingRoot: process.cwd(),
	rewrites: async () => ({
		beforeFiles: [
			{
				source: "/nexova-api/:path*",
				destination: `${process.env.NEXOVA_API_URL ?? "http://localhost:5050"}/:path*`,
			},
		],
	}),
};

export default nextConfig;
