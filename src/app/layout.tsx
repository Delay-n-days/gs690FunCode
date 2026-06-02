import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "GS690 参数终端", description: "GS690 功能码读写调试终端" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="zh" className="dark" suppressHydrationWarning><body>{children}</body></html>)
}
