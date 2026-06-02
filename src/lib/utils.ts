/**
 * GS690 功能码显示/转换工具函数
 * 处理原始值 ↔ 显示值的双向转换、范围检查等
 */

import type { FuncCode, OptionItem } from './types';
import { NumberType } from './constants';

/**
 * 根据数据宽度判断数据类型
 * @param fc 功能码数据
 * @returns NumberType 枚举值
 */
export function getNumType(fc: FuncCode): number {
  const w = parseInt(fc.data_width) || 4;
  return w <= 4 ? NumberType.BIT16 : NumberType.BIT32;
}

/**
 * 原始值 → 显示值（物理量）
 * 根据显示格式决定是十六进制还是十进制，并应用精度系数
 */
export function rawToDisplay(fc: FuncCode, rawVal: number): string {
  const showHex = fc.display_format_u16 === '1';
  const factor = parseFloat(fc.factor) || 1;
  const signed = fc.whether_signed === '1';

  // 十六进制模式：直接转大写 hex
  if (showHex) return rawVal.toString(16).toUpperCase().padStart(4, '0');

  let v = rawVal;
  // 有符号处理：16位有符号数补码转换
  if (signed) v = v > 32767 ? v - 65536 : v;
  // 应用精度系数
  v = v * factor;
  // 根据系数决定小数位数
  const decimals = factor === 1 ? 0 : factor === 0.1 ? 1 : factor === 0.01 ? 2 : factor === 0.001 ? 3 : 4;
  return v.toFixed(decimals);
}

/**
 * 显示值（物理量）→ 原始值（数据量）
 * 用户输入的显示值转换为设备可接受的原始整数值
 */
export function displayToRaw(fc: FuncCode, displayStr: string): number {
  const showHex = fc.display_format_u16 === '1';
  const factor = parseFloat(fc.factor) || 1;
  const signed = fc.whether_signed === '1';
  let v: number;

  if (showHex) {
    // 十六进制输入解析
    v = parseInt(displayStr, 16);
    if (isNaN(v)) throw new Error('无效十六进制');
    if (v < 0 || v > 65535) throw new Error('超出范围 0~FFFF');
  } else {
    // 十进制输入解析
    v = parseFloat(displayStr);
    if (isNaN(v)) throw new Error('无效数值');
    // 除以精度系数得到原始值
    v = Math.round(v / factor);
    if (signed) {
      if (v < -32768 || v > 32767) throw new Error('超出范围 -32768~32767');
      if (v < 0) v = v + 65536; // 负数转补码
    } else {
      if (v < 0 || v > 65535) throw new Error('超出范围 0~65535');
    }
  }
  return v >>> 0; // 无符号整数
}

/** 获取显示用的上限值（原始值 × 系数） */
export function getDisplayUpperLimit(fc: FuncCode): string {
  if (fc.display_format_u16 === '1') return fc.upper_limit;
  return (parseFloat(fc.upper_limit) * (parseFloat(fc.factor) || 1)).toString();
}

/** 获取显示用的下限值（原始值 × 系数） */
export function getDisplayLowerLimit(fc: FuncCode): string {
  if (fc.display_format_u16 === '1') return fc.lower_limit;
  return (parseFloat(fc.lower_limit) * (parseFloat(fc.factor) || 1)).toString();
}

/** 获取数值型的显示上限（用于范围检查） */
export function getDisplayUpperLimitNum(fc: FuncCode): number {
  if (fc.display_format_u16 === '1') return parseInt(fc.upper_limit, 16);
  return parseFloat(fc.upper_limit) * (parseFloat(fc.factor) || 1);
}

/** 获取数值型的显示下限（用于范围检查） */
export function getDisplayLowerLimitNum(fc: FuncCode): number {
  if (fc.display_format_u16 === '1') return parseInt(fc.lower_limit, 16);
  return parseFloat(fc.lower_limit) * (parseFloat(fc.factor) || 1);
}

/** 获取显示用的出厂值（原始值 × 系数） */
export function getDisplayFactoryValue(fc: FuncCode): string {
  if (fc.display_format_u16 === '1') return fc.factory_value;
  return (parseFloat(fc.factory_value) * (parseFloat(fc.factor) || 1)).toString();
}

/**
 * 解析功能码选项字符串
 * 格式：每行 "数字：说明" 或 "数字:说明"
 * @returns 选项数组
 */
export function parseOptions(optionStr: string): OptionItem[] {
  if (!optionStr) return [];
  return optionStr
    .split('\n')
    .map(line => {
      const match = line.match(/^(\d+)[：:]\s*(.+)/);
      return match ? { value: match[1], label: match[2] } : null;
    })
    .filter(Boolean) as OptionItem[];
}

/**
 * 根据读写属性返回 CSS class 名
 * △=R/W(绿色), ◎=R(青色), ×=R/w(琥珀色)
 */
export function getWrClass(attr: string): string {
  if (attr === '△') return 'wr-rw';
  if (attr === '◎') return 'wr-r';
  if (attr === '×') return 'wr-rws';
  return 'wr-r';
}

/** 读写属性标签 */
export function getWrLabel(attr: string): string {
  if (attr === '△') return 'R/W';
  if (attr === '◎') return 'R';
  if (attr === '×') return 'R/w';
  return 'R';
}

/** 判断功能码是否可写 */
export function isWritable(fc: FuncCode): boolean {
  return fc.wr_attribute === '△' || fc.wr_attribute === '×';
}

/**
 * 获取功能码的显示值
 * 根据读取状态返回不同的显示文本
 */
export function getDisplayValue(fc: { _value: number | null; _pending: boolean; _error: boolean } & FuncCode): string {
  if (fc._pending) return '...';
  if (fc._error) return 'ERR';
  if (fc._value === null) return '—';
  return rawToDisplay(fc, fc._value);
}

/**
 * 获取值显示的 CSS class
 * 根据读取状态返回不同的颜色 class
 */
export function getValueClass(fc: { _value: number | null; _pending: boolean; _error: boolean }): string {
  if (fc._pending) return 'val-pending';
  if (fc._error) return 'val-error';
  if (fc._value === null) return 'val-empty';
  return '';
}

/**
 * 生成当前时间的格式化字符串
 * 格式：HH:MM:SS.mmm
 */
export function formatTimestamp(date: Date = new Date()): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

/**
 * 生成简短时间字符串
 * 格式：HH:MM:SS
 */
export function formatTimeShort(date: Date = new Date()): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * 从 localStorage 读取 JSON 数据，失败返回默认值
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 将 JSON 数据保存到 localStorage
 */
export function saveToStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 满或不可用时静默失败
  }
}

/**
 * 获取指定分组的功能码数量
 */
export function getGroupCount(group: string, funcodes: FuncCode[]): number {
  return funcodes.filter(fc => fc.group === group).length;
}

/**
 * 获取分组前缀（如 A0、C0）
 */
export function getGroupPrefix(group: string, funcodes: FuncCode[]): string {
  const groupFcs = funcodes.filter(fc => fc.group === group);
  if (groupFcs.length > 0) return groupFcs[0].function_code.split('.')[0];
  return '??';
}
