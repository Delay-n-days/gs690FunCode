"use client"
import { useState, useEffect } from "react"
import { useUIStore, useMonitorStore, useHistoryStore, useConnectionStore, useReadWriteStore } from "@/store"
import { getDisplayValue, getValueClass } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X } from "lucide-react"

export default function BottomPanel() {
  const visible = useUIStore(s => s.monitorPanelVisible)
  const bottomTab = useUIStore(s => s.bottomTab)
  const setBottomTab = useUIStore(s => s.setBottomTab)
  const mainFlex = useUIStore(s => s.mainFlex)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!visible) return null

  return (
    <div className="flex flex-col overflow-hidden border-t border-border" style={{ flex: mounted ? `0 0 ${100 - mainFlex}%` : '0 0 40%' }}>
      <Tabs value={bottomTab} onValueChange={v => setBottomTab(v as typeof bottomTab)}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <TabsList>
            <TabsTrigger value="monitor">监视窗口</TabsTrigger>
            <TabsTrigger value="history">修改历史</TabsTrigger>
          </TabsList>
          {bottomTab === "monitor" && <span className="text-sm text-muted-foreground">{useMonitorStore.getState().items.length}/20</span>}
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
    <div className="flex items-center gap-1">
      {tab === "monitor" && <>
        <Button size="sm" disabled={!connected || monitoring} onClick={startMonitor}>开始</Button>
        <Button variant="destructive" size="sm" disabled={!monitoring} onClick={stopMonitor}>停止</Button>
        <Button variant="ghost" size="sm" onClick={clearWatch}>清空</Button>
      </>}
      {tab === "history" && <Button variant="ghost" size="sm" onClick={clearHistory}>清空</Button>}
      <Button variant="ghost" size="sm" onClick={toggleMonitorPanel}>隐藏</Button>
    </div>
  )
}

function MonitorTab() {
  const items = useMonitorStore(s => s.items)
  const removeFromWatch = useMonitorStore(s => s.removeFromWatch)
  const readSingle = useReadWriteStore(s => s.readSingle)
  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>功能码</TableHead>
            <TableHead>注释</TableHead>
            <TableHead>当前值</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={item.function_code} className="cursor-pointer" onDoubleClick={() => readSingle(item)}>
              <TableCell><Button variant="ghost" size="sm" onClick={() => removeFromWatch(i)}><X className="w-4 h-4" /></Button></TableCell>
              <TableCell className="font-mono text-primary">{item.function_code}</TableCell>
              <TableCell>{item.comment}</TableCell>
              <TableCell><span className={`font-mono ${getValueClass(item)}`}>{getDisplayValue(item)}</span></TableCell>
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">右键点击功能码添加到监视窗口</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  )
}

function HistoryTab() {
  const items = useHistoryStore(s => s.items)
  const removeItem = useHistoryStore(s => s.removeItem)
  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>功能码</TableHead>
            <TableHead>注释</TableHead>
            <TableHead>修改前</TableHead>
            <TableHead>修改后</TableHead>
            <TableHead>时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i}>
              <TableCell><Button variant="ghost" size="sm" onClick={() => removeItem(i)}><X className="w-4 h-4" /></Button></TableCell>
              <TableCell className="font-mono text-primary">{item.function_code}</TableCell>
              <TableCell>{item.comment}</TableCell>
              <TableCell className="font-mono text-destructive">{item.oldValue}</TableCell>
              <TableCell className="font-mono text-green-600">{item.newValue}</TableCell>
              <TableCell className="text-muted-foreground">{item.time}</TableCell>
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无修改记录</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  )
}
