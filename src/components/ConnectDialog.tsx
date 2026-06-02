"use client"
/** ConnectDialog — 串口连接对话框 (shadcn Dialog) */
import { useEffect } from "react"
import { useUIStore, useConnectionStore } from "@/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function ConnectDialog() {
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
