"use client"
/** 主页面 — 整合所有组件 */
import { useEffect, useRef, useCallback, useMemo } from "react"
import { Toaster } from "sonner"
import { useTheme } from "@/hooks/useTheme"
import { useFuncodeStore, useConnectionStore, useUIStore, useMonitorStore } from "@/store"
import Header from "@/components/Header"
import FuncCodeTable from "@/components/FuncCodeTable"
import RightPanel from "@/components/RightPanel"
import BottomPanel from "@/components/BottomPanel"
import StatusBar from "@/components/StatusBar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { parseOptions } from "@/lib/utils"
import { toast } from "sonner"
import type { FuncCodeRuntime } from "@/lib/types"

/** ConnectDialog — 串口连接对话框 (shadcn Dialog) */
function ConnectDialog() {
  const visible = useUIStore(s => s.dialogVisible)
  const setDialogVisible = useUIStore(s => s.setDialogVisible)
  const ports = useConnectionStore(s => s.ports)
  const selectedPort = useConnectionStore(s => s.selectedPort)
  const selectedBaudrate = useConnectionStore(s => s.selectedBaudrate)
  const searching = useConnectionStore(s => s.searching)
  const connecting = useConnectionStore(s => s.connecting)
  const searchPorts = useConnectionStore(s => s.searchPorts)
  const connect = useConnectionStore(s => s.connect)

  useEffect(() => { if (visible) searchPorts() }, [visible, searchPorts])

  const handleConnect = async () => {
    if (!selectedPort) return
    try { await connect(selectedPort, selectedBaudrate); setDialogVisible(false) } catch { /* store handles toast */ }
  }

  return (
    <Dialog open={visible} onOpenChange={setDialogVisible}>
      <DialogContent className="w-[380px]">
        <DialogHeader><DialogTitle>串口连接配置</DialogTitle></DialogHeader>
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="font-mono text-[10px] text-[var(--text-dim)]">COM 口</Label>
            <div className="flex gap-2">
              <select className="flex-1 min-w-0 font-mono text-[11px] px-2 py-1 bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-pri)] outline-none"
                value={selectedPort} onChange={e => useConnectionStore.setState({ selectedPort: e.target.value })}>
                {ports.map(p => <option key={p.device} value={p.device}>{p.device} - {p.description}</option>)}
                {ports.length === 0 && <option value="">未找到串口</option>}
              </select>
              <Button variant="cyan" size="sm" className="whitespace-nowrap" disabled={searching} onClick={() => searchPorts()}>
                {searching ? "搜索中..." : "🔍 搜索"}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="font-mono text-[10px] text-[var(--text-dim)]">波特率</Label>
            <select className="w-full font-mono text-[11px] px-2 py-1 bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-pri)] outline-none"
              value={selectedBaudrate} onChange={e => useConnectionStore.setState({ selectedBaudrate: Number(e.target.value) })}>
              {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={() => setDialogVisible(false)}>取消</Button>
            <Button variant="default" disabled={!selectedPort || connecting} onClick={handleConnect}>{connecting ? "连接中..." : "连接"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** 菜单项 */
function MenuItem({ label, danger, mono, onClick }: { label: string; danger?: boolean; mono?: boolean; onClick: () => void }) {
  return (
    <div className={`px-4 py-1.5 text-[11px] cursor-pointer hover:bg-[var(--bg-selected)] ${mono ? "font-mono" : ""}`} style={{ color: danger ? "var(--red)" : "var(--text-pri)" }} onClick={onClick}>{label}</div>
  )
}

/** 右键菜单 */
function ContextMenu({ fc, x, y }: { fc: FuncCodeRuntime; x: number; y: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useUIStore(s => s.closeContextMenu)
  const addToWatch = useMonitorStore(s => s.addToWatch)
  const setPendingWrite = useFuncodeStore(s => s.setPendingWrite)
  const options = parseOptions(fc.function_code_option)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    const t = setTimeout(() => document.addEventListener("click", h), 0)
    return () => { clearTimeout(t); document.removeEventListener("click", h) }
  }, [close])

  const ax = Math.min(x, window.innerWidth - 220), ay = Math.min(y, window.innerHeight - 300)
  return (
    <div ref={ref} className="fixed z-[10000] rounded border border-[var(--border)] py-1 min-w-[200px] max-h-[300px] overflow-y-auto bg-[var(--bg-panel)] shadow-lg" style={{ left: ax, top: ay }} onClick={e => e.stopPropagation()}>
      <MenuItem label="添加到监视窗口" onClick={() => { addToWatch(fc); close() }} />
      {options.length > 0 && <>
        <div className="my-1 mx-0 h-px bg-[var(--border)]" />
        <div className="px-4 py-1 font-mono text-[9px] text-[var(--text-dim)]">选项</div>
        {options.map(opt => <MenuItem key={opt.value} label={`${opt.value} ${opt.label}`} mono onClick={() => { setPendingWrite(fc.function_code, opt.value); close(); toast.info(`已选择: ${opt.value} - ${opt.label}`) }} />)}
      </>}
    </div>
  )
}

/** 选项弹出框 */
function OptionPopover({ fc, x, y }: { fc: FuncCodeRuntime; x: number; y: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useUIStore(s => s.closePopover)
  const pendingWrites = useFuncodeStore(s => s.pendingWrites)
  const setPendingWrite = useFuncodeStore(s => s.setPendingWrite)
  const options = parseOptions(fc.function_code_option)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    const t = setTimeout(() => document.addEventListener("click", h), 0)
    return () => { clearTimeout(t); document.removeEventListener("click", h) }
  }, [close])

  const ax = Math.min(x, window.innerWidth - 340), ay = Math.min(y, window.innerHeight - 320)
  return (
    <div ref={ref} className="fixed z-[10001] rounded border border-[var(--border)] py-1 min-w-[300px] max-h-[300px] overflow-y-auto bg-[var(--bg-panel)] shadow-lg" style={{ left: ax, top: ay }} onClick={e => e.stopPropagation()}>
      <div className="px-3 py-1 font-mono text-[9px] text-[var(--text-dim)]">{fc.function_code} 选项</div>
      <div className="mx-3 h-px bg-[var(--border)]" />
      {options.map(opt => {
        const cur = pendingWrites[fc.function_code] === opt.value
        return (
          <div key={opt.value} className="px-3 py-1.5 text-[11px] font-mono cursor-pointer transition-colors" style={{ background: cur ? "var(--bg-selected)" : "transparent", borderLeft: cur ? "3px solid var(--amber)" : "3px solid transparent" }}
            onMouseEnter={e => { if (!cur) (e.currentTarget as HTMLElement).style.background = "var(--bg-row-hover)" }}
            onMouseLeave={e => { if (!cur) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            onClick={() => { setPendingWrite(fc.function_code, opt.value); close(); toast.info(`已选择: ${opt.value} - ${opt.label}`) }}>
            <span className="text-[var(--amber)]">{opt.value}</span>
            <span className="ml-2 text-[10px] text-[var(--text-sec)]">{opt.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function HomePage() {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const filterGroup = useFuncodeStore(s => s.filterGroup)
  const funcodes = useFuncodeStore(s => s.funcodes)
  const filterText = useFuncodeStore(s => s.filterText)
  const mainFlex = useUIStore(s => s.mainFlex)
  const contextMenu = useUIStore(s => s.contextMenu)
  const popover = useUIStore(s => s.popover)

  const filteredCodes = useMemo(() => {
    const txt = filterText.toLowerCase()
    return funcodes.filter(fc => {
      if (filterGroup && fc.group !== filterGroup) return false
      if (txt) return (fc.function_code || "").toLowerCase().includes(txt) || (fc.comment || "").toLowerCase().includes(txt) || (fc.variable_name || "").toLowerCase().includes(txt) || (fc.address_str || "").includes(txt)
      return true
    })
  }, [funcodes, filterText, filterGroup])

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY, startFlex = useUIStore.getState().mainFlex, ch = containerRef.current?.offsetHeight
    if (!ch) return
    document.body.style.cursor = "ns-resize"
    document.body.style.userSelect = "none"
    const onMove = (e: MouseEvent) => {
      let f = startFlex + ((e.clientY - startY) / ch) * 100
      f = Math.max(20, Math.min(80, f))
      useUIStore.getState().setMainFlex(Math.round(f))
    }
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); document.body.style.cursor = ""; document.body.style.userSelect = "" }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }, [])

  useEffect(() => {
    const check = useConnectionStore.getState().checkConnection
    check()
    const t = setInterval(check, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const close = () => { useUIStore.getState().closeContextMenu(); useUIStore.getState().closePopover() }
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col h-screen" style={{ fontFamily: "var(--sans)" }}>
      <Toaster position="top-center" toastOptions={{ style: { background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-pri)", fontFamily: "var(--mono)", fontSize: "12px" } }} />
      {popover.visible && popover.funcCode && <OptionPopover fc={popover.funcCode} x={popover.x} y={popover.y} />}
      {contextMenu.visible && contextMenu.funcCode && <ContextMenu fc={contextMenu.funcCode} x={contextMenu.x} y={contextMenu.y} />}
      <ConnectDialog />
      <Header theme={theme} />
      {/* 进度条 */}
      <div className="prog-bar flex-shrink-0">
        <div className={`prog-fill ${useConnectionStore.getState().busy ? "animate" : ""}`} style={{ width: useConnectionStore.getState().busy ? "100%" : "0%" }} />
      </div>
      {/* 主布局 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex overflow-hidden" style={{ flex: `0 0 ${mainFlex}%` }}>
          <FuncCodeTable filteredCodes={filteredCodes} />
          <RightPanel />
        </div>
        <div className="resize-handle" onMouseDown={startResize} />
        <BottomPanel />
      </div>
      <StatusBar />
    </div>
  )
}
