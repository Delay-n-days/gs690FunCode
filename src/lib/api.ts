/**
 * GS690 后端 API 客户端
 * 封装所有与 FastAPI 后端的通信
 */

import { READ_TIMEOUT_MS } from './constants';

/**
 * 通用 API 调用函数
 * 带超时控制和错误处理
 */
export async function apiCall<T = unknown>(
  endpoint: string,
  data?: unknown,
  timeout: number = READ_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  if (timeout > 0) {
    timer = setTimeout(() => controller.abort(), timeout);
  }

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data !== undefined ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: resp.statusText }));
      throw new Error(err.detail || `HTTP ${resp.status}`);
    }

    return resp.json();
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('请求超时，请检查设备连接');
    }
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** 获取后端连接状态 */
export async function fetchStatus() {
  const resp = await fetch('/api/status');
  return resp.json() as Promise<{
    connected: boolean;
    port?: string;
    baudrate?: number;
    stats?: { tx: number; rx: number; err: number };
  }>;
}

/** 连接串口 */
export async function connectSerial(port: string, baudrate: number) {
  return apiCall('/api/connect', { port, baudrate });
}

/** 断开串口 */
export async function disconnectSerial() {
  return apiCall('/api/disconnect');
}

/** 搜索可用串口 */
export async function searchPorts() {
  const resp = await fetch('/api/ports');
  const data = await resp.json();
  return data.ports as Array<{ device: string; description: string; hwid: string }>;
}

/** 批量读取参数 */
export async function readParams(
  addresses: Array<{ addr_type: number; var_address: number; number_type: number }>,
) {
  return apiCall<{ values: Array<{ status: string | number; value: number }> }>(
    '/api/read',
    { addresses },
  );
}

/** 批量写入参数 */
export async function writeParams(
  variables: Array<{ addr_type: number; var_address: number; value: number; number_type: number }>,
) {
  return apiCall<{ statuses: Array<{ status: string | number; current_value: number }> }>(
    '/api/write',
    { variables },
  );
}

/** 配置示波器 */
export async function configScope(
  channels: Array<{ channel_number: number; addr_type: number; var_address: number; number_type: number }>,
  countEverySecond: number,
) {
  return apiCall('/api/config_scope', { channels, count_every_second: countEverySecond });
}

/** 启动/暂停示波器 */
export async function startPauseScope(operation: number) {
  return apiCall('/api/start_pause', { operation });
}

/** 导入 Excel 文件 */
export async function importExcel(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const resp = await fetch('/api/import_excel', { method: 'POST', body: formData });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail || `HTTP ${resp.status}`);
  }
  return resp.json();
}
