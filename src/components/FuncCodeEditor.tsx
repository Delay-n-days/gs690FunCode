"use client"
/**
 * FuncCodeEditor — 功能码编辑器
 * 普通模式：只能修改出厂值（带验证）
 * 高级模式：增删查改，可修改任何项
 */
import { useState, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useFuncodeStore } from "@/store"
import type { FuncCode, FuncCodeRuntime } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import {
  ArrowLeft, Plus, Trash2, Copy, Download, Search, Filter,
  Edit, Check, X, Clipboard, ChevronDown, AlertCircle, Save
} from "lucide-react"

/** 验证器：根据 factor 验证出厂值格式 */
function validateFactoryValue(value: string, factor: string): { valid: boolean; error?: string } {
  if (!value || value.trim() === "") {
    return { valid: false, error: "出厂值不能为空" }
  }
  
  const num = parseFloat(value)
  if (isNaN(num)) {
    return { valid: false, error: "必须是有效数字" }
  }
  
  const f = parseFloat(factor) || 1
  const d = f === 1 ? 0 : f === 0.1 ? 1 : f === 0.01 ? 2 : f === 0.001 ? 3 : 4
  
  // 检查小数位数
  const parts = value.split(".")
  if (parts.length > 1 && parts[1].length > d) {
    return { valid: false, error: `小数位数不能超过 ${d} 位` }
  }
  
  return { valid: true }
}

/** 获取精度对应的小数位数 */
function getDecimalPlaces(factor: string): number {
  const f = parseFloat(factor) || 1
  return f === 1 ? 0 : f === 0.1 ? 1 : f === 0.01 ? 2 : f === 0.001 ? 3 : 4
}

/** 读写属性选项 */
const WR_OPTIONS = [
  { value: "△", label: "R/W (可读写)" },
  { value: "◎", label: "R (只读)" },
  { value: "×", label: "R/w (可读写)" },
]

/** 显示格式选项 */
const DISPLAY_FORMAT_OPTIONS = [
  { value: "0", label: "十进制" },
  { value: "1", label: "十六进制" },
]

/** 数据宽度选项 */
const DATA_WIDTH_OPTIONS = [
  { value: "2", label: "16位 (1字)" },
  { value: "4", label: "32位 (2字)" },
]

export default function FuncCodeEditor() {
  const router = useRouter()
  const funcodes = useFuncodeStore(s => s.funcodes)
  const replaceFuncodes = useFuncodeStore(s => s.replaceFuncodes)
  
  const [mode, setMode] = useState<"normal" | "advanced">("normal")
  const [filterGroup, setFilterGroup] = useState("")
  const [filterText, setFilterText] = useState("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false)
  const [editingFc, setEditingFc] = useState<FuncCode | null>(null)
  const [editingIndex, setEditingIndex] = useState(-1)
  const [clipboard, setClipboard] = useState<FuncCode[]>([])
  const [clipboardSourceGroup, setClipboardSourceGroup] = useState("")
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<FuncCode>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // 获取所有分组
  const groups = useMemo(() => [...new Set(funcodes.map(f => f.group).filter(Boolean))], [funcodes])
  
  // 过滤后的功能码
  const filteredCodes = useMemo(() => {
    return funcodes.filter(fc => {
      if (filterGroup && fc.group !== filterGroup) return false
      if (filterText) {
        const txt = filterText.toLowerCase()
        return (fc.function_code || "").toLowerCase().includes(txt)
          || (fc.comment || "").toLowerCase().includes(txt)
          || (fc.variable_name || "").toLowerCase().includes(txt)
      }
      return true
    })
  }, [funcodes, filterGroup, filterText])

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData({})
    setFormErrors({})
  }, [])

  // 打开编辑对话框
  const handleEdit = useCallback((fc: FuncCode, index: number) => {
    setEditingFc(fc)
    setEditingIndex(index)
    setFormData({ ...fc })
    setFormErrors({})
    setEditDialogOpen(true)
  }, [])

  // 打开新增对话框
  const handleAdd = useCallback((group?: string) => {
    setEditingFc(null)
    setEditingIndex(-1)
    setFormData({
      group: group || (groups.length > 0 ? groups[0] : ""),
      function_code: "",
      comment: "",
      address_str: "",
      factory_value: "0",
      upper_limit: "65535",
      lower_limit: "0",
      wr_attribute: "△",
      factor: "1",
      unit: "",
      display_format_u16: "0",
      data_width: "4",
      whether_signed: "0",
      function_code_option: "",
    })
    setFormErrors({})
    setAddDialogOpen(true)
  }, [groups])

  // 验证表单
  const validateForm = useCallback((data: Partial<FuncCode>, isEdit: boolean): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    if (!data.function_code?.trim()) {
      errors.function_code = "功能码不能为空"
    } else if (!isEdit && funcodes.some(fc => fc.function_code === data.function_code)) {
      errors.function_code = "功能码已存在"
    } else if (isEdit && editingFc && data.function_code !== editingFc.function_code && funcodes.some(fc => fc.function_code === data.function_code)) {
      errors.function_code = "功能码已存在"
    }
    
    if (!data.group?.trim()) {
      errors.group = "分组不能为空"
    }
    
    if (!data.address_str?.trim()) {
      errors.address_str = "地址不能为空"
    }
    
    if (!data.comment?.trim()) {
      errors.comment = "注释不能为空"
    }
    
    // 验证出厂值
    if (data.factory_value !== undefined) {
      const result = validateFactoryValue(data.factory_value, data.factor || "1")
      if (!result.valid && result.error) {
        errors.factory_value = result.error
      }
    }
    
    return errors
  }, [funcodes, editingFc])

  // 保存编辑
  const handleSaveEdit = useCallback(() => {
    const errors = validateForm(formData, editingIndex >= 0)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    
    const newFuncodes = [...funcodes]
    if (editingIndex >= 0) {
      // 保留运行时状态
      const existingFc = newFuncodes[editingIndex]
      newFuncodes[editingIndex] = {
        ...formData,
        _value: existingFc._value,
        _pending: existingFc._pending,
        _error: existingFc._error,
      } as FuncCodeRuntime
    }
    
    replaceFuncodes(newFuncodes)
    setEditDialogOpen(false)
    setAddDialogOpen(false)
    resetForm()
    toast.success(editingIndex >= 0 ? "功能码已更新" : "功能码已添加")
  }, [formData, editingIndex, funcodes, replaceFuncodes, validateForm, resetForm])

  // 删除功能码
  const handleDelete = useCallback((index: number) => {
    const fc = funcodes[index]
    if (confirm(`确定要删除功能码 ${fc.function_code} 吗？`)) {
      const newFuncodes = funcodes.filter((_, i) => i !== index)
      replaceFuncodes(newFuncodes)
      toast.success("功能码已删除")
    }
  }, [funcodes, replaceFuncodes])

  // 复制整个分组
  const handleCopyGroup = useCallback((group: string) => {
    const groupFuncodes = funcodes.filter(fc => fc.group === group)
    setClipboard(groupFuncodes)
    setClipboardSourceGroup(group)
    toast.success(`已复制分组 "${group}" 的 ${groupFuncodes.length} 个功能码`)
  }, [funcodes])

  // 粘贴分组（组号递增）
  const handlePasteGroup = useCallback(() => {
    if (clipboard.length === 0) {
      toast.error("剪贴板为空，请先复制一个分组")
      return
    }
    
    setAddGroupDialogOpen(true)
  }, [clipboard])

  // 确认粘贴分组
  const handleConfirmPasteGroup = useCallback((newGroupName: string) => {
    if (!newGroupName.trim()) {
      toast.error("新分组名不能为空")
      return
    }
    
    // 检查分组名是否已存在
    if (groups.includes(newGroupName)) {
      toast.error("分组名已存在")
      return
    }
    
    // 复制功能码并更新组名
    const newFuncodes = clipboard.map(fc => ({
      ...fc,
      group: newGroupName,
    }))
    
    replaceFuncodes([...funcodes, ...newFuncodes])
    setAddGroupDialogOpen(false)
    setClipboard([])
    toast.success(`已粘贴 ${newFuncodes.length} 个功能码到新分组 "${newGroupName}"`)
  }, [clipboard, funcodes, groups, replaceFuncodes])

  // 导出 JSON
  const handleExport = useCallback(() => {
    // 去除运行时状态字段
    const exportData = funcodes.map(({ _value, _pending, _error, ...fc }) => fc)
    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `funcodes_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("JSON 已导出")
  }, [funcodes])

  // 导入 JSON
  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (!Array.isArray(data)) {
          throw new Error("JSON 应为数组")
        }
        
        // 验证必要字段
        const requiredFields = ["function_code", "address_str", "group"]
        const isValid = data.every(item => requiredFields.every(f => f in item))
        if (!isValid) {
          throw new Error("缺少必要字段 (function_code, address_str, group)")
        }
        
        replaceFuncodes(data)
        toast.success(`已导入 ${data.length} 个功能码`)
      } catch (err) {
        toast.error(`导入失败: ${err instanceof Error ? err.message : "未知错误"}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }, [replaceFuncodes])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="flex items-center gap-4 h-14 px-6 border-b border-border bg-card/50 backdrop-blur-sm">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> 返回
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Edit className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-none">功能码编辑器</h1>
            <p className="text-xs text-muted-foreground mt-0.5">编辑功能码表配置</p>
          </div>
        </div>
        <div className="flex-1" />
        
        {/* 模式切换 */}
        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <Button
            variant={mode === "normal" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("normal")}
            className="h-7"
          >
            普通模式
          </Button>
          <Button
            variant={mode === "advanced" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("advanced")}
            className="h-7"
          >
            高级模式
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-5" />
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {mode === "advanced" && (
            <>
              <Button size="sm" onClick={() => handleAdd()} className="gap-1.5">
                <Plus className="w-4 h-4" /> 新增
              </Button>
              <Button variant="secondary" size="sm" onClick={handlePasteGroup} className="gap-1.5" disabled={clipboard.length === 0}>
                <Clipboard className="w-4 h-4" /> 粘贴分组
              </Button>
              <Separator orientation="vertical" className="h-5" />
            </>
          )}
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm border border-border rounded-lg px-3 h-8 hover:bg-muted smooth-transition">
            <Download className="w-4 h-4" /> 导入
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <Button variant="secondary" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="w-4 h-4" /> 导出
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
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
              onClick={() => setFilterGroup("")}
            >
              <div className="text-sm font-medium">全部</div>
              <div className="text-xs text-muted-foreground mt-0.5">{funcodes.length} 个功能码</div>
            </div>
            {groups.map(g => (
              <div
                key={g}
                className={`cursor-pointer px-4 py-3 border-b border-border smooth-transition hover:bg-accent ${filterGroup === g ? "bg-accent border-l-2 border-l-primary" : ""}`}
                onClick={() => setFilterGroup(g)}
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate text-sm" title={g}>{g}</span>
                  <Badge variant="secondary" className="text-xs">{funcodes.filter(f => f.group === g).length}</Badge>
                </div>
                {mode === "advanced" && (
                  <div className="flex gap-1 mt-1">
                    <Button variant="ghost" size="sm" className="h-5 px-1.5 text-xs" onClick={(e) => { e.stopPropagation(); handleCopyGroup(g) }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* 右侧表格区域 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 搜索栏 */}
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
            <span className="text-sm text-muted-foreground">
              {filteredCodes.length} / {funcodes.length} 条
            </span>
          </div>

          {/* 数据表格 */}
          <div className="flex-1 min-h-0 overflow-auto">
            <Table className="border-collapse">
              <TableHeader className="sticky top-0 bg-background z-20">
                <TableRow className="border-b border-border">
                  <TableHead className="w-12">属性</TableHead>
                  <TableHead className="w-20">功能码</TableHead>
                  <TableHead>注释</TableHead>
                  <TableHead className="w-20">出厂值</TableHead>
                  <TableHead className="w-16">单位</TableHead>
                  <TableHead className="w-28">范围</TableHead>
                  {mode === "advanced" && (
                    <TableHead className="w-24 text-center">操作</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((fc, i) => {
                  const originalIndex = funcodes.findIndex(f => f.function_code === fc.function_code)
                  return (
                    <TableRow
                      key={fc.function_code}
                      className="cursor-pointer table-row-hover"
                      onClick={() => mode === "normal" ? handleEdit(fc, originalIndex) : undefined}
                    >
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {fc.wr_attribute === "△" ? "R/W" : fc.wr_attribute === "×" ? "R/w" : "R"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-primary font-medium">{fc.function_code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{fc.comment}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{fc.factory_value}</TableCell>
                      <TableCell className="text-muted-foreground">{fc.unit}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {fc.lower_limit}~{fc.upper_limit}
                      </TableCell>
                      {mode === "advanced" && (
                        <TableCell onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(fc, originalIndex)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(originalIndex)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
                {filteredCodes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={mode === "advanced" ? 7 : 6} className="text-center py-12 text-muted-foreground">
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
      </main>

      {/* 编辑/新增对话框 */}
      <Dialog open={editDialogOpen || addDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditDialogOpen(false)
          setAddDialogOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIndex >= 0 ? "编辑功能码" : "新增功能码"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* 功能码 */}
            <div className="flex flex-col gap-2">
              <Label>功能码 *</Label>
              <Input
                value={formData.function_code || ""}
                onChange={e => setFormData({ ...formData, function_code: e.target.value })}
                placeholder="如 A0.00"
                className={formErrors.function_code ? "border-destructive" : ""}
              />
              {formErrors.function_code && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.function_code}
                </p>
              )}
            </div>
            
            {/* 分组 */}
            <div className="flex flex-col gap-2">
              <Label>分组 *</Label>
              <Select value={formData.group || ""} onValueChange={v => setFormData({ ...formData, group: v ?? "" })}>
                <SelectTrigger className={formErrors.group ? "border-destructive" : ""}>
                  <SelectValue placeholder="选择分组" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.group && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.group}
                </p>
              )}
            </div>
            
            {/* 地址 */}
            <div className="flex flex-col gap-2">
              <Label>地址 *</Label>
              <Input
                value={formData.address_str || ""}
                onChange={e => setFormData({ ...formData, address_str: e.target.value })}
                placeholder="如 0"
                className={formErrors.address_str ? "border-destructive" : ""}
              />
              {formErrors.address_str && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.address_str}
                </p>
              )}
            </div>
            
            {/* 注释 */}
            <div className="flex flex-col gap-2">
              <Label>注释 *</Label>
              <Input
                value={formData.comment || ""}
                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                placeholder="功能描述"
                className={formErrors.comment ? "border-destructive" : ""}
              />
              {formErrors.comment && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.comment}
                </p>
              )}
            </div>
            
            {/* 出厂值 */}
            <div className="flex flex-col gap-2">
              <Label>出厂值 *</Label>
              <Input
                value={formData.factory_value || ""}
                onChange={e => setFormData({ ...formData, factory_value: e.target.value })}
                placeholder="默认值"
                className={formErrors.factory_value ? "border-destructive" : ""}
              />
              {formErrors.factory_value && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.factory_value}
                </p>
              )}
            </div>
            
            {/* 单位 */}
            <div className="flex flex-col gap-2">
              <Label>单位</Label>
              <Input
                value={formData.unit || ""}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                placeholder="如 A, V, ℃"
              />
            </div>
            
            {/* 读写属性 */}
            <div className="flex flex-col gap-2">
              <Label>读写属性</Label>
              <Select value={formData.wr_attribute || "△"} onValueChange={v => setFormData({ ...formData, wr_attribute: v ?? "△" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WR_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 精度系数 */}
            <div className="flex flex-col gap-2">
              <Label>精度系数</Label>
              <Input
                value={formData.factor || ""}
                onChange={e => setFormData({ ...formData, factor: e.target.value })}
                placeholder="如 1, 0.1, 0.01"
              />
            </div>
            
            {/* 下限 */}
            <div className="flex flex-col gap-2">
              <Label>下限</Label>
              <Input
                value={formData.lower_limit || ""}
                onChange={e => setFormData({ ...formData, lower_limit: e.target.value })}
                placeholder="最小值"
              />
            </div>
            
            {/* 上限 */}
            <div className="flex flex-col gap-2">
              <Label>上限</Label>
              <Input
                value={formData.upper_limit || ""}
                onChange={e => setFormData({ ...formData, upper_limit: e.target.value })}
                placeholder="最大值"
              />
            </div>
            
            {/* 显示格式 */}
            <div className="flex flex-col gap-2">
              <Label>显示格式</Label>
              <Select value={formData.display_format_u16 || "0"} onValueChange={(v: string | null) => setFormData({ ...formData, display_format_u16: v ?? "0" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISPLAY_FORMAT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 数据宽度 */}
            <div className="flex flex-col gap-2">
              <Label>数据宽度</Label>
              <Select value={formData.data_width || "4"} onValueChange={(v: string | null) => setFormData({ ...formData, data_width: v ?? "4" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_WIDTH_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 选项说明（跨两列） */}
            <div className="flex flex-col gap-2 col-span-2">
              <Label>选项说明</Label>
              <textarea
                value={formData.function_code_option || ""}
                onChange={e => setFormData({ ...formData, function_code_option: e.target.value })}
                placeholder="每行一个选项，格式: 值：说明"
                className="min-h-[80px] px-3 py-2 text-sm border border-border rounded-md resize-none input-focus"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditDialogOpen(false); setAddDialogOpen(false); resetForm() }}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="w-4 h-4 mr-1.5" /> 保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 粘贴分组对话框 */}
      <Dialog open={addGroupDialogOpen} onOpenChange={setAddGroupDialogOpen}>
        <DialogContent className="w-[400px]">
          <DialogHeader>
            <DialogTitle>粘贴分组</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              从分组 "{clipboardSourceGroup}" 复制了 {clipboard.length} 个功能码
            </p>
            
            <div className="flex flex-col gap-2">
              <Label>新分组名称 *</Label>
              <Input
                id="newGroupName"
                placeholder="输入新分组名称"
                defaultValue=""
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddGroupDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => {
              const input = document.getElementById("newGroupName") as HTMLInputElement
              handleConfirmPasteGroup(input.value)
            }}>
              <Clipboard className="w-4 h-4 mr-1.5" /> 粘贴
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
