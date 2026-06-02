//! 前端 API 适配层
//! 支持两种后端：HTTP API（Next.js dev / 部署模式）和 Tauri IPC（桌面模式）
//! 运行时自动检测当前环境，选择对应的调用方式

/// 判断是否在 Tauri 环境中运行
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
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
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function httpPost<T>(endpoint: string, data?: unknown, timeoutMs = 10000): Promise<T> {
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
      const err = await res.text();
      throw new Error(err || `HTTP ${res.status}`);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function httpUpload<T>(endpoint: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(endpoint, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ============================================================
// Tauri IPC 实现（桌面模式）
// ============================================================

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  // @ts-expect-error Tauri API Tauri API
  const { invoke } = window.__TAURI__.core;
  return invoke(cmd, args);
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

/** 打开串口连接 */
export async function connectSerial(port: string, baudrate: number): Promise<{ status: string }> {
  if (isTauri()) {
    return tauriInvoke('connect', { params: { port, baudrate } });
  }
  return httpPost('/api/connect', { port, baudrate });
}

/** 关闭串口连接 */
export async function disconnectSerial(): Promise<{ status: string }> {
  if (isTauri()) {
    return tauriInvoke('disconnect');
  }
  return httpPost('/api/disconnect');
}

/** 搜索可用串口 */
export async function searchPorts(): Promise<PortInfo[]> {
  if (isTauri()) {
    const res = await tauriInvoke<{ ports: PortInfo[] }>('search_ports');
    return res.ports;
  }
  const res = await httpGet<{ ports: PortInfo[] }>('/api/ports');
  return res.ports;
}

/** 批量读取参数 */
export async function readParams(addresses: AddressParam[]): Promise<{ values: Array<{ status: number; addr_type: number; var_address: number; value: number; number_type: number }> }> {
  if (isTauri()) {
    return tauriInvoke('read_params', { addresses });
  }
  return httpPost('/api/read', { addresses }, READ_TIMEOUT_MS);
}

/** 批量写入参数 */
export async function writeParams(variables: WriteParam[]): Promise<{ statuses: Array<{ addr_type: number; var_address: number; status: number; current_value: number; number_type: number }> }> {
  if (isTauri()) {
    return tauriInvoke('write_params', { variables });
  }
  return httpPost('/api/write', { variables });
}

/** 配置示波器 */
export async function configScope(channels: ChannelParam[], countEverySecond: number = 100): Promise<unknown> {
  if (isTauri()) {
    return tauriInvoke('config_scope', { channels, countEverySecond });
  }
  return httpPost('/api/config_scope', { channels, count_every_second: countEverySecond });
}

/** 启动/暂停示波器 */
export async function startPauseScope(operation: number): Promise<unknown> {
  if (isTauri()) {
    return tauriInvoke('start_pause', { operation });
  }
  return httpPost('/api/start_pause', { operation });
}

/** 导入 Excel 功能码表 */
export async function importExcel(file: File, device: string): Promise<{ entries: unknown[] }> {
  if (isTauri()) {
    // Tauri 模式：需要通过文件对话框选择文件
    // @ts-expect-error Tauri API Tauri API
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
