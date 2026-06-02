"use client"
/** BottomPanel — 底部面板（监视/收藏/历史/常用） */
import { useMemo } from "react"
import { useUIStore, useMonitorStore, useFavoriteStore, useFrequentStore, useHistoryStore, useFuncodeStore, useConnectionStore, useReadWriteStore } from "@/store"
import { getWrLabel, isWritable, getDisplayValue, getValueClass, getDisplayFactoryValue } from "@/lib/utils"
import type { FuncCodeRuntime } from "@/lib/types"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
            <TabsTrigger value="favorite">收藏</TabsTrigger>
            <TabsTrigger value="history">修改历史</TabsTrigger>
            <TabsTrigger value="frequent">常用功能码</TabsTrigger>
          </TabsList>
          {bottomTab === "monitor" && <span className="font-mono text-[10px] ml-2 text-[var(--text-dim)]">{useMonitorStore.getState().items.length}/20</span>}
          {bottomTab === "favorite" && <span className="font-mono text-[10px] ml-2 text-[var(--text-dim)]">{useFavoriteStore.getState().codes.length}</span>}
          <div className="flex-1" />
          <TabActions />
        </div>
        <TabsContent value="monitor"><MonitorTab /></TabsContent>
        <TabsContent value="favorite"><FavoriteTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
        <TabsContent value="frequent"><FrequentTab /></TabsContent>
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

function FavoriteTab() {
  const codes = useFavoriteStore(s => s.codes)
  const remove = useFavoriteStore(s => s.remove)
  const funcodes = useFuncodeStore(s => s.funcodes)
  const selectedRows = useFuncodeStore(s => s.selectedRows)
  const toggleRow = useFuncodeStore(s => s.toggleRow)
  const pendingWrites = useFuncodeStore(s => s.pendingWrites)
  const setPendingWrite = useFuncodeStore(s => s.setPendingWrite)
  const connected = useConnectionStore(s => s.connected)
  const busy = useConnectionStore(s => s.busy)
  const readSingle = useReadWriteStore(s => s.readSingle)
  const writeSingle = useReadWriteStore(s => s.writeSingle)
  const setContextMenu = useUIStore(s => s.setContextMenu)
  const items = useMemo(() => codes.map(c => funcodes.find(f => f.function_code === c)).filter(Boolean) as FuncCodeRuntime[], [codes, funcodes])

  return (
    <ScrollArea className="h-full">
      <table className="fc-table">
        <thead><tr>
          <th style={{ width: 28 }}></th><th style={{ width: 28 }}></th><th style={{ width: 55 }}>属性</th><th style={{ width: 60 }}>功能码</th><th style={{ minWidth: 90 }}>注释</th><th style={{ width: 70 }}>出厂值</th><th style={{ width: 80 }}>当前值</th><th style={{ width: 50 }}>单位</th><th style={{ width: 155 }}>设置值</th><th style={{ width: 100 }}>范围</th><th style={{ width: 250 }}>选项说明</th>
        </tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.function_code} className="fc-row" onDoubleClick={() => readSingle(item)}
              onContextMenu={e => { e.preventDefault(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, funcCode: item }) }}>
              <td><Button variant="ghost" size="sm" className="h-5 px-1 text-[9px]" onClick={() => remove(item.function_code)}>✕</Button></td>
              <td><input type="checkbox" className="row-checkbox" checked={selectedRows.has(item.function_code)} onChange={() => toggleRow(item)} /></td>
              <td><Badge variant={item.wr_attribute === "△" ? "rw" : item.wr_attribute === "×" ? "rws" : "r"}>{getWrLabel(item.wr_attribute)}</Badge></td>
              <td><span className="font-mono text-[11px] font-bold text-[var(--amber)]">{item.function_code}</span></td>
              <td><span className="text-[11px] font-bold text-[var(--text-pri)]">{item.comment}</span></td>
              <td><span className="font-mono text-[10px] text-[var(--amber)]">{getDisplayFactoryValue(item)}</span></td>
              <td><span className={`val-display ${getValueClass(item)}`}>{getDisplayValue(item)}</span></td>
              <td><span className="font-mono text-[10px] text-[var(--text-sec)]">{item.unit}</span></td>
              <td onClick={e => e.stopPropagation()}>
                {isWritable(item) && <div className="flex items-center gap-0.5">
                  <input className="fc-input" style={{ width: 80 }} placeholder={getDisplayFactoryValue(item)} value={pendingWrites[item.function_code] || ""} onChange={e => setPendingWrite(item.function_code, e.target.value)} onKeyDown={e => e.key === "Enter" && writeSingle(item)} />
                  <button className="btn btn-green px-1.5 py-0.5 text-[10px]" style={{ visibility: pendingWrites[item.function_code] ? "visible" : "hidden" }} disabled={!connected || busy || !pendingWrites[item.function_code]} onClick={() => writeSingle(item)}>▲</button>
                </div>}
              </td>
              <td><span className="font-mono text-[10px] text-[var(--text-sec)]">—</span></td>
              <td><span className="text-[10px] overflow-hidden text-ellipsis whitespace-nowrap block text-[var(--text-sec)]" style={{ width: 250 }}>{item.function_code_option}</span></td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={11} className="text-center py-5 font-mono text-[11px] text-[var(--text-dim)]">— 右键点击功能码收藏 —</td></tr>}
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

function FrequentTab() {
  const stats = useFrequentStore(s => s.stats)
  const removeFrequent = useFrequentStore(s => s.remove)
  const funcodes = useFuncodeStore(s => s.funcodes)
  const sorted = useMemo(() => Object.entries(stats).map(([c, n]) => { const f = funcodes.find(x => x.function_code === c); return f ? { ...f, count: n } : null }).filter(Boolean).sort((a, b) => (b!.count - a!.count)).slice(0, 20), [stats, funcodes])
  return (
    <ScrollArea className="h-full">
      <table className="fc-table" style={{ tableLayout: "fixed" }}>
        <colgroup><col style={{ width: 30 }} /><col style={{ width: 80 }} /><col style={{ width: 120 }} /><col style={{ width: 80 }} /></colgroup>
        <thead><tr><th></th><th>功能码</th><th>注释</th><th>操作次数</th></tr></thead>
        <tbody>
          {sorted.map(item => (
            <tr key={item!.function_code} className="fc-row">
              <td><button className="btn btn-ghost px-1 py-0 text-[9px]" onClick={() => removeFrequent(item!.function_code)}>✕</button></td>
              <td><span className="font-mono text-[11px] text-[var(--amber)]">{item!.function_code}</span></td>
              <td><span className="text-[11px] text-[var(--text-pri)]">{item!.comment}</span></td>
              <td><span className="font-mono text-[11px] text-[var(--cyan)]">{item!.count}</span></td>
            </tr>
          ))}
          {sorted.length === 0 && <tr><td colSpan={4} className="text-center py-5 font-mono text-[11px] text-[var(--text-dim)]">— 暂无常用功能码 —</td></tr>}
        </tbody>
      </table>
    </ScrollArea>
  )
}
