"use client"
/** 主页面 — 整合所有组件 */
import { useEffect, useRef, useCallback, useMemo } from "react"
import { Toaster } from "sonner"
import { useTheme } from "@/hooks/useTheme"
import { useFuncodeStore, useConnectionStore, useUIStore } from "@/store"
import Header from "@/components/Header"
import FuncCodeTable from "@/components/FuncCodeTable"
import RightPanel from "@/components/RightPanel"
import BottomPanel from "@/components/BottomPanel"
import ConnectDialog from "@/components/ConnectDialog"
import { ContextMenu, OptionPopover } from "@/components/Overlays"
import StatusBar from "@/components/StatusBar"

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
