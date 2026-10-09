import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    // Browser-origin API calls pass through this same-host proxy so the
    // httpOnly admin session cookie flows naturally (no CORS for UI calls).
    // /webhooks/* feeds the WhatsApp simulator the exact inbound path Termii
    // would hit in production.
    return [
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
      { source: "/webhooks/:path*", destination: `${apiUrl}/webhooks/:path*` },
    ];
  },
};

export default nextConfig;