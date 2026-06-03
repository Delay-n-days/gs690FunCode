"use client"
import { useState, useEffect } from "react"
import { useConnectionStore } from "@/store"
import { Separator } from "@/components/ui/separator"

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
    <footer className="h-8 flex items-center px-4 gap-4 flex-shrink-0 border-t border-border bg-muted/30">
      <span className={`text-sm ${busy ? "animate-pulse text-primary" : "text-muted-foreground"}`}>{statusMsg}</span>
      <Separator orientation="vertical" className="h-4" />
      <span className="text-sm text-muted-foreground">SERIAL</span>
      <div className="flex-1" />
      <span className="text-sm text-muted-foreground">{time}</span>
    </footer>
  )
}
