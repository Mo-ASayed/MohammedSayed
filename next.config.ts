import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/apricot", destination: "/apricot/index.html" }];
  },
  async redirects() {
    return [
      // The CV page and PDF were removed on purpose. Anything still pointing at
      // them lands on the contact section instead of a 404.
      { source: "/cv", destination: "/#contact", permanent: true },
      { source: "/Mohammed-Sayed-CV.pdf", destination: "/#contact", permanent: true }
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;
