"use client"
import { useMemo } from "react"
import { useFuncodeStore, useConnectionStore, useReadWriteStore, useUIStore } from "@/store"
import { ADDR_TYPE_NAMES } from "@/lib/constants"
import type { FuncCodeRuntime } from "@/lib/types"
import { getWrLabel, isWritable, getDisplayValue, getValueClass, getDisplayFactoryValue, getDisplayUpperLimit, getDisplayLowerLimit, getGroupCount, getGroupPrefix, parseOptions } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
    <div className="flex flex-1 border-r border-border overflow-hidden">
      <div className="w-40 flex-shrink-0 flex flex-col border-r border-border bg-muted/30 overflow-hidden">
        <div className="px-3 py-2 border-b border-border">
          <span className="text-sm font-medium">分组列表</span>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className={`cursor-pointer px-3 py-2 border-b border-border hover:bg-accent ${filterGroup === "" ? "bg-accent" : ""}`} onClick={() => useFuncodeStore.getState().setFilterGroup("")}>
            <div className="text-sm font-medium">全部</div>
            <div className="text-xs text-muted-foreground">{funcodes.length} 个功能码</div>
          </div>
          {groups.map(g => (
            <div key={g} className={`cursor-pointer px-3 py-2 border-b border-border hover:bg-accent ${filterGroup === g ? "bg-accent" : ""}`} onClick={() => useFuncodeStore.getState().setFilterGroup(g)}>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{getGroupPrefix(g, funcodes)}</Badge>
                <span className="flex-1 truncate text-sm" title={g}>{g}</span>
                <Badge variant="secondary" className="text-xs">{getGroupCount(g, funcodes)}</Badge>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-3 py-2 flex items-center gap-2 border-b border-border">
          <Input className="flex-1" placeholder="搜索功能码 / 名称 / 注释..." value={filterText} onChange={e => setFilterText(e.target.value)} />
          <Select value={String(selectedAddrType)} onValueChange={v => setSelectedAddrType(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ADDR_TYPE_NAMES).map(([v, n]) => <SelectItem key={v} value={v}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!connected || selectedRows.size === 0 || busy} onClick={readSelected}>
            <ChevronRight data-icon="inline-start" /> 读取 ({selectedRows.size})
          </Button>
          <Button variant="secondary" size="sm" disabled={!connected || busy} onClick={readAll}>
            <RefreshCw data-icon="inline-start" /> 全部
          </Button>
        </div>
        <div className="px-3 py-1.5 flex items-center gap-3 border-b border-border bg-muted/50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-primary" checked={allVisibleSelected} onChange={e => toggleSelectAll(e.target.checked, filteredCodes)} />
            <span className="text-sm">全选</span>
          </label>
          <span className="text-sm text-muted-foreground">{filteredCodes.length} 条 · 已选 {selectedRows.size}</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={clearSelection}>清除选择</Button>
          <Button variant="destructive" size="sm" disabled={!connected || selectedRows.size === 0 || busy} onClick={writeSelected}>写入</Button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-12">属性</TableHead>
                <TableHead className="w-20">功能码</TableHead>
                <TableHead>注释</TableHead>
                <TableHead className="w-20">出厂值</TableHead>
                <TableHead className="w-24 text-right">当前值</TableHead>
                <TableHead className="w-16">单位</TableHead>
                <TableHead className="w-36">设置值</TableHead>
                <TableHead className="w-28">范围</TableHead>
                <TableHead className="w-64">选项说明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCodes.map(fc => <FuncCodeRow key={fc.function_code} fc={fc} />)}
              {filteredCodes.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">无匹配数据</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

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

  const badgeVariant = fc.wr_attribute === "△" ? "default" : fc.wr_attribute === "×" ? "destructive" : "secondary"

  return (
    <TableRow
      className={`cursor-pointer ${isSelected ? "bg-accent" : ""}`}
      onClick={() => setContextMenu({ ...useUIStore.getState().contextMenu, funcCode: fc })}
      onDoubleClick={() => readSingle(fc)}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, funcCode: fc }) }}
    >
      <TableCell onClick={e => e.stopPropagation()}>
        <input type="checkbox" className="accent-primary" checked={isSelected} onChange={() => toggleRow(fc)} />
      </TableCell>
      <TableCell><Badge variant={badgeVariant} className="text-xs">{getWrLabel(fc.wr_attribute)}</Badge></TableCell>
      <TableCell className="font-mono text-primary">{fc.function_code}</TableCell>
      <TableCell>{fc.comment}</TableCell>
      <TableCell className="font-mono text-primary">{getDisplayFactoryValue(fc)}</TableCell>
      <TableCell className="text-right"><span className="font-mono text-base text-primary">{getDisplayValue(fc)}</span></TableCell>
      <TableCell className="text-muted-foreground">{fc.unit}</TableCell>
      <TableCell onClick={e => e.stopPropagation()}>
        {writable && (
          <div className="flex items-center gap-1">
            <Input className="h-7 w-20 font-mono" placeholder={getDisplayFactoryValue(fc)} value={pendingVal} onChange={e => setPendingWrite(fc.function_code, e.target.value)} onKeyDown={e => e.key === "Enter" && writeSingle(fc)} />
            <Button size="sm" className={pendingVal ? "visible" : "invisible"} disabled={!connected || busy || !pendingVal} onClick={() => writeSingle(fc)}>▲</Button>
          </div>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{getDisplayLowerLimit(fc)}~{getDisplayUpperLimit(fc)}</TableCell>
      <TableCell className="relative">
        <div className="flex items-center gap-1">
          {parseOptions(fc.function_code_option).length > 0 && (
            <Button variant="outline" size="sm" onClick={e => {
              e.stopPropagation()
              const r = (e.target as HTMLElement).getBoundingClientRect()
              let top = r.bottom + 4, left = r.left
              if (top + 300 > window.innerHeight) top = r.top - 4
              if (left + 320 > window.innerWidth) left = window.innerWidth - 330
              if (left < 0) left = 10
              setPopover({ visible: true, x: left, y: top, funcCode: fc })
            }}>▼</Button>
          )}
          <span className="text-sm truncate text-muted-foreground w-56" title={fc.function_code_option}>{fc.function_code_option}</span>
        </div>
      </TableCell>
    </TableRow>
  )
}
