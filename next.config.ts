import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * 静态导出模式：输出纯 HTML/CSS/JS 到 out/ 目录
   * Tauri 需要静态文件打包到 WebView 中
   * 
   * 注意：静态模式下 rewrites/API routes/middleware 均不可用
   * 所有 API 调用走 Tauri IPC（前端 adapter 层已处理）
   */
  output: 'export',
};

export default nextConfig;
