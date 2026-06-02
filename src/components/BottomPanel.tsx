"use client"
/** BottomPanel — 底部面板（监视/历史） */
import { useUIStore, useMonitorStore, useHistoryStore, useConnectionStore, useReadWriteStore } from "@/store"
import { getDisplayValue, getValueClass } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function BottomPanel() {
  const visible = useUIStore(s => s.monitorPanelVisible)
  const bottomTab = useUIStore(s => s.bottomTab)
  const setBottomTab = useUIStore(s => s.setBottomTab)
  const mainFlex = useUIStore(s => s.mainFlex)
  if (!visible) return null

  return (
    <div className="flex flex-col overflow-hidden bg-[var(--bg-panel)] border-t border-[var(--border)]" style={{ flex: `0 0 ${100 - mainFlex}%` }}>
      <Tabs value={bottomTab} onValueChange={v => setBottomTab(v as typeof bottomTab)}>
        <div className="flex items-center border-b border-[var(--border)] bg-[var(--bg-base)]">
          <TabsList className="border-b-0">
            <TabsTrigger value="monitor">监视窗口</TabsTrigger>
            <TabsTrigger value="history">修改历史</TabsTrigger>
          </TabsList>
          {bottomTab === "monitor" && <span className="font-mono text-[10px] ml-2 text-[var(--text-dim)]">{useMonitorStore.getState().items.length}/20</span>}
          <div className="flex-1" />
          <TabActions />
        </div>
        <TabsContent value="monitor"><MonitorTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function TabActions() {
  const tab = useUIStore(s => s.bottomTab)
  const connected = useConnectionStore(s => s.connected)
  const monitoring = useMonitorStore(s => s.monitoring)
  const startMonitor = useMonitorStore(s => s.startMonitor)
  const stopMonitor = useMonitorStore(s => s.stopMonitor)
  const clearWatch = useMonitorStore(s => s.clearWatch)
  const clearHistory = useHistoryStore(s => s.clearHistory)
  const toggleMonitorPanel = useUIStore(s => s.toggleMonitorPanel)
  return (
    <div className="flex items-center gap-1 pr-2">
      {tab === "monitor" && <>
        <Button variant="green" size="sm" className="text-[10px]" disabled={!connected || monitoring} onClick={startMonitor}>▶ 开始</Button>
        <Button variant="destructive" size="sm" className="text-[10px]" disabled={!monitoring} onClick={stopMonitor}>■ 停止</Button>
        <Button variant="ghost" size="sm" className="text-[10px]" onClick={clearWatch}>清空</Button>
      </>}
      {tab === "history" && <Button variant="ghost" size="sm" className="text-[10px]" onClick={clearHistory}>清空</Button>}
      <Button variant="ghost" size="sm" className="text-[10px]" onClick={toggleMonitorPanel}>▽ 隐藏</Button>
    </div>
  )
}

function MonitorTab() {
  const items = useMonitorStore(s => s.items)
  const removeFromWatch = useMonitorStore(s => s.removeFromWatch)
  const readSingle = useReadWriteStore(s => s.readSingle)
  return (
    <ScrollArea className="h-full">
      <table className="fc-table" style={{ tableLayout: "fixed" }}>
        <colgroup><col style={{ width: 30 }} /><col style={{ width: 80 }} /><col style={{ width: 120 }} /><col /></colgroup>
        <thead><tr><th></th><th>功能码</th><th>注释</th><th>当前值</th></tr></thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.function_code} className="fc-row" onDoubleClick={() => readSingle(item)}>
              <td><Button variant="ghost" size="sm" className="h-5 px-1 text-[9px]" onClick={() => removeFromWatch(i)}>✕</Button></td>
              <td><span className="font-mono text-[11px] text-[var(--amber)]">{item.function_code}</span></td>
              <td><span className="text-[11px] text-[var(--text-pri)]">{item.comment}</span></td>
              <td><span className={`val-display ${getValueClass(item)}`}>{getDisplayValue(item)}</span></td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={4} className="text-center py-5 font-mono text-[11px] text-[var(--text-dim)]">— 右键点击功能码添加到监视窗口 —</td></tr>}
        </tbody>
      </table>
    </ScrollArea>
  )
}

function HistoryTab() {
  const items = useHistoryStore(s => s.items)
  const removeItem = useHistoryStore(s => s.removeItem)
  return (
    <ScrollArea className="h-full">
      <table className="fc-table" style={{ tableLayout: "fixed" }}>
        <colgroup><col style={{ width: 30 }} /><col style={{ width: 80 }} /><col style={{ width: 120 }} /><col /><col /><col style={{ width: 80 }} /></colgroup>
        <thead><tr><th></th><th>功能码</th><th>注释</th><th>修改前</th><th>修改后</th><th>时间</th></tr></thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="fc-row">
              <td><button className="btn btn-ghost px-1 py-0 text-[9px]" onClick={() => removeItem(i)}>✕</button></td>
              <td><span className="font-mono text-[11px] text-[var(--amber)]">{item.function_code}</span></td>
              <td><span className="text-[11px] text-[var(--text-pri)]">{item.comment}</span></td>
              <td><span className="font-mono text-xs text-[var(--red)]">{item.oldValue}</span></td>
              <td><span className="font-mono text-xs text-[var(--green)]">{item.newValue}</span></td>
              <td><span className="font-mono text-[10px] text-[var(--text-dim)]">{item.time}</span></td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={6} className="text-center py-5 font-mono text-[11px] text-[var(--text-dim)]">— 暂无修改记录 —</td></tr>}
        </tbody>
      </table>
    </ScrollArea>
  )
}
