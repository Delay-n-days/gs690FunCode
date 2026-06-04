"use client"
/** 功能码编辑器页面 */
import dynamic from "next/dynamic"

const FuncCodeEditor = dynamic(() => import("@/components/FuncCodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  ),
})

export default function EditorPage() {
  return <FuncCodeEditor />
}
