/**
 * 根布局组件
 * 提供全局样式、字体加载、Sonner 通知容器
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GS690 功能码调试终端',
  description: 'GS690 PARAM TERMINAL v3.0 — 功能码读写调试终端',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </body>
    </html>
  );
}
