import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 開発時にTypeScriptエラーを無視（本番ビルドでは無効）
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // 開発時にESLintエラーを無視（本番ビルドでは無効）
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
