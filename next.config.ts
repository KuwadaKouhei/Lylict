import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Vercelビルド時の型エラーを完全に無視
    ignoreBuildErrors: true,
  },
  eslint: {
    // Vercelビルド時のESLintエラーを完全に無視
    ignoreDuringBuilds: true,
  },
  // Vercel本番環境での最適化
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  // 静的最適化を無効にしてSSRモードに
  output: 'standalone',
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
