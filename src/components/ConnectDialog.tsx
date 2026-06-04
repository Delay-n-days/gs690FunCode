"use client"
import { useEffect } from "react"
import { useUIStore, useConnectionStore } from "@/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wifi, Search, Loader2 } from "lucide-react"

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

  useEffect(() => { if (visible && !searching) searchPorts() }, [visible])

  const handleConnect = async () => {
    if (!selectedPort) return
    try { await connect(selectedPort, selectedBaudrate); setDialogVisible(false) } catch {}
  }

  return (
    <Dialog open={visible} onOpenChange={setDialogVisible}>
      <DialogContent className="w-[420px] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30">
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            串口连接配置
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">COM 口</Label>
            <div className="flex gap-2">
              <Select value={selectedPort} onValueChange={v => useConnectionStore.setState({ selectedPort: v ?? '' })}>
                <SelectTrigger className="flex-1 input-focus">
                  <SelectValue placeholder="选择串口" />
                </SelectTrigger>
                <SelectContent>
                  {ports.map(p => (
                    <SelectItem key={p.device} value={p.device}>
                      {p.device} - {p.description}
                    </SelectItem>
                  ))}
                  {ports.length === 0 && (
                    <SelectItem value="none" disabled>未找到串口</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button variant="secondary" size="sm" disabled={searching} onClick={() => searchPorts()} className="gap-1.5">
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {searching ? "搜索中..." : "搜索"}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">波特率</Label>
            <Select value={String(selectedBaudrate)} onValueChange={v => useConnectionStore.setState({ selectedBaudrate: Number(v) })}>
              <SelectTrigger className="w-full input-focus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map(r => (
                  <SelectItem key={r} value={String(r)}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDialogVisible(false)}>
              取消
            </Button>
            <Button size="sm" disabled={!selectedPort || connecting} onClick={handleConnect} className="gap-1.5">
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              {connecting ? "连接中..." : "连接"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
