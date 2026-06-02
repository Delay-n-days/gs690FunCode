"use client"
/** ContextMenu — 右键上下文菜单 + OptionPopover 选项弹出框 */
import { useEffect, useRef } from "react"
import { useUIStore, useMonitorStore, useFavoriteStore, useFuncodeStore } from "@/store"
import { parseOptions } from "@/lib/utils"
import { toast } from "sonner"
import type { FuncCodeRuntime } from "@/lib/types"

/** 菜单项 */
function MenuItem({ label, danger, mono, onClick }: { label: string; danger?: boolean; mono?: boolean; onClick: () => void }) {
  return (
    <div className={`px-4 py-1.5 text-[11px] cursor-pointer hover:bg-[var(--bg-selected)] ${mono ? "font-mono" : ""}`} style={{ color: danger ? "var(--red)" : "var(--text-pri)" }} onClick={onClick}>{label}</div>
  )
}

/** 右键菜单 */
export function ContextMenu({ fc, x, y }: { fc: FuncCodeRuntime; x: number; y: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useUIStore(s => s.closeContextMenu)
  const addToWatch = useMonitorStore(s => s.addToWatch)
  const addFav = useFavoriteStore(s => s.add)
  const removeFav = useFavoriteStore(s => s.remove)
  const isFav = useFavoriteStore(s => s.isFavorited)
  const setPendingWrite = useFuncodeStore(s => s.setPendingWrite)
  const options = parseOptions(fc.function_code_option)
  const fav = isFav(fc.function_code)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    const t = setTimeout(() => document.addEventListener("click", h), 0)
    return () => { clearTimeout(t); document.removeEventListener("click", h) }
  }, [close])

  const ax = Math.min(x, window.innerWidth - 220), ay = Math.min(y, window.innerHeight - 300)
  return (
    <div ref={ref} className="fixed z-[10000] rounded border border-[var(--border)] py-1 min-w-[200px] max-h-[300px] overflow-y-auto bg-[var(--bg-panel)] shadow-lg" style={{ left: ax, top: ay }} onClick={e => e.stopPropagation()}>
      <MenuItem label="添加到监视窗口" onClick={() => { addToWatch(fc); close() }} />
      <MenuItem label={fav ? "取消收藏" : "收藏"} danger={fav} onClick={() => { if (fav) removeFav(fc.function_code); else addFav(fc.function_code); close() }} />
      {options.length > 0 && <>
        <div className="my-1 mx-0 h-px bg-[var(--border)]" />
        <div className="px-4 py-1 font-mono text-[9px] text-[var(--text-dim)]">选项</div>
        {options.map(opt => <MenuItem key={opt.value} label={`${opt.value} ${opt.label}`} mono onClick={() => { setPendingWrite(fc.function_code, opt.value); close(); toast.info(`已选择: ${opt.value} - ${opt.label}`) }} />)}
      </>}
    </div>
  )
}

/** 选项弹出框 */
export function OptionPopover({ fc, x, y }: { fc: FuncCodeRuntime; x: number; y: number }) {
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

  const ax = Math.min(x, window.innerWidth - 340), ay = Math.min(y, window.innerHeight - 320)
  return (
    <div ref={ref} className="fixed z-[10001] rounded border border-[var(--border)] py-1 min-w-[300px] max-h-[300px] overflow-y-auto bg-[var(--bg-panel)] shadow-lg" style={{ left: ax, top: ay }} onClick={e => e.stopPropagation()}>
      <div className="px-3 py-1 font-mono text-[9px] text-[var(--text-dim)]">{fc.function_code} 选项</div>
      <div className="mx-3 h-px bg-[var(--border)]" />
      {options.map(opt => {
        const cur = pendingWrites[fc.function_code] === opt.value
        return (
          <div key={opt.value} className="px-3 py-1.5 text-[11px] font-mono cursor-pointer transition-colors" style={{ background: cur ? "var(--bg-selected)" : "transparent", borderLeft: cur ? "3px solid var(--amber)" : "3px solid transparent" }}
            onMouseEnter={e => { if (!cur) (e.currentTarget as HTMLElement).style.background = "var(--bg-row-hover)" }}
            onMouseLeave={e => { if (!cur) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            onClick={() => { setPendingWrite(fc.function_code, opt.value); close(); toast.info(`已选择: ${opt.value} - ${opt.label}`) }}>
            <span className="text-[var(--amber)]">{opt.value}</span>
            <span className="ml-2 text-[10px] text-[var(--text-sec)]">{opt.label}</span>
          </div>
        )
      })}
    </div>
  )
}
