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
import { RefreshCw, ChevronRight, ArrowUp, ChevronDown, Search, Filter, CheckSquare, Square, Trash2 } from "lucide-react"

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
      {/* 左侧分组列表 */}
      <div className="w-48 flex-shrink-0 flex flex-col border-r border-border bg-muted/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">分组列表</span>
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div 
            className={`cursor-pointer px-4 py-3 border-b border-border smooth-transition hover:bg-accent ${filterGroup === "" ? "bg-accent border-l-2 border-l-primary" : ""}`} 
            onClick={() => useFuncodeStore.getState().setFilterGroup("")}
          >
            <div className="text-sm font-medium">全部</div>
            <div className="text-xs text-muted-foreground mt-0.5">{funcodes.length} 个功能码</div>
          </div>
          {groups.map(g => (
            <div 
              key={g} 
              className={`cursor-pointer px-4 py-3 border-b border-border smooth-transition hover:bg-accent ${filterGroup === g ? "bg-accent border-l-2 border-l-primary" : ""}`} 
              onClick={() => useFuncodeStore.getState().setFilterGroup(g)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{getGroupPrefix(g, funcodes)}</Badge>
                <span className="flex-1 truncate text-sm" title={g}>{g}</span>
                <Badge variant="secondary" className="text-xs">{getGroupCount(g, funcodes)}</Badge>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* 右侧表格区域 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 搜索和操作栏 */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-border bg-card/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              className="pl-9 input-focus" 
              placeholder="搜索功能码 / 名称 / 注释..." 
              value={filterText} 
              onChange={e => setFilterText(e.target.value)} 
            />
          </div>
          <Select value={String(selectedAddrType)} onValueChange={v => setSelectedAddrType(Number(v))}>
            <SelectTrigger className="w-36 input-focus">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ADDR_TYPE_NAMES).map(([v, n]) => (
                <SelectItem key={v} value={v}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!connected || selectedRows.size === 0 || busy} onClick={readSelected} className="gap-1.5">
            <ChevronRight className="w-4 h-4" /> 读取 ({selectedRows.size})
          </Button>
          <Button variant="secondary" size="sm" disabled={!connected || busy} onClick={readAll} className="gap-1.5">
            <RefreshCw className="w-4 h-4" /> 全部
          </Button>
        </div>

        {/* 选择操作栏 */}
        <div className="px-4 py-2 flex items-center gap-4 border-b border-border bg-muted/30">
          <label className="flex items-center gap-2 cursor-pointer">
            <div 
              className={`w-4 h-4 rounded border-2 flex items-center justify-center smooth-transition ${
                allVisibleSelected 
                  ? "bg-primary border-primary" 
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => toggleSelectAll(!allVisibleSelected, filteredCodes)}
            >
              {allVisibleSelected && <CheckSquare className="w-3 h-3 text-primary-foreground" />}
            </div>
            <span className="text-sm">全选</span>
          </label>
          <span className="text-sm text-muted-foreground">
            {filteredCodes.length} 条 · 已选 {selectedRows.size}
          </span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={clearSelection} className="gap-1.5 text-muted-foreground">
            <Trash2 className="w-4 h-4" /> 清除选择
          </Button>
          <Button variant="destructive" size="sm" disabled={!connected || selectedRows.size === 0 || busy} onClick={writeSelected} className="gap-1.5">
            写入
          </Button>
        </div>

        {/* 数据表格 */}
        <div className="flex-1 min-h-0 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
              <TableRow className="border-b border-border">
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-12">属性</TableHead>
                <TableHead className="w-20">功能码</TableHead>
                <TableHead>注释</TableHead>
                <TableHead className="w-24 text-right">当前值</TableHead>
                <TableHead className="w-16">单位</TableHead>
                <TableHead className="w-36">设置值</TableHead>
                <TableHead className="w-20">出厂值</TableHead>
                <TableHead className="w-28">范围</TableHead>
                <TableHead className="w-64">选项说明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCodes.map(fc => <FuncCodeRow key={fc.function_code} fc={fc} />)}
              {filteredCodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 opacity-50" />
                      <p>无匹配数据</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
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

  const badgeVariant = "secondary"

  return (
    <TableRow
      className={`cursor-pointer table-row-hover ${isSelected ? "bg-accent" : ""}`}
      onClick={() => setContextMenu({ ...useUIStore.getState().contextMenu, funcCode: fc })}
      onDoubleClick={() => readSingle(fc)}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, funcCode: fc }) }}
    >
      <TableCell onClick={e => e.stopPropagation()}>
        <div 
          className={`w-4 h-4 rounded border-2 flex items-center justify-center smooth-transition cursor-pointer ${
            isSelected 
              ? "bg-primary border-primary" 
              : "border-border hover:border-primary/50"
          }`}
          onClick={() => toggleRow(fc)}
        >
          {isSelected && <CheckSquare className="w-3 h-3 text-primary-foreground" />}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={badgeVariant} className="text-xs">{getWrLabel(fc.wr_attribute)}</Badge>
      </TableCell>
      <TableCell className="font-mono text-primary font-medium">{fc.function_code}</TableCell>
      <TableCell className="max-w-[200px] truncate">{fc.comment}</TableCell>
      <TableCell className="text-right">
        <span className="font-mono text-base text-primary font-medium">{getDisplayValue(fc)}</span>
      </TableCell>
      <TableCell className="text-muted-foreground">{fc.unit}</TableCell>
      <TableCell onClick={e => e.stopPropagation()}>
        {writable && (
          <div className="flex items-center gap-1.5">
            <Input 
              className="h-7 w-24 font-mono input-focus" 
              placeholder={getDisplayFactoryValue(fc)} 
              value={pendingVal} 
              onChange={e => setPendingWrite(fc.function_code, e.target.value)} 
              onKeyDown={e => e.key === "Enter" && writeSingle(fc)} 
            />
            <Button 
              size="sm" 
              className={`h-7 w-7 p-0 ${pendingVal ? "visible" : "invisible"}`} 
              disabled={!connected || busy || !pendingVal} 
              onClick={() => writeSingle(fc)}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell className="font-mono text-muted-foreground">{getDisplayFactoryValue(fc)}</TableCell>
      <TableCell className="text-muted-foreground font-mono text-sm">
        {getDisplayLowerLimit(fc)}~{getDisplayUpperLimit(fc)}
      </TableCell>
      <TableCell className="relative">
        <div className="flex items-center gap-1.5">
          {parseOptions(fc.function_code_option).length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={e => {
                e.stopPropagation()
                const r = (e.target as HTMLElement).getBoundingClientRect()
                let top = r.bottom + 4, left = r.left
                if (top + 300 > window.innerHeight) top = r.top - 4
                if (left + 320 > window.innerWidth) left = window.innerWidth - 330
                if (left < 0) left = 10
                setPopover({ visible: true, x: left, y: top, funcCode: fc })
              }}
              className="h-7 w-7 p-0"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          )}
          <span className="text-sm truncate text-muted-foreground w-56" title={fc.function_code_option}>
            {fc.function_code_option}
          </span>
        </div>
      </TableCell>
    </TableRow>
  )
}
