import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* 
   * API 代理配置：将 /api/* 请求转发到 FastAPI 后端
   * 开发时 FastAPI 运行在 8081 端口，Next.js 在 8899 端口
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

export default nextConfig;
