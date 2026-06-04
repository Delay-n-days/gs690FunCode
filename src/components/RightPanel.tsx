"use client"
import { useUIStore, useLogStore } from "@/store"
import { useTheme } from "@/hooks/useTheme"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useRef } from "react"
import { Terminal, Settings, Trash2, Copy, Download, Scroll } from "lucide-react"

export default function RightPanel() {
  const visible = useUIStore(s => s.rightPanelVisible)
  const rightTab = useUIStore(s => s.rightTab)
  const setRightTab = useUIStore(s => s.setRightTab)
  const toggleRightPanel = useUIStore(s => s.toggleRightPanel)
  return (
    <Sheet open={visible} onOpenChange={toggleRightPanel}>
      <SheetContent className="w-[380px] p-0 flex flex-col bg-card/95 backdrop-blur-sm">
        <SheetHeader className="sr-only">
          <SheetTitle>右侧面板</SheetTitle>
        </SheetHeader>
        <Tabs value={rightTab} onValueChange={v => setRightTab(v as typeof rightTab)} className="flex flex-col h-full">
          <div className="px-4 border-b border-border">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="log" className="gap-1.5">
                <Terminal className="w-4 h-4" />
                通信日志
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5">
                <Settings className="w-4 h-4" />
                设置
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="log" className="flex-1 min-h-0 flex flex-col overflow-hidden m-0">
            <LogPanel />
          </TabsContent>
          <TabsContent value="settings" className="flex-1 min-h-0 flex flex-col overflow-hidden m-0">
            <SettingsPanel />
          </TabsContent>
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
      case "rx": return "text-green-600 dark:text-green-400"
      case "err": return "text-destructive"
      case "info": return "text-blue-600 dark:text-blue-400"
      default: return "text-muted-foreground"
    }
  }

  const getLogBg = (type: string) => {
    switch (type) {
      case "tx": return "bg-primary/5"
      case "rx": return "bg-green-500/5"
      case "err": return "bg-destructive/5"
      case "info": return "bg-blue-500/5"
      default: return ""
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-border bg-muted/30">
        <span className="text-sm text-muted-foreground">{logs.length}/500</span>
        <div className="flex-1" />
        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground smooth-transition">
          <input 
            type="checkbox" 
            checked={autoScroll} 
            onChange={e => setAutoScroll(e.target.checked)} 
            className="accent-primary" 
          /> 
          自动滚动
        </label>
        <Button variant="ghost" size="sm" onClick={copyLogs} className="gap-1.5">
          <Copy className="w-4 h-4" /> 复制
        </Button>
        <Button variant="ghost" size="sm" onClick={exportLogs} className="gap-1.5">
          <Download className="w-4 h-4" /> 导出
        </Button>
        <Button variant="ghost" size="sm" onClick={clearLogs} className="gap-1.5">
          <Trash2 className="w-4 h-4" /> 清空
        </Button>
      </div>
      <div ref={scrollRef} className="flex-1 px-4 py-3 h-0 min-h-0 overflow-y-auto font-mono text-sm">
        {logs.map((e, i) => (
          <div key={i} className={`py-2 px-3 border-b border-border/50 rounded-sm mb-1 ${getLogBg(e.type)}`}>
            <span className="text-muted-foreground mr-3">{e.ts}</span>
            <span className={getLogColor(e.type)}>{e.msg}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Scroll className="w-12 h-12 opacity-30 mb-4" />
            <p>暂无日志</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SettingsPanel() {
  const theme = useTheme()
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="flex flex-col gap-4">
        <div className="border border-border rounded-xl overflow-hidden card-hover">
          <div className="px-4 py-3 border-b border-border bg-muted/50 font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" />
            外观设置
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">主题</span>
              <Button variant="ghost" size="sm" onClick={theme.toggleTheme} className="gap-1.5">
                {theme.themeIcon === "☀" ? "深色" : "亮色"}
              </Button>
            </div>
          </div>
        </div>
        <div className="border border-border rounded-xl overflow-hidden card-hover">
          <div className="px-4 py-3 border-b border-border bg-muted/50 font-semibold flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            关于
          </div>
          <div className="p-4 text-sm text-muted-foreground space-y-2">
            <p>GS690 功能码调试终端</p>
            <p>版本: v3.0.0</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
