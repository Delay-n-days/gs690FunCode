"use client"
/** OptionPopover — 选项弹出框 */
import { useEffect, useRef } from "react"
import { useUIStore, useFuncodeStore } from "@/store"
import { parseOptions } from "@/lib/utils"
import { toast } from "sonner"
import type { FuncCodeRuntime } from "@/lib/types"
import { ChevronRight } from "lucide-react"

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
    <div 
      ref={ref} 
      className="fixed z-50 min-w-[220px] max-w-[300px] max-h-[300px] overflow-y-auto bg-popover text-popover-foreground border border-border rounded-xl shadow-lg p-1.5 backdrop-blur-sm" 
      style={{ left: ax, top: ay }} 
      onClick={e => e.stopPropagation()}
    >
      <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border mb-1">
        {fc.function_code} 选项
      </div>
      {options.map(opt => {
        const cur = pendingWrites[fc.function_code] === opt.value
        return (
          <button 
            key={opt.value} 
            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg cursor-pointer outline-none smooth-transition flex items-center gap-2 ${cur ? "bg-accent" : ""}`} 
            onClick={() => { 
              setPendingWrite(fc.function_code, opt.value); 
              close(); 
              toast.info(`已选择: ${opt.value} - ${opt.label}`) 
            }}
          >
            <span className="text-primary font-medium">{opt.value}</span>
            <span className="text-xs text-muted-foreground flex-1 truncate">{opt.label}</span>
            {cur && <ChevronRight className="w-4 h-4 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}
