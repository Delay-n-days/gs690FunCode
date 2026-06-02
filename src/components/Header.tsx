"use client"
import { useRef, useState, useEffect } from "react"
import { useConnectionStore, useFuncodeStore, useUIStore } from "@/store"
import { importExcel } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Upload, PanelRightOpen, PanelRightClose, ChevronDown, ChevronUp } from "lucide-react"

export default function Header({ theme }: { theme: { themeIcon: string; fontLabel: string; toggleTheme: () => void; toggleFont: () => void; toggleScanline: () => void; scanlineOn: boolean } }) {
  const ref = useRef<HTMLInputElement>(null)
  const connected = useConnectionStore(s => s.connected)
  const disconnect = useConnectionStore(s => s.disconnect)
  const setDialogVisible = useUIStore(s => s.setDialogVisible)
  const toggleRightPanel = useUIStore(s => s.toggleRightPanel)
  const toggleMonitorPanel = useUIStore(s => s.toggleMonitorPanel)
  const monitorPanelVisible = useUIStore(s => s.monitorPanelVisible)
  const rightPanelVisible = useUIStore(s => s.rightPanelVisible)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      let data: Array<Record<string, unknown>>
      const name = file.name.toLowerCase()
      if (name.endsWith(".json")) { const t = await file.text(); data = JSON.parse(t); if (!Array.isArray(data)) throw new Error("JSON应为数组") }
      else if (name.endsWith(".xlsx") || name.endsWith(".xls")) { data = await importExcel(file) }
      else throw new Error("不支持的格式，请用 .json 或 .xlsx")
      const ok = data.every(item => ["function_code", "address_str", "group"].every(f => f in item))
      if (!ok) throw new Error("缺少必要字段 (function_code, address_str, group)")
      useFuncodeStore.getState().replaceFuncodes(data as never[])
      toast.success(`已导入 ${data.length} 个功能码`)
    } catch (err: unknown) { toast.error(`导入失败: ${err instanceof Error ? err.message : "未知"}`) }
    if (ref.current) ref.current.value = ""
  }

  return (
    <div className="header-bar px-4 flex items-center gap-4 h-11 flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-[3px] h-7" style={{ background: "var(--amber)", boxShadow: "0 0 8px var(--amber)" }} />
        <div>
          <div className="font-mono text-[13px] tracking-[0.15em] leading-none" style={{ color: "var(--amber)" }}>GS690 · PARAM TERMINAL</div>
          <div className="text-[9px] tracking-[0.1em] mt-0.5" style={{ color: "var(--text-dim)" }}>功能码读写调试终端 v3.0</div>
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <span className={`status-led ${connected ? "led-green pulse-amber" : "led-dim"}`} />
        <span className="font-mono text-[10px]" style={{ color: "var(--text-sec)" }}>{connected ? "SERIAL OK" : "OFFLINE"}</span>
        <div className="w-px h-5" style={{ background: "var(--border)" }} />
        <label className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 border border-[var(--cyan-dim)] bg-cyan/10 text-[var(--cyan)] cursor-pointer hover:bg-cyan/15 transition-all">
          <Upload className="w-3 h-3" /> 导入
          <input ref={ref} type="file" accept=".json,.xlsx,.xls" onChange={handleImport} className="hidden" />
        </label>
        <Button variant="ghost" size="sm" onClick={theme.toggleTheme}>{mounted ? theme.themeIcon : "☀"}</Button>
        <div className="flex-1" />
        <Button variant="default" size="sm" onClick={() => connected ? disconnect() : setDialogVisible(true)}>
          {connected ? "⏹ DISCONNECT" : "▶ CONNECT"}
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleMonitorPanel}>
          {monitorPanelVisible ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />} 监视
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleRightPanel}>
          {rightPanelVisible ? <PanelRightOpen className="w-3.5 h-3.5" /> : <PanelRightClose className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  )
}
