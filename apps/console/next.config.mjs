/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@nuvix/sui"],
  sassOptions: {
    compiler: "modern",
    silenceDeprecations: ["legacy-js-api"],
  },
  images: {
    remotePatterns: [
      {
        hostname: "localhost",
      },
      {
        hostname: "api.nuvix.in",
      },
    ],
  },
  reactStrictMode: false,
  redirects: async () => {
    return [
      {
        source: "/docs/:slug*",
        destination: "https://docs.nuvix.in/:slug*",
        permanent: true,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  allowedDevOrigins: ["13.127.55.211"],
};

export default nextConfig;
