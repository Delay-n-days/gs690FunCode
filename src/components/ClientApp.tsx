"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { Toaster } from "sonner"
import { useTheme } from "@/hooks/useTheme"
import { useFuncodeStore, useConnectionStore, useUIStore } from "@/store"
import Header from "@/components/Header"
import FuncCodeTable from "@/components/FuncCodeTable"
import RightPanel from "@/components/RightPanel"
import BottomPanel from "@/components/BottomPanel"
import StatusBar from "@/components/StatusBar"
import ConnectDialog from "@/components/ConnectDialog"
import ContextMenu from "@/components/ContextMenu"
import OptionPopover from "@/components/OptionPopover"

export default function ClientApp() {
  const theme = useTheme()
  const mainFlex = useUIStore(s => s.mainFlex)
  const contextMenu = useUIStore(s => s.contextMenu)
  const popover = useUIStore(s => s.popover)
  const monitorPanelVisible = useUIStore(s => s.monitorPanelVisible)
  const filterGroup = useFuncodeStore(s => s.filterGroup)
  const funcodes = useFuncodeStore(s => s.funcodes)
  const filterText = useFuncodeStore(s => s.filterText)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
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

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startFlex = useUIStore.getState().mainFlex
    const ch = containerRef.current?.offsetHeight
    if (!ch) return
    document.body.style.cursor = "ns-resize"
    document.body.style.userSelect = "none"
    const onMove = (e: MouseEvent) => {
      let f = startFlex + ((e.clientY - startY) / ch) * 100
      f = Math.max(20, Math.min(80, f))
      useUIStore.getState().setMainFlex(Math.round(f))
    }
    const onUp = () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }, [])

  if (!mounted) return <div className="flex items-center justify-center h-screen text-muted-foreground">加载中...</div>

  const filteredCodes = funcodes.filter(fc => {
    if (filterGroup && fc.group !== filterGroup) return false
    if (filterText) {
      const txt = filterText.toLowerCase()
      return (fc.function_code || "").toLowerCase().includes(txt) || (fc.comment || "").toLowerCase().includes(txt) || (fc.variable_name || "").toLowerCase().includes(txt) || (fc.address_str || "").includes(txt)
    }
    return true
  })

  return (
    <div ref={containerRef} className="flex flex-col h-screen bg-background">
      <Toaster position="top-center" />
      {popover.visible && popover.funcCode && <OptionPopover fc={popover.funcCode} x={popover.x} y={popover.y} />}
      {contextMenu.visible && contextMenu.funcCode && <ContextMenu fc={contextMenu.funcCode} x={contextMenu.x} y={contextMenu.y} />}
      <ConnectDialog />
      <Header theme={theme} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex overflow-hidden" style={{ flex: monitorPanelVisible ? `0 0 ${mainFlex}%` : '1 1 0' }}>
          <FuncCodeTable filteredCodes={filteredCodes} />
          <RightPanel />
        </div>
        {monitorPanelVisible && <div className="h-0.5 bg-border cursor-ns-resize flex-shrink-0 hover:h-1.5 hover:bg-primary/50 transition-all" onMouseDown={startResize} />}
        <BottomPanel />
      </main>
      <StatusBar />
    </div>
  )
}
