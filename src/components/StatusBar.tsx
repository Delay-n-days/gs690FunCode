"use client"
/** StatusBar — 底部状态栏 */
import { useState, useEffect } from "react"
import { useConnectionStore } from "@/store"

export default function StatusBar() {
  const statusMsg = useConnectionStore(s => s.statusMsg)
  const busy = useConnectionStore(s => s.busy)
  const [time, setTime] = useState("")
  useEffect(() => {
    const u = () => setTime(new Date().toLocaleTimeString("zh-CN"))
    u()
    const t = setInterval(u, 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="h-6 flex items-center px-3 gap-4 flex-shrink-0 bg-[var(--bg-base)] border-t border-[var(--border)]">
      <span className="font-mono text-[10px]"><span className={busy ? "blink" : ""} style={{ color: busy ? "var(--amber)" : "var(--text-dim)" }}>{statusMsg}</span></span>
      <span className="font-mono text-[10px] text-[var(--text-dim)]">|</span>
      <span className="font-mono text-[10px] text-[var(--text-dim)]">SERIAL</span>
      <div className="flex-1" />
      <span className="font-mono text-[10px] text-[var(--text-dim)]">{time}</span>
    </div>
  )
}
