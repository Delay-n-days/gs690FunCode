"use client"
import { useState, useEffect } from "react"
import { useConnectionStore } from "@/store"
import { Separator } from "@/components/ui/separator"
import { Activity, Clock, Signal } from "lucide-react"

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
    <footer className="h-9 flex items-center px-6 gap-5 flex-shrink-0 border-t border-border bg-muted/30 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Activity className={`w-3.5 h-3.5 ${busy ? "animate-pulse text-primary" : "text-muted-foreground"}`} />
        <span className={`text-sm ${busy ? "animate-pulse text-primary" : "text-muted-foreground"}`}>
          {statusMsg}
        </span>
      </div>
      <Separator orientation="vertical" className="h-4" />
      <div className="flex items-center gap-2">
        <Signal className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">SERIAL</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-mono">{time}</span>
      </div>
    </footer>
  )
}
