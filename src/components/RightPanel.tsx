"use client"
/** RightPanel — 右侧抽屉（日志/设置）使用 shadcn Sheet */
import { useUIStore, useLogStore } from "@/store"
import { useTheme } from "@/hooks/useTheme"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function RightPanel() {
  const visible = useUIStore(s => s.rightPanelVisible)
  const rightTab = useUIStore(s => s.rightTab)
  const setRightTab = useUIStore(s => s.setRightTab)
  const toggleRightPanel = useUIStore(s => s.toggleRightPanel)
  return (
    <Sheet open={visible} onOpenChange={toggleRightPanel}>
      <SheetContent className="w-[360px] p-0 flex flex-col">
        <Tabs value={rightTab} onValueChange={v => setRightTab(v as typeof rightTab)} className="flex flex-col h-full">
          <div className="flex border-b border-[var(--border)] bg-[var(--bg-base)] flex-shrink-0">
            <TabsList className="border-b-0">
              <TabsTrigger value="log">通信日志</TabsTrigger>
              <TabsTrigger value="settings">设置</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="log" className="flex-1 overflow-hidden"><LogPanel /></TabsContent>
          <TabsContent value="settings" className="flex-1 overflow-hidden"><SettingsPanel /></TabsContent>
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
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-2.5 py-1.5 flex gap-1.5 items-center border-b border-[var(--border)] bg-[var(--bg-base)] flex-shrink-0">
        <span className="font-mono text-[10px] text-[var(--text-dim)]">{logs.length}/500</span>
        <div className="flex-1" />
        <label className="flex items-center gap-1 font-mono text-[10px] cursor-pointer text-[var(--text-sec)]">
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} style={{ accentColor: "var(--amber)" }} /> AUTO
        </label>
        <Button variant="ghost" size="sm" className="text-[9px]" onClick={copyLogs}>复制</Button>
        <Button variant="ghost" size="sm" className="text-[9px]" onClick={exportLogs}>导出</Button>
        <Button variant="ghost" size="sm" className="text-[9px]" onClick={clearLogs}>清空</Button>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        {logs.map((e, i) => <div key={i} className="log-entry"><span className="log-ts">{e.ts}</span><span className={`log-${e.type}`}>{e.msg}</span></div>)}
        {logs.length === 0 && <div className="text-center py-8 font-mono text-[11px] text-[var(--text-dim)]">— NO LOG ENTRIES —</div>}
      </ScrollArea>
    </div>
  )
}

function SettingsPanel() {
  const theme = useTheme()
  return (
    <ScrollArea className="flex-1 p-3">
      <div className="flex flex-col gap-3">
        <div className="bg-[var(--bg-panel)] border border-[var(--border)]">
          <div className="font-mono text-[10px] tracking-[0.15em] text-[var(--amber)] uppercase px-2.5 py-1.5 border-b border-[var(--border)] bg-amber/4">◈ 外观设置</div>
          <div className="p-3 flex flex-col gap-3">
            {[
              { label: "主题", action: theme.toggleTheme, value: theme.themeIcon === "☀" ? "深色主题" : "亮色主题" },
              { label: "字体", action: theme.toggleFont, value: theme.fontLabel },
              { label: "CRT扫描线", action: theme.toggleScanline, value: theme.scanlineOn ? "开启" : "关闭" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-pri)]">{r.label}</span>
                <Button variant="ghost" size="sm" onClick={r.action}>{r.value}</Button>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[var(--bg-panel)] border border-[var(--border)]">
          <div className="font-mono text-[10px] tracking-[0.15em] text-[var(--amber)] uppercase px-2.5 py-1.5 border-b border-[var(--border)] bg-amber/4">◈ 关于</div>
          <div className="p-3 text-[11px] leading-7 text-[var(--text-sec)]">
            <div>GS690 功能码调试终端</div>
            <div className="text-[var(--text-dim)]">版本: v3.0.0 (Next.js + shadcn/ui)</div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
