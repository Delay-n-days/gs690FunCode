/**
 * 前端 API 适配层
 * 支持两种后端：HTTP API（Next.js dev / 部署模式）和 Tauri IPC（桌面模式）
 * 运行时自动检测当前环境，选择对应的调用方式
 *
 * 每个 API 调用都会记录详细日志到日志组件（LogStore），
 * 便于排查串口通信和后端调用问题。
 */

import { useLogStore } from '@/store';

/// 判断是否在 Tauri 环境中运行
function isTauri(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

/// 写入日志到日志组件（用户可在 UI 里复制）
function logApi(type: 'tx' | 'rx' | 'err' | 'info', msg: string) {
  try { useLogStore.getState().addLog(type, `[API] ${msg}`); } catch { /* 忽略 */ }
}

/// 通用类型：后端连接状态
export interface BackendStatus {
  connected: boolean;
  port?: string;
  baudrate?: number;
  stats: { tx: number; rx: number; err: number };
}

/// 通用类型：串口设备信息
export interface PortInfo {
  device: string;
  description: string;
  hwid: string;
}

/// 通用类型：读取参数
export interface AddressParam {
  addr_type: number;
  var_address: number;
  number_type: number;
}

/// 通用类型：写入参数
export interface WriteParam {
  addr_type: number;
  var_address: number;
  value: number;
  number_type: number;
}

/// 通用类型：示波器通道
export interface ChannelParam {
  channel_number: number;
  addr_type: number;
  var_address: number;
  number_type: number;
}

/// 超时常量
const READ_TIMEOUT_MS = 3000;

// ============================================================
// HTTP API 实现（Next.js 模式）
// ============================================================

async function httpGet<T>(endpoint: string): Promise<T> {
  logApi('tx', `HTTP GET ${endpoint}`);
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      const err = await res.text().catch(() => `HTTP ${res.status}`);
      logApi('err', `HTTP GET ${endpoint} 失败: ${res.status} ${err}`);
      throw new Error(err || `HTTP ${res.status}`);
    }
    const data = await res.json() as T;
    logApi('rx', `HTTP GET ${endpoint} 成功`);
    return data;
  } catch (e) {
    logApi('err', `HTTP GET ${endpoint} 异常: ${e instanceof Error ? e.message : e}`);
    throw e;
  }
}

async function httpPost<T>(endpoint: string, data?: unknown, timeoutMs = 10000): Promise<T> {
  logApi('tx', `HTTP POST ${endpoint} data=${JSON.stringify(data || {}).slice(0, 200)}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => `HTTP ${res.status}`);
      logApi('err', `HTTP POST ${endpoint} 失败: ${res.status} ${err}`);
      throw new Error(err || `HTTP ${res.status}`);
    }
    const result = await res.json() as T;
    logApi('rx', `HTTP POST ${endpoint} 成功`);
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logApi('err', `HTTP POST ${endpoint} 异常: ${msg}`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function httpUpload<T>(endpoint: string, file: File): Promise<T> {
  logApi('tx', `HTTP UPLOAD ${endpoint} file=${file.name} size=${file.size}`);
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch(endpoint, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.text().catch(() => `HTTP ${res.status}`);
      logApi('err', `HTTP UPLOAD ${endpoint} 失败: ${res.status} ${err}`);
      throw new Error(err || `HTTP ${res.status}`);
    }
    const data = await res.json() as T;
    logApi('rx', `HTTP UPLOAD ${endpoint} 成功`);
    return data;
  } catch (e) {
    logApi('err', `HTTP UPLOAD ${endpoint} 异常: ${e instanceof Error ? e.message : e}`);
    throw e;
  }
}

// ============================================================
// Tauri IPC 实现（桌面模式）
// ============================================================

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  logApi('tx', `Tauri IPC invoke('${cmd}') args=${JSON.stringify(args || {}).slice(0, 200)}`);
  try {
    // @ts-expect-error Tauri API
    const invoke = window.__TAURI_INTERNALS__.invoke;
    const result = await invoke(cmd, args) as T;
    logApi('rx', `Tauri IPC invoke('${cmd}') 成功: ${JSON.stringify(result).slice(0, 200)}`);
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logApi('err', `Tauri IPC invoke('${cmd}') 失败: ${msg}`);
    throw e;
  }
}

// ============================================================
// 统一 API 导出 — 运行时自动选择实现
// ============================================================

/** 获取后端连接状态 */
export async function fetchStatus(): Promise<BackendStatus> {
  if (isTauri()) {
    return tauriInvoke('get_status');
  }
  return httpGet('/api/status');
}

/**
 * 打开串口连接
 * Tauri IPC：参数必须拍平，不能嵌套 { params: { ... } }
 */
export async function connectSerial(port: string, baudrate: number): Promise<{ status: string }> {
  logApi('info', `打开串口: ${port} 波特率: ${baudrate}`);
  if (isTauri()) {
    // Tauri IPC 参数拍平传递：{ port, baudrate }
    return tauriInvoke('connect', { port, baudrate });
  }
  return httpPost('/api/connect', { port, baudrate });
}

/** 关闭串口连接 */
export async function disconnectSerial(): Promise<{ status: string }> {
  logApi('info', '关闭串口');
  if (isTauri()) {
    return tauriInvoke('disconnect');
  }
  return httpPost('/api/disconnect');
}

/** 搜索可用串口 */
export async function searchPorts(): Promise<PortInfo[]> {
  logApi('info', '搜索串口设备');
  if (isTauri()) {
    const res = await tauriInvoke<{ ports: PortInfo[] }>('search_ports');
    logApi('info', `找到 ${res.ports.length} 个串口`);
    return res.ports;
  }
  const res = await httpGet<{ ports: PortInfo[] }>('/api/ports');
  logApi('info', `找到 ${res.ports.length} 个串口`);
  return res.ports;
}

/** 批量读取参数 */
export async function readParams(addresses: AddressParam[]): Promise<{ values: Array<{ status: number; addr_type: number; var_address: number; value: number; number_type: number }> }> {
  logApi('tx', `批量读取 ${addresses.length} 个地址: ${JSON.stringify(addresses).slice(0, 200)}`);
  if (isTauri()) {
    return tauriInvoke('read_params', { addresses });
  }
  return httpPost('/api/read', { addresses }, READ_TIMEOUT_MS);
}

/** 批量写入参数 */
export async function writeParams(variables: WriteParam[]): Promise<{ statuses: Array<{ addr_type: number; var_address: number; status: number; current_value: number; number_type: number }> }> {
  logApi('tx', `批量写入 ${variables.length} 个变量: ${JSON.stringify(variables).slice(0, 200)}`);
  if (isTauri()) {
    return tauriInvoke('write_params', { variables });
  }
  return httpPost('/api/write', { variables });
}

/** 配置示波器 */
export async function configScope(channels: ChannelParam[], countEverySecond: number = 100): Promise<unknown> {
  logApi('tx', `配置示波器 ${channels.length} 通道`);
  if (isTauri()) {
    return tauriInvoke('config_scope', { channels, countEverySecond });
  }
  return httpPost('/api/config_scope', { channels, count_every_second: countEverySecond });
}

/** 启动/暂停示波器 */
export async function startPauseScope(operation: number): Promise<unknown> {
  logApi('tx', `示波器 操作=${operation}`);
  if (isTauri()) {
    return tauriInvoke('start_pause', { operation });
  }
  return httpPost('/api/start_pause', { operation });
}

/** 进入 Boot 模式 */
export async function gotoBoot(): Promise<unknown> {
  logApi('tx', '进入 Boot 模式');
  if (isTauri()) {
    return tauriInvoke('goto_boot');
  }
  return httpPost('/api/goto_boot');
}

/** 导入 Excel 功能码表 */
export async function importExcel(file: File, device: string): Promise<{ entries: unknown[] }> {
  logApi('tx', `导入 Excel: ${file.name} 设备: ${device}`);
  if (isTauri()) {
    // Tauri 模式：需要通过文件对话框选择文件
    // @ts-expect-error Tauri API
    const { open } = window.__TAURI__.dialog;
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
    });
    if (!selected) throw new Error('未选择文件');
    return tauriInvoke('import_excel', { filePath: selected, device });
  }
  return httpUpload('/api/import_excel', file);
}
