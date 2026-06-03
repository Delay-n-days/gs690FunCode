/**
 * GS690 全局状态管理 — Zustand Store
 * 集中管理功能码数据、连接状态、监视窗口等所有应用状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FuncCode, FuncCodeRuntime, LogEntry, ModifyHistoryItem,
  ContextMenuState, PopoverState, SerialPort,
} from '@/lib/types';
import {
  ADDR_OFFSET, BATCH_SIZE, MAX_LOG_ENTRIES, MAX_HISTORY_ENTRIES,
  STORAGE_KEYS,
} from '@/lib/constants';
import {
  getNumType, loadFromStorage, saveToStorage, formatTimestamp,
} from '@/lib/utils';
import {
  readParams, writeParams, fetchStatus, connectSerial as apiConnect,
  disconnectSerial as apiDisconnect, searchPorts as apiSearchPorts,
} from '@/lib/api';
import { toast } from 'sonner';

/** 将 FuncCode 转为带运行时状态的版本 */
function withRuntime(fc: FuncCode): FuncCodeRuntime {
  return { ...fc, _value: null, _pending: false, _error: false };
}

// ==================== 功能码数据 Store ====================
interface FuncodeState {
  /** 功能码列表（含运行时状态） */
  funcodes: FuncCodeRuntime[];
  /** 搜索过滤文本 */
  filterText: string;
  /** 当前选中的分组 */
  filterGroup: string;
  /** 当前选中的寻址方式 */
  selectedAddrType: number;
  /** 已选中的行（功能码编号集合） */
  selectedRows: Set<string>;
  /** 待写入的值 { 功能码 → 显示值字符串 } */
  pendingWrites: Record<string, string>;

  // Actions
  setFuncodes: (fcs: FuncCode[]) => void;
  replaceFuncodes: (fcs: FuncCode[]) => void;
  setFilterText: (text: string) => void;
  setFilterGroup: (group: string) => void;
  setSelectedAddrType: (t: number) => void;
  toggleRow: (fc: FuncCodeRuntime) => void;
  toggleSelectAll: (checked: boolean, filtered: FuncCodeRuntime[]) => void;
  clearSelection: () => void;
  setPendingWrite: (code: string, value: string) => void;
  clearPendingWrite: (code: string) => void;
  updateFuncodeValue: (code: string, value: number | null, error: boolean) => void;
  setFuncodePending: (code: string, pending: boolean) => void;
}

export const useFuncodeStore = create<FuncodeState>((set, _get) => ({
  funcodes: loadFromStorage<FuncCode[]>(STORAGE_KEYS.FUNCODES, []).map(withRuntime),
  filterText: '',
  filterGroup: loadFromStorage<string>(STORAGE_KEYS.FILTER_GROUP, ''),
  selectedAddrType: 0,
  selectedRows: new Set<string>(),
  pendingWrites: {},

  setFuncodes: (fcs) => set({ funcodes: fcs.map(withRuntime) }),

  replaceFuncodes: (fcs) => {
    saveToStorage(STORAGE_KEYS.FUNCODES, fcs);
    set({ funcodes: fcs.map(withRuntime), selectedRows: new Set() });
  },

  setFilterText: (text) => set({ filterText: text }),

  setFilterGroup: (group) => {
    saveToStorage(STORAGE_KEYS.FILTER_GROUP, group);
    set({ filterGroup: group });
  },

  setSelectedAddrType: (t) => set({ selectedAddrType: t }),

  toggleRow: (fc) => set((s) => {
    const next = new Set(s.selectedRows);
    if (next.has(fc.function_code)) next.delete(fc.function_code);
    else next.add(fc.function_code);
    return { selectedRows: next };
  }),

  toggleSelectAll: (checked, filtered) => set(() => {
    const next = new Set<string>();
    if (checked) filtered.forEach(fc => next.add(fc.function_code));
    return { selectedRows: next };
  }),

  clearSelection: () => set({ selectedRows: new Set(), filterGroup: '' }),

  setPendingWrite: (code, value) => set((s) => ({
    pendingWrites: { ...s.pendingWrites, [code]: value },
  })),

  clearPendingWrite: (code) => set((s) => {
    const next = { ...s.pendingWrites };
    delete next[code];
    return { pendingWrites: next };
  }),

  updateFuncodeValue: (code, value, error) => set((s) => ({
    funcodes: s.funcodes.map(fc =>
      fc.function_code === code ? { ...fc, _value: value, _error: error, _pending: false } : fc
    ),
  })),

  setFuncodePending: (code, pending) => set((s) => ({
    funcodes: s.funcodes.map(fc =>
      fc.function_code === code ? { ...fc, _pending: pending } : fc
    ),
  })),
}));

// ==================== 连接状态 Store ====================
interface ConnectionState {
  connected: boolean;
  busy: boolean;
  statusMsg: string;
  ports: SerialPort[];
  searching: boolean;
  connecting: boolean;
  selectedPort: string;
  selectedBaudrate: number;
  stats: { tx: number; rx: number; err: number };

  checkConnection: () => Promise<void>;
  connect: (port: string, baudrate: number) => Promise<void>;
  disconnect: () => Promise<void>;
  searchPorts: () => Promise<void>;
  setStatusMsg: (msg: string) => void;
  setBusy: (busy: boolean) => void;
  incrementStat: (key: 'tx' | 'rx' | 'err') => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connected: false,
  busy: false,
  statusMsg: '就绪',
  ports: [],
  searching: false,
  connecting: false,
  selectedPort: loadFromStorage<{ port?: string; baudrate?: number }>(STORAGE_KEYS.SERIAL_PREFS, {}).port || '',
  selectedBaudrate: loadFromStorage<{ port?: string; baudrate?: number }>(STORAGE_KEYS.SERIAL_PREFS, {}).baudrate || 115200,
  stats: { tx: 0, rx: 0, err: 0 },

  checkConnection: async () => {
    try {
      const data = await fetchStatus();
      const wasConnected = get().connected;
      set({ connected: data.connected });

      if (data.connected && !wasConnected) {
        toast.success(`串口已连接: ${data.port}`);
        set({ statusMsg: '已连接 · GS690' });
        addLog('info', `串口已连接: ${data.port} 波特率: ${data.baudrate}`);
      } else if (!data.connected && wasConnected) {
        toast.error('串口已断开，请重新连接');
        set({ statusMsg: '已断开' });
        addLog('err', '串口已断开，请重新连接');
        get().searchPorts();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog('err', `状态检查失败: ${msg}`);
      if (get().connected) {
        toast.error('串口连接异常，请检查设备');
        set({ connected: false, statusMsg: '已断开' });
      }
    }
  },

  connect: async (port, baudrate) => {
    set({ connecting: true });
    addLog('info', `尝试连接串口: ${port} 波特率: ${baudrate}`);
    try {
      await apiConnect(port, baudrate);
      set({ connected: true, selectedPort: port, selectedBaudrate: baudrate });
      saveToStorage(STORAGE_KEYS.SERIAL_PREFS, { port, baudrate });
      toast.success(`串口连接成功: ${port}`);
      set({ statusMsg: '已连接 · GS690' });
      addLog('info', `串口连接成功: ${port} 波特率: ${baudrate}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog('err', `串口连接失败: ${msg}`);
      toast.error(`连接失败: ${msg}`);
      throw e;
    } finally {
      set({ connecting: false });
    }
  },

  disconnect: async () => {
    const port = get().selectedPort;
    addLog('info', `断开串口: ${port || '未连接'}`);
    try {
      await apiDisconnect();
    } catch { /* 忽略断开错误 */ }
    set({ connected: false, statusMsg: '已断开' });
    toast.info('串口已断开');
    addLog('info', '串口已断开');
  },

  searchPorts: async () => {
    set({ searching: true });
    addLog('info', '搜索串口设备...');
    try {
      const ports = await apiSearchPorts();
      set({ ports });
      addLog('info', `搜索完成: 找到 ${ports.length} 个串口`);
      if (ports.length === 0) {
        addLog('err', '未找到任何串口设备，请检查连接');
      } else {
        ports.forEach(p => addLog('info', `  ${p.device} - ${p.description}`));
      }
      if (ports.length > 0 && !get().selectedPort) {
        set({ selectedPort: ports[0].device });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog('err', `搜索串口失败: ${msg}`);
      toast.error(`搜索串口失败: ${msg}`);
    } finally {
      set({ searching: false });
    }
  },

  setStatusMsg: (msg) => set({ statusMsg: msg }),
  setBusy: (busy) => set({ busy }),
  incrementStat: (key) => set((s) => ({
    stats: { ...s.stats, [key]: s.stats[key] + 1 },
  })),
}));

// ==================== 读写操作 Store ====================
interface ReadWriteState {
  /** 批量读取选中的功能码 */
  readSelected: () => Promise<void>;
  /** 读取全部过滤后的功能码 */
  readAll: () => Promise<void>;
  /** 读取单个功能码 */
  readSingle: (fc: FuncCodeRuntime) => Promise<void>;
  /** 写入单个功能码 */
  writeSingle: (fc: FuncCodeRuntime) => Promise<void>;
  /** 批量写入选中的功能码 */
  writeSelected: () => Promise<void>;
  /** 自动读取当前分组 */
  autoReadGroup: () => Promise<void>;
}

/** 从后端批量读取功能码的值 */
async function readFromBackend(
  fcs: FuncCodeRuntime[],
  addrType: number,
  addLog: (type: LogEntry['type'], msg: string) => void,
  incrementStat: (key: 'tx' | 'rx' | 'err') => void,
) {
  const addresses = fcs.map(fc => ({
    addr_type: addrType,
    var_address: parseInt(fc.address_str) + ADDR_OFFSET,
    number_type: getNumType(fc),
  }));

  incrementStat('tx');
  addLog('tx', `► TX READ_REQ (${fcs.length} addrs)`);

  try {
    const data = await readParams(addresses);
    const values = data.values || [];

    fcs.forEach((fc, i) => {
      if (i < values.length) {
        const v = values[i];
        if (v.status === 0) {
          useFuncodeStore.getState().updateFuncodeValue(fc.function_code, v.value, false);
        } else {
          useFuncodeStore.getState().updateFuncodeValue(fc.function_code, null, true);
          addLog('err', `✗ ${fc.function_code} 状态: ${v.status}`);
        }
      }
      useFuncodeStore.getState().setFuncodePending(fc.function_code, false);
    });

    incrementStat('rx');
    addLog('rx', `◄ RX READ_RESP [SUCCESS] (${values.length} values)`);
  } catch (e: unknown) {
    incrementStat('err');
    fcs.forEach(fc => {
      useFuncodeStore.getState().updateFuncodeValue(fc.function_code, null, true);
    });
    addLog('err', `✗ READ 失败: ${e instanceof Error ? e.message : '未知错误'}`);
    throw e;
  }
}

/** 从后端批量写入功能码的值 */
async function writeToBackend(
  fcs: FuncCodeRuntime[],
  rawValues: number[],
  addrType: number,
  addLog: (type: LogEntry['type'], msg: string) => void,
  incrementStat: (key: 'tx' | 'rx' | 'err') => void,
) {
  const variables = fcs.map((fc, i) => ({
    addr_type: addrType,
    var_address: parseInt(fc.address_str) + ADDR_OFFSET,
    value: rawValues[i],
    number_type: getNumType(fc),
  }));

  incrementStat('tx');
  addLog('tx', `► TX WRITE_REQ (${fcs.length} vars)`);

  try {
    const data = await writeParams(variables);
    const statuses = data.statuses || [];

    fcs.forEach((fc, i) => {
      if (i < statuses.length) {
        const s = statuses[i];
        if (s.status === 0) {
          useFuncodeStore.getState().updateFuncodeValue(fc.function_code, s.current_value, false);
        } else {
          useFuncodeStore.getState().updateFuncodeValue(fc.function_code, null, true);
          addLog('err', `✗ ${fc.function_code} 写入失败: ${s.status}`);
          toast.error(`${fc.function_code} 写入失败: ${s.status}`);
        }
      }
      useFuncodeStore.getState().setFuncodePending(fc.function_code, false);
    });

    incrementStat('rx');
    addLog('rx', `◄ RX WRITE_RESP [SUCCESS] (${statuses.length} written)`);
  } catch (e: unknown) {
    incrementStat('err');
    fcs.forEach(fc => {
      useFuncodeStore.getState().updateFuncodeValue(fc.function_code, null, true);
    });
    addLog('err', `✗ WRITE 失败: ${e instanceof Error ? e.message : '未知错误'}`);
    throw e;
  }
}

export const useReadWriteStore = create<ReadWriteState>(() => ({
  readSelected: async () => {
    const { funcodes, selectedRows, selectedAddrType } = useFuncodeStore.getState();
    const { connected, busy, setBusy, setStatusMsg, incrementStat } = useConnectionStore.getState();
    if (!connected || selectedRows.size === 0 || busy) return;

    const fcs = funcodes.filter(fc => selectedRows.has(fc.function_code));
    setBusy(true);
    setStatusMsg(`批量读取 ${selectedRows.size} 个功能码...`);
    fcs.forEach(fc => useFuncodeStore.getState().setFuncodePending(fc.function_code, true));

    try {
      for (let i = 0; i < fcs.length; i += BATCH_SIZE) {
        await readFromBackend(fcs.slice(i, i + BATCH_SIZE), selectedAddrType, addLog, incrementStat);
      }
    } finally {
      setBusy(false);
      setStatusMsg(`批量读取完成 · ${fcs.length} 个`);
    }
  },

  readAll: async () => {
    const { funcodes, filterText, filterGroup, selectedAddrType } = useFuncodeStore.getState();
    const { connected, busy, setBusy, setStatusMsg, incrementStat } = useConnectionStore.getState();
    if (!connected || busy) return;

    // 获取过滤后的功能码
    const fcs = funcodes.filter(fc => {
      if (filterGroup && fc.group !== filterGroup) return false;
      if (filterText) {
        const txt = filterText.toLowerCase();
        return (fc.function_code || '').toLowerCase().includes(txt)
          || (fc.comment || '').toLowerCase().includes(txt)
          || (fc.variable_name || '').toLowerCase().includes(txt);
      }
      return true;
    });

    setBusy(true);
    setStatusMsg(`读取全部 ${fcs.length} 个功能码...`);
    fcs.forEach(fc => useFuncodeStore.getState().setFuncodePending(fc.function_code, true));

    try {
      for (let i = 0; i < fcs.length; i += BATCH_SIZE) {
        await readFromBackend(fcs.slice(i, i + BATCH_SIZE), selectedAddrType, addLog, incrementStat);
      }
    } finally {
      setBusy(false);
      setStatusMsg(`读取完成 · ${fcs.length} 个`);
    }
  },

  readSingle: async (fc) => {
    const { connected, setBusy, setStatusMsg, incrementStat } = useConnectionStore.getState();
    const { selectedAddrType } = useFuncodeStore.getState();
    if (!connected) return;

    setBusy(true);
    setStatusMsg(`读取 ${fc.function_code}...`);
    useFuncodeStore.getState().setFuncodePending(fc.function_code, true);

    try {
      await readFromBackend([fc], selectedAddrType, addLog, incrementStat);
      const updated = useFuncodeStore.getState().funcodes.find(f => f.function_code === fc.function_code);
      setStatusMsg(`读取完成 · ${fc.function_code} = ${updated?._value ?? '—'}`);
    } finally {
      setBusy(false);
    }
  },

  writeSingle: async (fc) => {
    const { connected, setBusy, setStatusMsg, incrementStat } = useConnectionStore.getState();
    const { selectedAddrType, pendingWrites } = useFuncodeStore.getState();
    const valStr = pendingWrites[fc.function_code];
    if (!connected || !valStr) return;

    // 验证值
    const { displayToRaw, getDisplayUpperLimitNum, getDisplayLowerLimitNum } = await import('@/lib/utils');
    let raw: number;
    try {
      raw = displayToRaw(fc, valStr);
    } catch (e: unknown) {
      addLog('err', `✗ ${fc.function_code} 值无效: ${e instanceof Error ? e.message : '未知错误'}`);
      toast.error(`${fc.function_code} 值无效`);
      incrementStat('err');
      return;
    }

    // 范围检查
    const lo = getDisplayLowerLimitNum(fc);
    const hi = getDisplayUpperLimitNum(fc);
    const displayV = fc.display_format_u16 === '1' ? parseInt(valStr, 16) : parseFloat(valStr);
    if (!isNaN(lo) && !isNaN(hi) && (displayV < lo || displayV > hi)) {
      addLog('err', `✗ ${fc.function_code} 超出范围 [${lo}~${hi}]`);
      toast.error(`${fc.function_code} 超出范围 [${lo}~${hi}]`);
      incrementStat('err');
      return;
    }

    const { getDisplayValue } = await import('@/lib/utils');
    const oldValue = getDisplayValue(fc);

    setBusy(true);
    setStatusMsg(`写入 ${fc.function_code} = ${valStr}...`);
    useFuncodeStore.getState().setFuncodePending(fc.function_code, true);

    try {
      await writeToBackend([fc], [raw], selectedAddrType, addLog, incrementStat);
      useFuncodeStore.getState().clearPendingWrite(fc.function_code);
      useHistoryStore.getState().addItem(fc, oldValue, valStr);
      toast.success(`${fc.function_code} 写入成功`);
    } finally {
      setBusy(false);
      setStatusMsg(`写入完成 · ${fc.function_code}`);
    }
  },

  writeSelected: async () => {
    const { funcodes, selectedRows, selectedAddrType, pendingWrites } = useFuncodeStore.getState();
    const { setBusy, setStatusMsg, incrementStat } = useConnectionStore.getState();
    const { displayToRaw, isWritable } = await import('@/lib/utils');

    const fcs = funcodes.filter(fc => selectedRows.has(fc.function_code) && isWritable(fc));
    if (!fcs.length) {
      toast.warning('无可写功能码已选中');
      return;
    }

    const values = fcs.map(fc => {
      const str = pendingWrites[fc.function_code] || fc.factory_value;
      try { return displayToRaw(fc, str); }
      catch { return parseInt(fc.factory_value) || 0; }
    });

    setBusy(true);
    setStatusMsg(`批量写入 ${fcs.length} 个...`);
    try {
      await writeToBackend(fcs, values, selectedAddrType, addLog, incrementStat);
      toast.success(`批量写入完成 · ${fcs.length} 个`);
    } finally {
      setBusy(false);
      setStatusMsg(`批量写入完成`);
    }
  },

  autoReadGroup: async () => {
    const { funcodes, filterText, filterGroup, selectedAddrType } = useFuncodeStore.getState();
    const { connected, busy, incrementStat } = useConnectionStore.getState();
    if (connected && !busy) {
      const fcs = funcodes.filter(fc => {
        if (filterGroup && fc.group !== filterGroup) return false;
        if (filterText) {
          const txt = filterText.toLowerCase();
          return (fc.function_code || '').toLowerCase().includes(txt)
            || (fc.comment || '').toLowerCase().includes(txt);
        }
        return true;
      });
      if (fcs.length === 0) return;
      fcs.forEach(fc => useFuncodeStore.getState().setFuncodePending(fc.function_code, true));
      try {
        for (let i = 0; i < fcs.length; i += BATCH_SIZE) {
          await readFromBackend(fcs.slice(i, i + BATCH_SIZE), selectedAddrType, addLog, incrementStat);
        }
      } catch { /* 错误已在 readFromBackend 中处理 */ }
    }
  },
}));

// ==================== 日志 Store ====================
interface LogState {
  logs: LogEntry[];
  autoScroll: boolean;
  addLog: (type: LogEntry['type'], msg: string) => void;
  clearLogs: () => void;
  setAutoScroll: (v: boolean) => void;
  copyLogs: () => void;
  exportLogs: () => void;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  autoScroll: true,

  addLog: (type, msg) => set((s) => {
    const logs = [...s.logs, { ts: formatTimestamp(), type, msg }];
    if (logs.length > MAX_LOG_ENTRIES) logs.shift();
    return { logs };
  }),

  clearLogs: () => set({ logs: [] }),
  setAutoScroll: (v) => set({ autoScroll: v }),

  copyLogs: () => {
    const text = get().logs.map(e => `[${e.ts}] ${e.msg}`).join('\n');
    navigator.clipboard.writeText(text).then(
      () => toast.success('日志已复制到剪贴板'),
      () => toast.error('复制失败'),
    );
  },

  exportLogs: () => {
    const text = get().logs.map(e => `[${e.ts}] ${e.msg}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `GS690_log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('日志已导出');
  },
}));

// 给模块内部使用的 addLog 快捷方式
function addLog(type: LogEntry['type'], msg: string) {
  useLogStore.getState().addLog(type, msg);
}

// ==================== 监视窗口 Store ====================
interface MonitorState {
  items: FuncCodeRuntime[];
  monitoring: boolean;
  monitorTimer: ReturnType<typeof setInterval> | null;

  addToWatch: (fc: FuncCodeRuntime) => void;
  removeFromWatch: (index: number) => void;
  clearWatch: () => void;
  startMonitor: () => Promise<void>;
  stopMonitor: () => void;
  readWatchItems: () => Promise<void>;
}

export const useMonitorStore = create<MonitorState>((set, get) => ({
  items: loadFromStorage<FuncCode[]>(STORAGE_KEYS.WATCH_ITEMS, []).map(withRuntime),
  monitoring: false,
  monitorTimer: null,

  addToWatch: (fc) => {
    const { items } = get();
    if (items.length >= 20) {
      toast.warning('监视窗口已满，最多20个');
      return;
    }
    if (items.find(item => item.function_code === fc.function_code)) {
      toast.info(`${fc.function_code} 已在监视窗口中`);
      return;
    }
    const newItems = [...items, { ...fc, _value: null, _pending: false, _error: false }];
    set({ items: newItems });
    saveToStorage(STORAGE_KEYS.WATCH_ITEMS, newItems);
    toast.success(`已添加 ${fc.function_code} 到监视窗口`);
  },

  removeFromWatch: (index) => {
    const items = [...get().items];
    items.splice(index, 1);
    set({ items });
    saveToStorage(STORAGE_KEYS.WATCH_ITEMS, items);
  },

  clearWatch: () => {
    get().stopMonitor();
    set({ items: [] });
    saveToStorage(STORAGE_KEYS.WATCH_ITEMS, []);
  },

  readWatchItems: async () => {
    const { items } = get();
    const { connected, incrementStat } = useConnectionStore.getState();
    const { selectedAddrType } = useFuncodeStore.getState();
    if (items.length === 0 || !connected) return;

    const addresses = items.map(fc => ({
      addr_type: selectedAddrType,
      var_address: parseInt(fc.address_str) + ADDR_OFFSET,
      number_type: getNumType(fc),
    }));

    try {
      const data = await readParams(addresses);
      const values = data.values || [];
      const updatedItems = items.map((fc, i) => {
        if (i < values.length) {
          const v = values[i];
          if (v.status === 0) {
            return { ...fc, _value: v.value, _error: false, _pending: false };
          }
          return { ...fc, _error: true, _pending: false };
        }
        return { ...fc, _pending: false };
      });
      set({ items: updatedItems });
      incrementStat('rx');
    } catch {
      const updatedItems = items.map(fc => ({ ...fc, _error: true }));
      set({ items: updatedItems });
    }
  },

  startMonitor: async () => {
    if (get().monitoring) return;
    set({ monitoring: true });
    toast.info('开始监控');
    await get().readWatchItems();
    const timer = setInterval(() => get().readWatchItems(), 1000);
    set({ monitorTimer: timer });
  },

  stopMonitor: () => {
    const { monitorTimer } = get();
    if (monitorTimer) clearInterval(monitorTimer);
    set({ monitoring: false, monitorTimer: null });
  },
}));

// ==================== 修改历史 Store ====================
interface HistoryState {
  items: ModifyHistoryItem[];
  addItem: (fc: FuncCode, oldValue: string, newValue: string) => void;
  removeItem: (index: number) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(persist((set) => ({
  items: [],

  addItem: (fc, oldValue, newValue) => set((s) => {
    const items = [{
      function_code: fc.function_code,
      comment: fc.comment,
      oldValue,
      newValue,
      time: formatTimestamp(),
    }, ...s.items].slice(0, MAX_HISTORY_ENTRIES);
    return { items };
  }),

  removeItem: (index) => set((s) => {
    const items = [...s.items];
    items.splice(index, 1);
    return { items };
  }),

  clearHistory: () => {
    set({ items: [] });
  },
}), {
  name: 'gs690_history',
  partialize: (s) => ({ items: s.items }),
}));

// ==================== UI 状态 Store ====================
interface UIState {
  rightPanelVisible: boolean;
  monitorPanelVisible: boolean;
  rightTab: 'log' | 'batch' | 'settings';
  bottomTab: 'monitor' | 'favorite' | 'history' | 'frequent';
  dialogVisible: boolean;
  contextMenu: ContextMenuState;
  popover: PopoverState;
  mainFlex: number;

  toggleRightPanel: () => void;
  toggleMonitorPanel: () => void;
  setRightTab: (tab: UIState['rightTab']) => void;
  setBottomTab: (tab: UIState['bottomTab']) => void;
  setDialogVisible: (v: boolean) => void;
  setContextMenu: (state: ContextMenuState) => void;
  setPopover: (state: PopoverState) => void;
  setMainFlex: (v: number) => void;
  closeContextMenu: () => void;
  closePopover: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  rightPanelVisible: false,
  monitorPanelVisible: true,
  rightTab: 'log',
  bottomTab: 'monitor',
  dialogVisible: false,
  contextMenu: { visible: false, x: 0, y: 0, funcCode: null },
  popover: { visible: false, x: 0, y: 0, funcCode: null },
  mainFlex: 60,

  toggleRightPanel: () => set((s) => ({ rightPanelVisible: !s.rightPanelVisible })),
  toggleMonitorPanel: () => set((s) => ({ monitorPanelVisible: !s.monitorPanelVisible })),
  setRightTab: (tab) => set({ rightTab: tab }),
  setBottomTab: (tab) => set({ bottomTab: tab }),
  setDialogVisible: (v) => set({ dialogVisible: v }),
  setContextMenu: (state) => set({ contextMenu: state }),
  setPopover: (state) => set({ popover: state }),
  setMainFlex: (v) => set({ mainFlex: v }),
  closeContextMenu: () => set((s) => ({ contextMenu: { ...s.contextMenu, visible: false } })),
  closePopover: () => set((s) => ({ popover: { ...s.popover, visible: false } })),
}));
