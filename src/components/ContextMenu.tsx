"use client"
/** ContextMenu — 右键菜单 */
import { useEffect, useRef } from "react"
import { useUIStore, useMonitorStore, useFuncodeStore } from "@/store"
import { parseOptions } from "@/lib/utils"
import { toast } from "sonner"
import type { FuncCodeRuntime } from "@/lib/types"

export default function ContextMenu({ fc, x, y }: { fc: FuncCodeRuntime; x: number; y: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useUIStore(s => s.closeContextMenu)
  const addToWatch = useMonitorStore(s => s.addToWatch)
  const setPendingWrite = useFuncodeStore(s => s.setPendingWrite)
  const options = parseOptions(fc.function_code_option)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    const t = setTimeout(() => document.addEventListener("click", h), 0)
    return () => { clearTimeout(t); document.removeEventListener("click", h) }
  }, [close])

  const ax = Math.min(x, window.innerWidth - 180), ay = Math.min(y, window.innerHeight - 300)
  return (
    <div ref={ref} className="fixed z-50 min-w-[150px] max-w-[200px] max-h-[300px] overflow-y-auto bg-popover text-popover-foreground border border-border rounded-lg shadow-md p-1" style={{ left: ax, top: ay }} onClick={e => e.stopPropagation()}>
      <button className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer outline-none" onClick={() => { addToWatch(fc); close() }}>
        添加到监视窗口
      </button>
      {options.length > 0 && <>
        <div className="h-px bg-border my-1" />
        <div className="px-2 py-1 text-xs text-muted-foreground">选项</div>
        {options.map(opt => (
          <button key={opt.value} className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer outline-none" onClick={() => { setPendingWrite(fc.function_code, opt.value); close(); toast.info(`已选择: ${opt.value} - ${opt.label}`) }}>
            {opt.value} {opt.label}
          </button>
        ))}
      </>}
    </div>
  )
}
