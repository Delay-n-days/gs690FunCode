"use client"
import { useUIStore, useLogStore } from "@/store"
import { useTheme } from "@/hooks/useTheme"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useRef } from "react"

export default function RightPanel() {
  const visible = useUIStore(s => s.rightPanelVisible)
  const rightTab = useUIStore(s => s.rightTab)
  const setRightTab = useUIStore(s => s.setRightTab)
  const toggleRightPanel = useUIStore(s => s.toggleRightPanel)
  return (
    <Sheet open={visible} onOpenChange={toggleRightPanel}>
      <SheetContent className="w-[360px] p-0 flex flex-col">
        <SheetHeader className="sr-only"><SheetTitle>右侧面板</SheetTitle></SheetHeader>
        <Tabs value={rightTab} onValueChange={v => setRightTab(v as typeof rightTab)} className="flex flex-col h-full">
          <div className="px-4 border-b border-border">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="log">通信日志</TabsTrigger>
              <TabsTrigger value="settings">设置</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="log" className="flex-1 min-h-0 flex flex-col overflow-hidden m-0"><LogPanel /></TabsContent>
          <TabsContent value="settings" className="flex-1 min-h-0 flex flex-col overflow-hidden m-0"><SettingsPanel /></TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function LogPanel() {
  const logs = useLogStore(s => s.logs)
  const autoScroll = useLogStore(s => s.autoScroll)
  const setAutoScroll = useLogStore(s => s.setAutoScroll)
  const clearLogs = useLogStore(s => s.clearLogs)
  const copyLogs = useLogStore(s => s.copyLogs)
  const exportLogs = useLogStore(s => s.exportLogs)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [logs, autoScroll])

  const getLogColor = (type: string) => {
    switch (type) {
      case "tx": return "text-primary"
      case "rx": return "text-green-600"
      case "err": return "text-destructive"
      case "info": return "text-blue-600"
      default: return "text-muted-foreground"
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-3 py-2 flex items-center gap-2 border-b border-border">
        <span className="text-sm text-muted-foreground">{logs.length}/500</span>
        <div className="flex-1" />
        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="accent-primary" /> 自动滚动
        </label>
        <Button variant="ghost" size="sm" onClick={copyLogs}>复制</Button>
        <Button variant="ghost" size="sm" onClick={exportLogs}>导出</Button>
        <Button variant="ghost" size="sm" onClick={clearLogs}>清空</Button>
      </div>
      <div ref={scrollRef} className="flex-1 px-3 py-2 h-0 min-h-0 overflow-y-auto font-mono text-sm">
        {logs.map((e, i) => (
          <div key={i} className="py-1 border-b border-border/50">
            <span className="text-muted-foreground mr-2">{e.ts}</span>
            <span className={getLogColor(e.type)}>{e.msg}</span>
          </div>
        ))}
        {logs.length === 0 && <div className="text-center py-8 text-muted-foreground">暂无日志</div>}
      </div>
    </div>
  )
}

function SettingsPanel() {
  const theme = useTheme()
  return (
    <ScrollArea className="flex-1 p-3">
      <div className="flex flex-col gap-4">
        <div className="border border-border rounded-lg">
          <div className="px-3 py-2 border-b border-border bg-muted font-medium">外观设置</div>
          <div className="p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">主题</span>
              <Button variant="ghost" size="sm" onClick={theme.toggleTheme}>{theme.themeIcon === "☀" ? "深色" : "亮色"}</Button>
            </div>
          </div>
        </div>
        <div className="border border-border rounded-lg">
          <div className="px-3 py-2 border-b border-border bg-muted font-medium">关于</div>
          <div className="p-3 text-sm text-muted-foreground">
            <p>GS690 功能码调试终端</p>
            <p>版本: v3.0.0</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
