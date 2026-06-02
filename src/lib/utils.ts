import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FuncCode, OptionItem } from "./types"
import { NumberType } from "./constants"

/** shadcn/ui 工具函数 */
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

/** 数据类型判断 */
export function getNumType(fc: FuncCode): number {
  return (parseInt(fc.data_width) || 4) <= 4 ? NumberType.BIT16 : NumberType.BIT32
}

/** 原始值 → 显示值 */
export function rawToDisplay(fc: FuncCode, rawVal: number): string {
  if (fc.display_format_u16 === '1') return rawVal.toString(16).toUpperCase().padStart(4, '0')
  const factor = parseFloat(fc.factor) || 1
  let v = fc.whether_signed === '1' && rawVal > 32767 ? rawVal - 65536 : rawVal
  v *= factor
  const d = factor === 1 ? 0 : factor === 0.1 ? 1 : factor === 0.01 ? 2 : factor === 0.001 ? 3 : 4
  return v.toFixed(d)
}

/** 显示值 → 原始值 */
export function displayToRaw(fc: FuncCode, s: string): number {
  const factor = parseFloat(fc.factor) || 1
  const signed = fc.whether_signed === '1'
  let v: number
  if (fc.display_format_u16 === '1') {
    v = parseInt(s, 16)
    if (isNaN(v) || v < 0 || v > 65535) throw new Error('无效十六进制')
  } else {
    v = Math.round(parseFloat(s) / factor)
    if (isNaN(v)) throw new Error('无效数值')
    if (signed) { if (v < -32768 || v > 32767) throw new Error('超出范围'); if (v < 0) v += 65536 }
    else { if (v < 0 || v > 65535) throw new Error('超出范围') }
  }
  return v >>> 0
}

/** 显示值上限/下限/出厂值 */
/** 获取显示值（字符串形式） */
const displayVal = (fc: FuncCode, key: 'upper_limit' | 'lower_limit' | 'factory_value'): string => {
  if (fc.display_format_u16 === '1') return fc[key]
  return (parseFloat(fc[key]) * (parseFloat(fc.factor) || 1)).toString()
}
/** 获取显示值（数值形式） */
const displayNum = (fc: FuncCode, key: 'upper_limit' | 'lower_limit'): number => {
  if (fc.display_format_u16 === '1') return parseInt(fc[key], 16)
  return parseFloat(fc[key]) * (parseFloat(fc.factor) || 1)
}
export const getDisplayUpperLimit = (fc: FuncCode) => displayVal(fc, 'upper_limit')
export const getDisplayLowerLimit = (fc: FuncCode) => displayVal(fc, 'lower_limit')
export const getDisplayUpperLimitNum = (fc: FuncCode) => displayNum(fc, 'upper_limit')
export const getDisplayLowerLimitNum = (fc: FuncCode) => displayNum(fc, 'lower_limit')
export const getDisplayFactoryValue = (fc: FuncCode) => displayVal(fc, 'factory_value')

/** 解析选项字符串 */
export function parseOptions(s: string): OptionItem[] {
  if (!s) return []
  return s.split('\n').map(l => { const m = l.match(/^(\d+)[：:]\s*(.+)/); return m ? { value: m[1], label: m[2] } : null }).filter(Boolean) as OptionItem[]
}

/** 读写属性工具 */
export const getWrClass = (a: string) => a === '△' ? 'wr-rw' : a === '×' ? 'wr-rws' : 'wr-r'
export const getWrLabel = (a: string) => a === '△' ? 'R/W' : a === '×' ? 'R/w' : 'R'
export const isWritable = (fc: FuncCode) => fc.wr_attribute === '△' || fc.wr_attribute === '×'

/** 显示值 + CSS class */
export const getDisplayValue = (fc: { _value: number | null; _pending: boolean; _error: boolean } & FuncCode) =>
  fc._pending ? '...' : fc._error ? 'ERR' : fc._value === null ? '—' : rawToDisplay(fc, fc._value)
export const getValueClass = (fc: { _value: number | null; _pending: boolean; _error: boolean }) =>
  fc._pending ? 'val-pending' : fc._error ? 'val-error' : fc._value === null ? 'val-empty' : ''

/** 时间格式化 */
export const formatTimestamp = (d = new Date()) =>
  `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`

/** localStorage 工具 */
export const loadFromStorage = <T>(key: string, def: T): T => {
  if (typeof window === 'undefined') return def
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def } catch { return def }
}
export const saveToStorage = (key: string, v: unknown) => {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* localStorage 满或不可用 */ }
}

/** 分组统计 */
export const getGroupCount = (g: string, fcs: FuncCode[]) => fcs.filter(f => f.group === g).length
export const getGroupPrefix = (g: string, fcs: FuncCode[]) => { const f = fcs.find(x => x.group === g); return f ? f.function_code.split('.')[0] : '??' }
