/**
 * GS690 功能码调试终端 — 类型定义
 * 定义所有核心数据结构，确保类型安全
 */

/** 功能码原始数据（来自 Excel/JSON 导入） */
export interface FuncCode {
  device?: string;          // 设备名称（如 "网侧"）
  group: string;            // 功能组（如 "系统参数"）
  address_str: string;      // 相对地址（字符串形式）
  function_code: string;    // 功能码编号（如 "A0.00"）
  comment: string;          // 中文注释
  variable_name?: string;   // 变量名称
  function_code_option: string; // 功能码选项说明
  factory_value: string;    // 出厂值
  ParamValue?: string;      // 参数值
  upper_limit: string;      // 上限
  lower_limit: string;      // 下限
  upper_association?: string;
  lower_association?: string;
  wr_attribute: string;     // 读写属性：△=R/W, ◎=R, ×=R/w
  factor: string;           // 精度系数
  unit: string;             // 单位
  display_format_u16: string; // 显示格式（"1"=十六进制）
  data_width: string;       // 数据宽度（半字数）
  whether_signed: string;   // 是否有符号（"1"=有符号）
}

/** 功能码运行时状态（含读取值和操作状态） */
export interface FuncCodeRuntime extends FuncCode {
  _value: number | null;    // 当前读取到的原始值
  _pending: boolean;        // 是否正在读取中
  _error: boolean;          // 读取是否出错
}

/** 解析后的选项条目 */
export interface OptionItem {
  value: string;
  label: string;
}

/** 串口信息 */
export interface SerialPort {
  device: string;
  description: string;
  hwid: string;
}

/** 读取响应中的单个值 */
export interface ReadValue {
  status: string | number;
  addr_type: number;
  var_address: number;
  value: number;
  number_type: number;
}

/** 写入响应中的状态 */
export interface WriteStatus {
  addr_type: number;
  var_address: number;
  status: string | number;
  current_value: number;
  number_type: number;
}

/** 修改历史记录 */
export interface ModifyHistoryItem {
  function_code: string;
  comment: string;
  oldValue: string;
  newValue: string;
  time: string;
}

/** 通信日志条目 */
export interface LogEntry {
  ts: string;
  type: 'tx' | 'rx' | 'err' | 'info' | 'sys';
  msg: string;
}

/** Toast 通知 */
export interface ToastItem {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  icon: string;
  leaving: boolean;
}

/** 右键菜单配置 */
export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  funcCode: FuncCodeRuntime | null;
}

/** 选项弹出框配置 */
export interface PopoverState {
  visible: boolean;
  x: number;
  y: number;
  funcCode: FuncCodeRuntime | null;
}

/** 后端连接状态 */
export interface BackendStatus {
  connected: boolean;
  port?: string;
  baudrate?: number;
  stats?: { tx: number; rx: number; err: number };
}

/** 分组信息 */
export interface GroupInfo {
  name: string;
  prefix: string;
  count: number;
}
