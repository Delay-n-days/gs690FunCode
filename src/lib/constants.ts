/**
 * GS690 协议常量
 * 与后端 protocol_handler.py 保持一致
 */

/** 命令字定义 */
export const CMD = {
  READ_REQUEST: 0x0100,
  READ_RESPONSE: 0x8100,
  WRITE_REQUEST: 0x0101,
  WRITE_RESPONSE: 0x8101,
  CONFIG_SCOPE_REQUEST: 0x0200,
  CONFIG_SCOPE_RESPONSE: 0x8200,
  START_PAUSE_REQUEST: 0x0201,
  START_PAUSE_RESPONSE: 0x8201,
  DATA_TRANSFER: 0x8202,
  GOTO_BOOT_REQUEST: 0x0300,
  GOTO_BOOT_RESPONSE: 0x8300,
} as const;

/** 寻址方式枚举 */
export const AddrType = {
  DSP_CODE: 0,
  DSP_MEM: 1,
  PG_CODE: 2,
  PG_MEM: 3,
  COMM_CODE: 4,
  COMM_MEM: 5,
} as const;

/** 寻址方式名称映射 */
export const ADDR_TYPE_NAMES: Record<number, string> = {
  0: 'DSP_CODE',
  1: 'DSP_MEM',
  2: 'PG_CODE',
  3: 'PG_MEM',
  4: 'COMM_CODE',
  5: 'COMM_MEM',
};

/** 数据类型枚举 */
export const NumberType = {
  BIT16: 0,
  BIT32: 1,
  BIT8: 2,
} as const;

/** 状态码名称映射 */
export const STATUS_NAMES: Record<number, string> = {
  0: 'SUCCESS',
  1: 'FAILED',
  2: 'TIMEOUT',
  3: 'INVALID_ADDRESS',
  4: 'INVALID_VALUE',
  5: 'PERMISSION_DENIED',
  6: 'DEVICE_BUSY',
  255: 'UNKNOWN_ERROR',
};

/** 地址偏移量（硬件地址 = 功能码相对地址 + 此偏移） */
export const ADDR_OFFSET = 0xa400;

/** 读取超时时间（毫秒） */
export const READ_TIMEOUT_MS = 3000;

/** 每批最大读取地址数 */
export const BATCH_SIZE = 16;

/** 监视窗口最大项目数 */
export const MAX_WATCH_ITEMS = 20;

/** 日志最大条数 */
export const MAX_LOG_ENTRIES = 500;

/** 修改历史最大条数 */
export const MAX_HISTORY_ENTRIES = 100;

/** 字体配置 */
export const FONT_CONFIG = {
  mono: {
    mono: "'Share Tech Mono', monospace",
    sans: "'Noto Sans SC', sans-serif",
  },
  msyh: {
    mono: "'Microsoft YaHei', sans-serif",
    sans: "'Microsoft YaHei', sans-serif",
  },
  consola: {
    mono: "'Consolas', monospace",
    sans: "'Consolas', monospace",
  },
  smiley: {
    mono: "'Smiley Sans', sans-serif",
    sans: "'Smiley Sans', sans-serif",
  },
} as const;

/** 字体模式标签 */
export const FONT_LABELS: Record<string, string> = {
  mono: '等宽字体',
  msyh: '微软雅黑',
  consola: 'Consolas',
  smiley: '得意黑',
};

/** localStorage 键名前缀 */
export const STORAGE_KEYS = {
  FUNCODES: 'gs690_funcodes',
  THEME: 'gs690_theme',
  FONT: 'gs690_font',
  SCANLINE: 'gs690_scanline',
  FILTER_GROUP: 'gs690_filter_group',
  SERIAL_PREFS: 'gs690_serial_prefs',
  WATCH_ITEMS: 'gs690_watch_items',
  MODIFY_HISTORY: 'gs690_modify_history',
  FAVORITES: 'gs690_favorites',
  FREQUENT_STATS: 'gs690_frequent_stats',
} as const;
