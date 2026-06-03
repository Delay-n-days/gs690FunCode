"use client"
/** 主页面 — 使用 dynamic import 禁用 SSR */
import dynamic from "next/dynamic"

const ClientApp = dynamic(() => import("@/components/ClientApp"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">加载中...</div>
})

export default function Page() {
  return <ClientApp />
}
