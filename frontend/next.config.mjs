/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy opcional: /api/* → backend del VPS (evita CORS en desarrollo).
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.comparau.com/v1"}/:path*`,
      },
    ];
  },
};
export default nextConfig;
