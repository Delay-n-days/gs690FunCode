"use client"
/** FuncCodeTable — 功能码表格：分组侧边栏 + 工具栏 + 选择栏 + 表格主体 */
import { useMemo } from "react"
import { useFuncodeStore, useConnectionStore, useReadWriteStore, useUIStore } from "@/store"
import { ADDR_TYPE_NAMES } from "@/lib/constants"
import type { FuncCodeRuntime } from "@/lib/types"
import { getWrLabel, isWritable, getDisplayValue, getValueClass, getDisplayFactoryValue, getDisplayUpperLimit, getDisplayLowerLimit, getGroupCount, getGroupPrefix, parseOptions } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw, ChevronRight } from "lucide-react"

export default function FuncCodeTable({ filteredCodes }: { filteredCodes: FuncCodeRuntime[] }) {
  const funcodes = useFuncodeStore(s => s.funcodes)
  const filterGroup = useFuncodeStore(s => s.filterGroup)
  const selectedRows = useFuncodeStore(s => s.selectedRows)
  const connected = useConnectionStore(s => s.connected)
  const busy = useConnectionStore(s => s.busy)
  const filterText = useFuncodeStore(s => s.filterText)
  const setFilterText = useFuncodeStore(s => s.setFilterText)
  const selectedAddrType = useFuncodeStore(s => s.selectedAddrType)
  const setSelectedAddrType = useFuncodeStore(s => s.setSelectedAddrType)
  const readSelected = useReadWriteStore(s => s.readSelected)
  const readAll = useReadWriteStore(s => s.readAll)
  const toggleSelectAll = useFuncodeStore(s => s.toggleSelectAll)
  const clearSelection = useFuncodeStore(s => s.clearSelection)
  const writeSelected = useReadWriteStore(s => s.writeSelected)

  const groups = useMemo(() => [...new Set(funcodes.map(f => f.group).filter(Boolean))], [funcodes])
  const allVisibleSelected = filteredCodes.length > 0 && filteredCodes.every(fc => selectedRows.has(fc.function_code))

  return (
    <div className="flex flex-row flex-1 border-r border-[var(--border)]">
      {/* 分组侧边栏 */}
      <div className="w-[140px] flex-shrink-0 flex flex-col bg-[var(--bg-base)] border-r border-[var(--border)]">
        <div className="px-2 py-1.5 border-b border-[var(--border)] bg-[var(--bg-panel)]">
          <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--amber)]">分组列表</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="cursor-pointer px-2.5 py-2 border-b border-[var(--border)]" style={{ background: filterGroup === "" ? "var(--bg-selected)" : "transparent", borderLeft: filterGroup === "" ? "3px solid var(--amber)" : "3px solid transparent" }}
            onClick={() => useFuncodeStore.getState().setFilterGroup("")}>
            <div className="text-[11px] text-[var(--text-pri)]">全部</div>
            <div className="font-mono text-[9px] mt-0.5 text-[var(--text-dim)]">{funcodes.length} 个功能码</div>
          </div>
          {groups.map(g => (
            <div key={g} className="cursor-pointer px-2.5 py-2 border-b border-[var(--border)]" style={{ background: filterGroup === g ? "var(--bg-selected)" : "transparent", borderLeft: filterGroup === g ? "3px solid var(--amber)" : "3px solid transparent" }}
              onClick={() => useFuncodeStore.getState().setFilterGroup(g)}>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] px-1 rounded-sm text-[var(--amber)] bg-[var(--amber-glow)]">{getGroupPrefix(g, funcodes)}</span>
                <span className="text-[11px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[var(--text-pri)]" title={g}>{g}</span>
                <span className="font-mono text-[9px] px-1 rounded-sm text-[var(--cyan)] bg-cyan/10">{getGroupCount(g, funcodes)}</span>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* 功能码表格区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 工具栏 */}
        <div className="px-2.5 py-2 flex items-center gap-1.5 border-b border-[var(--border)] bg-[var(--bg-base)] flex-shrink-0">
          <Input className="flex-1 h-7 font-mono text-[11px] bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-pri)] focus:border-[var(--border-bright)]" placeholder="搜索功能码 / 名称 / 注释..." value={filterText} onChange={e => setFilterText(e.target.value)} />
          <select className="font-mono text-[11px] px-2 py-1 h-7 bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-pri)] outline-none w-[110px]" value={selectedAddrType} onChange={e => setSelectedAddrType(Number(e.target.value))}>
            {Object.entries(ADDR_TYPE_NAMES).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
          <Button variant="default" size="sm" disabled={!connected || selectedRows.size === 0 || busy} onClick={readSelected}>
            <ChevronRight className="w-3 h-3" /> READ ({selectedRows.size})
          </Button>
          <Button variant="cyan" size="sm" disabled={!connected || busy} onClick={readAll}>
            <RefreshCw className="w-3 h-3" /> ALL
          </Button>
        </div>

        {/* 选择栏 */}
        <div className="px-2.5 py-1 flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--bg-panel)] flex-shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" className="row-checkbox" checked={allVisibleSelected} onChange={e => toggleSelectAll(e.target.checked, filteredCodes)} />
            <span className="font-mono text-[10px] text-[var(--text-dim)]">全选</span>
          </label>
          <span className="font-mono text-[10px] text-[var(--text-dim)]">{filteredCodes.length} 条 · 已选 {selectedRows.size}</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="text-[9px] px-2 py-0.5" onClick={clearSelection}>清除选择</Button>
          <Button variant="destructive" size="sm" disabled={!connected || selectedRows.size === 0 || busy} onClick={writeSelected}>▲ WRITE</Button>
        </div>

        {/* 表格 */}
        <ScrollArea className="flex-1">
          <table className="fc-table">
            <thead>
              <tr>
                <th style={{ width: 28 }}></th>
                <th style={{ width: 55 }}>属性</th>
                <th style={{ width: 60 }}>功能码</th>
                <th style={{ minWidth: 90 }}>注释</th>
                <th style={{ width: 70 }}>出厂值</th>
                <th style={{ width: 80, textAlign: "right", paddingRight: 12 }}>当前值</th>
                <th style={{ width: 50 }}>单位</th>
                <th style={{ width: 155 }}>设置值</th>
                <th style={{ width: 100 }}>范围</th>
                <th style={{ width: 250 }}>选项说明</th>
              </tr>
            </thead>
            <tbody>
              {filteredCodes.map(fc => <FuncCodeRow key={fc.function_code} fc={fc} />)}
              {filteredCodes.length === 0 && <tr><td colSpan={10} className="text-center py-5 font-mono text-[11px] text-[var(--text-dim)]">— NO MATCH —</td></tr>}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  )
}

/** 功能码单行 */
function FuncCodeRow({ fc }: { fc: FuncCodeRuntime }) {
  const toggleRow = useFuncodeStore(s => s.toggleRow)
  const selectedRows = useFuncodeStore(s => s.selectedRows)
  const pendingWrites = useFuncodeStore(s => s.pendingWrites)
  const setPendingWrite = useFuncodeStore(s => s.setPendingWrite)
  const connected = useConnectionStore(s => s.connected)
  const busy = useConnectionStore(s => s.busy)
  const readSingle = useReadWriteStore(s => s.readSingle)
  const writeSingle = useReadWriteStore(s => s.writeSingle)
  const setContextMenu = useUIStore(s => s.setContextMenu)
  const setPopover = useUIStore(s => s.setPopover)

  const isSelected = selectedRows.has(fc.function_code)
  const writable = isWritable(fc)
  const pendingVal = pendingWrites[fc.function_code] || ""

  return (
    <tr
      className={`fc-row ${isSelected ? "selected" : ""}`}
      onClick={() => setContextMenu({ ...useUIStore.getState().contextMenu, funcCode: fc })}
      onDoubleClick={() => readSingle(fc)}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, funcCode: fc }) }}
    >
      <td onClick={e => e.stopPropagation()}><input type="checkbox" className="row-checkbox" checked={isSelected} onChange={() => toggleRow(fc)} /></td>
      <td><Badge variant={fc.wr_attribute === "△" ? "rw" : fc.wr_attribute === "×" ? "rws" : "r"}>{getWrLabel(fc.wr_attribute)}</Badge></td>
      <td><span className="font-mono text-[11px] text-[var(--amber)]">{fc.function_code}</span></td>
      <td><span className="text-[11px] text-[var(--text-pri)]">{fc.comment}</span></td>
      <td><span className="font-mono text-[10px] text-[var(--amber)]">{getDisplayFactoryValue(fc)}</span></td>
      <td style={{ textAlign: "right", paddingRight: 12 }}><span className={`val-display ${getValueClass(fc)}`}>{getDisplayValue(fc)}</span></td>
      <td><span className="font-mono text-[10px] text-[var(--text-sec)]">{fc.unit}</span></td>
      <td onClick={e => e.stopPropagation()} style={{ width: 155 }}>
        {writable && (
          <div className="flex items-center gap-0.5">
            <Input className="h-6 font-mono text-[12px] text-[var(--amber)] bg-[var(--bg-base)] border-[var(--border-bright)] w-[80px] flex-shrink-0 focus:border-[var(--amber)] focus:shadow-[0_0_0_2px_var(--amber-glow)]" placeholder={getDisplayFactoryValue(fc)} value={pendingVal} onChange={e => setPendingWrite(fc.function_code, e.target.value)} onKeyDown={e => e.key === "Enter" && writeSingle(fc)} />
            <Button variant="green" size="sm" className="h-6 px-1.5 text-[10px]" style={{ visibility: pendingVal ? "visible" : "hidden" }} disabled={!connected || busy || !pendingVal} onClick={() => writeSingle(fc)}>▲</Button>
          </div>
        )}
      </td>
      <td><span className="font-mono text-[10px] text-[var(--text-sec)]">{getDisplayLowerLimit(fc)}~{getDisplayUpperLimit(fc)}</span></td>
      <td style={{ position: "relative" }}>
        <div className="flex items-center gap-1">
          {parseOptions(fc.function_code_option).length > 0 && (
            <button className="px-1 py-0.5 rounded-sm cursor-pointer text-[9px] bg-[var(--amber-glow)] border border-[var(--amber)] text-[var(--amber)]" onClick={e => {
              e.stopPropagation()
              const r = (e.target as HTMLElement).getBoundingClientRect()
              let top = r.bottom + 4, left = r.left
              if (top + 300 > window.innerHeight) top = r.top - 4
              if (left + 320 > window.innerWidth) left = window.innerWidth - 330
              if (left < 0) left = 10
              setPopover({ visible: true, x: left, y: top, funcCode: fc })
            }}>▼</button>
          )}
          <span className="text-[10px] overflow-hidden text-ellipsis whitespace-nowrap block text-[var(--text-sec)]" style={{ width: 250 }} title={fc.function_code_option}>{fc.function_code_option}</span>
        </div>
      </td>
    </tr>
  )
}
