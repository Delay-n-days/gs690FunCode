"use client"
import { useRef, useState, useEffect } from "react"
import { useConnectionStore, useFuncodeStore, useUIStore } from "@/store"
import { importExcel } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, PanelRightOpen, PanelRightClose, ChevronDown, ChevronUp } from "lucide-react"

export default function Header({ theme }: { theme: { themeIcon: string; toggleTheme: () => void } }) {
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
      else if (name.endsWith(".xlsx") || name.endsWith(".xls")) { const res = await importExcel(file, ""); data = res.entries as Array<Record<string, unknown>> }
      else throw new Error("不支持的格式，请用 .json 或 .xlsx")
      const ok = data.every(item => ["function_code", "address_str", "group"].every(f => f in item))
      if (!ok) throw new Error("缺少必要字段 (function_code, address_str, group)")
      useFuncodeStore.getState().replaceFuncodes(data as never[])
      toast.success(`已导入 ${data.length} 个功能码`)
    } catch (err: unknown) { toast.error(`导入失败: ${err instanceof Error ? err.message : "未知"}`) }
    if (ref.current) ref.current.value = ""
  }

  return (
    <header className="flex items-center gap-3 h-12 px-4 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <div>
          <h1 className="text-sm font-semibold leading-none">GS690 PARAM TERMINAL</h1>
          <p className="text-xs text-muted-foreground">功能码读写调试终端 v3.0</p>
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Badge variant={connected ? "default" : "secondary"}>{connected ? "已连接" : "离线"}</Badge>
        <Separator orientation="vertical" className="h-5" />
        <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm border border-border rounded-lg px-2.5 h-7 hover:bg-muted">
          <Upload data-icon="inline-start" /> 导入
          <input ref={ref} type="file" accept=".json,.xlsx,.xls" onChange={handleImport} className="hidden" />
        </label>
        <Button variant="ghost" size="sm" onClick={theme.toggleTheme}>{mounted ? theme.themeIcon : "☀"}</Button>
        <Button variant="default" size="sm" onClick={() => connected ? disconnect() : setDialogVisible(true)}>
          {connected ? "断开" : "连接"}
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleMonitorPanel}>
          {monitorPanelVisible ? <ChevronDown data-icon="inline-start" /> : <ChevronUp data-icon="inline-start" />} 监视
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleRightPanel}>
          {rightPanelVisible ? <PanelRightClose data-icon="inline-start" /> : <PanelRightOpen data-icon="inline-start" />}
        </Button>
      </div>
    </header>
  )
}
