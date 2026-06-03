"use client"
/** OptionPopover — 选项弹出框 */
import { useEffect, useRef } from "react"
import { useUIStore, useFuncodeStore } from "@/store"
import { parseOptions } from "@/lib/utils"
import { toast } from "sonner"
import type { FuncCodeRuntime } from "@/lib/types"

export default function OptionPopover({ fc, x, y }: { fc: FuncCodeRuntime; x: number; y: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useUIStore(s => s.closePopover)
  const pendingWrites = useFuncodeStore(s => s.pendingWrites)
  const setPendingWrite = useFuncodeStore(s => s.setPendingWrite)
  const options = parseOptions(fc.function_code_option)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    const t = setTimeout(() => document.addEventListener("click", h), 0)
    return () => { clearTimeout(t); document.removeEventListener("click", h) }
  }, [close])

  const ax = Math.min(x, window.innerWidth - 250), ay = Math.min(y, window.innerHeight - 320)
  return (
    <div ref={ref} className="fixed z-50 min-w-[200px] max-w-[300px] max-h-[300px] overflow-y-auto bg-popover text-popover-foreground border border-border rounded-lg shadow-md p-1" style={{ left: ax, top: ay }} onClick={e => e.stopPropagation()}>
      <div className="px-2 py-1 text-xs text-muted-foreground">{fc.function_code} 选项</div>
      <div className="h-px bg-border my-1" />
      {options.map(opt => {
        const cur = pendingWrites[fc.function_code] === opt.value
        return (
          <button key={opt.value} className={`w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer outline-none ${cur ? "bg-accent" : ""}`} onClick={() => { setPendingWrite(fc.function_code, opt.value); close(); toast.info(`已选择: ${opt.value} - ${opt.label}`) }}>
            <span className="text-primary">{opt.value}</span>
            <span className="ml-2 text-xs text-muted-foreground">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
