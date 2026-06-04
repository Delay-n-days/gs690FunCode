//! Tauri 命令层
//! 暴露给前端 invoke() 调用的函数，对应原来的 HTTP API
//!
//! 调试原则：每个命令都有详细日志输出到 stderr，
//! 前端 API 层也会记录详细日志到 UI 日志组件。

use std::time::Duration;
use tauri::State;
use tokio::sync::Mutex;

use crate::protocol;
use crate::serial::{SerialState, list_ports};

/// 全局串口状态
pub type AppState = Mutex<SerialState>;

/// 前端传入的连接参数
#[allow(dead_code)]
#[derive(serde::Deserialize, Debug)]
pub struct ConnectParams {
    pub port: String,
    pub baudrate: u32,
}

/// 前端传入的地址参数
#[derive(serde::Deserialize, Debug)]
pub struct AddressParam {
    pub addr_type: i32,
    pub var_address: u32,
    pub number_type: i32,
}

/// 前端传入的写参数
#[derive(serde::Deserialize, Debug)]
pub struct WriteParam {
    pub addr_type: i32,
    pub var_address: u32,
    pub value: u32,
    pub number_type: i32,
}

/// 前端传入的示波器通道参数
#[derive(serde::Deserialize, Debug)]
pub struct ChannelParam {
    pub channel_number: u32,
    pub addr_type: i32,
    pub var_address: u32,
    pub number_type: i32,
}

/// 获取连接状态
#[tauri::command]
pub async fn get_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let s = state.lock().await;
    let connected = s.is_connected();
    let result = serde_json::json!({
        "connected": connected,
        "port": s.port_name,
        "baudrate": s.baudrate,
        "stats": {
            "tx": s.stats.tx,
            "rx": s.stats.rx,
            "err": s.stats.err,
        }
    });
    // 只在非空闲状态输出日志（避免每秒刷屏）
    if connected {
        eprintln!("[CMD] get_status: connected={}, port={}, baudrate={}", connected, s.port_name.as_deref().unwrap_or(""), s.baudrate.unwrap_or(0));
    }
    Ok(result)
}

/// 打开串口连接
#[tauri::command]
pub async fn connect(
    state: State<'_, AppState>,
    port: String,
    baudrate: u32,
) -> Result<serde_json::Value, String> {
    eprintln!("[CMD] connect: port='{}' baudrate={}", port, baudrate);

    let mut s = state.lock().await;

    // 打开串口
    s.open(&port, baudrate).map_err(|e| {
        let msg = format!("串口打开失败: {} (port={}, baudrate={})", e, port, baudrate);
        eprintln!("[CMD] connect ERROR: {}", msg);
        msg
    })?;

    eprintln!("[CMD] connect: 成功连接到 {}", port);
    Ok(serde_json::json!({
        "status": "connected",
        "port": port,
        "baudrate": baudrate,
    }))
}

/// 关闭串口连接
#[tauri::command]
pub async fn disconnect(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let mut s = state.lock().await;
    let port_name = s.port_name.clone().unwrap_or_default();
    s.close();
    eprintln!("[CMD] disconnect: 已关闭串口 {}", port_name);
    Ok(serde_json::json!({ "status": "disconnected" }))
}

/// 列举可用串口
/// 返回格式与 HTTP API 一致：{ "ports": [...] }
#[tauri::command]
pub async fn search_ports() -> Result<serde_json::Value, String> {
    let ports = list_ports();
    eprintln!("[CMD] search_ports: 找到 {} 个串口", ports.len());
    for p in &ports {
        if let Some(device) = p.get("device").and_then(|v| v.as_str()) {
            eprintln!("  - {}", device);
        }
    }
    Ok(serde_json::json!({ "ports": ports }))
}

/// 批量读取参数
#[tauri::command]
pub async fn read_params(
    state: State<'_, AppState>,
    addresses: Vec<AddressParam>,
) -> Result<serde_json::Value, String> {
    eprintln!("[CMD] read_params: 读取 {} 个地址", addresses.len());

    let s = state.lock().await;

    // 构建协议地址列表
    let addrs: Vec<(i32, u32, i32)> = addresses
        .iter()
        .map(|a| (a.addr_type, a.var_address, a.number_type))
        .collect();

    // 构建帧并发送
    let payload = protocol::build_read_request(&addrs);
    let frame = protocol::create_frame(0x02, protocol::CMD_READ_REQUEST, payload);

    let data = protocol::serialize_frame(&frame);
    eprintln!("[CMD] read_params: 发送 {} 字节帧", data.len());

    // 发送并等待
    let resp = s.send_and_wait(&frame, Duration::from_secs(3)).await.map_err(|e| {
        let msg = format!("读取失败: {}", e);
        eprintln!("[CMD] read_params ERROR: {}", msg);
        msg
    })?;

    let result = protocol::parse_response_payload(&resp).map_err(|e| {
        let msg = format!("解析响应失败: {}", e);
        eprintln!("[CMD] read_params ERROR: {}", msg);
        msg
    })?;

    eprintln!("[CMD] read_params: 成功, result={}", result);
    Ok(result)
}

/// 批量写入参数
#[tauri::command]
pub async fn write_params(
    state: State<'_, AppState>,
    variables: Vec<WriteParam>,
) -> Result<serde_json::Value, String> {
    eprintln!("[CMD] write_params: 写入 {} 个变量", variables.len());

    let s = state.lock().await;

    let vars: Vec<(i32, u32, u32, i32)> = variables
        .iter()
        .map(|v| (v.addr_type, v.var_address, v.value, v.number_type))
        .collect();

    let payload = protocol::build_write_request(&vars);
    let frame = protocol::create_frame(0x02, protocol::CMD_WRITE_REQUEST, payload);

    let data = protocol::serialize_frame(&frame);
    eprintln!("[CMD] write_params: 发送 {} 字节帧", data.len());

    let resp = s.send_and_wait(&frame, Duration::from_secs(3)).await.map_err(|e| {
        let msg = format!("写入失败: {}", e);
        eprintln!("[CMD] write_params ERROR: {}", msg);
        msg
    })?;

    let result = protocol::parse_response_payload(&resp).map_err(|e| {
        let msg = format!("解析响应失败: {}", e);
        eprintln!("[CMD] write_params ERROR: {}", msg);
        msg
    })?;

    eprintln!("[CMD] write_params: 成功, result={}", result);
    Ok(result)
}

/// 配置示波器
#[tauri::command]
pub async fn config_scope(
    state: State<'_, AppState>,
    channels: Vec<ChannelParam>,
    count_every_second: u32,
) -> Result<serde_json::Value, String> {
    eprintln!("[CMD] config_scope: {} 通道, 每秒 {} 次", channels.len(), count_every_second);

    let s = state.lock().await;

    let chs: Vec<(u32, i32, u32, i32)> = channels
        .iter()
        .map(|c| (c.channel_number, c.addr_type, c.var_address, c.number_type))
        .collect();

    let payload = protocol::build_config_scope_request(&chs, count_every_second);
    let frame = protocol::create_frame(0x02, protocol::CMD_CONFIG_SCOPE_REQUEST, payload);

    let resp = s.send_and_wait(&frame, Duration::from_secs(3)).await.map_err(|e| {
        let msg = format!("示波器配置失败: {}", e);
        eprintln!("[CMD] config_scope ERROR: {}", msg);
        msg
    })?;

    let result = protocol::parse_response_payload(&resp).map_err(|e| {
        let msg = format!("解析响应失败: {}", e);
        eprintln!("[CMD] config_scope ERROR: {}", msg);
        msg
    })?;

    eprintln!("[CMD] config_scope: 成功, result={}", result);
    Ok(result)
}

/// 启动/暂停示波器
#[tauri::command]
pub async fn start_pause(
    state: State<'_, AppState>,
    operation: u32,
) -> Result<serde_json::Value, String> {
    eprintln!("[CMD] start_pause: operation={}", operation);

    let s = state.lock().await;

    let payload = protocol::build_start_pause_request(operation);
    let frame = protocol::create_frame(0x02, protocol::CMD_START_PAUSE_REQUEST, payload);

    let resp = s.send_and_wait(&frame, Duration::from_secs(3)).await.map_err(|e| {
        let msg = format!("示波器操作失败: {}", e);
        eprintln!("[CMD] start_pause ERROR: {}", msg);
        msg
    })?;

    let result = protocol::parse_response_payload(&resp).map_err(|e| {
        let msg = format!("解析响应失败: {}", e);
        eprintln!("[CMD] start_pause ERROR: {}", msg);
        msg
    })?;

    eprintln!("[CMD] start_pause: 成功, result={}", result);
    Ok(result)
}

/// 进入 Boot 模式
#[tauri::command]
pub async fn goto_boot(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    eprintln!("[CMD] goto_boot: 请求进入 Boot 模式");

    let s = state.lock().await;

    let payload = protocol::build_goto_boot_request();
    let frame = protocol::create_frame(0x02, protocol::CMD_GOTO_BOOT_REQUEST, payload);

    let resp = s.send_and_wait(&frame, Duration::from_secs(3)).await.map_err(|e| {
        let msg = format!("进入 Boot 失败: {}", e);
        eprintln!("[CMD] goto_boot ERROR: {}", msg);
        msg
    })?;

    let result = protocol::parse_response_payload(&resp).map_err(|e| {
        let msg = format!("解析响应失败: {}", e);
        eprintln!("[CMD] goto_boot ERROR: {}", msg);
        msg
    })?;

    eprintln!("[CMD] goto_boot: 成功, result={}", result);
    Ok(result)
}

/// 导入 Excel 功能码表
#[tauri::command]
pub async fn import_excel(file_path: String, device: String) -> Result<serde_json::Value, String> {
    eprintln!("[CMD] import_excel: file_path='{}' device='{}'", file_path, device);

    let entries = crate::excel::import_excel(&file_path, &device).map_err(|e| {
        let msg = format!("Excel 导入失败: {}", e);
        eprintln!("[CMD] import_excel ERROR: {}", msg);
        msg
    })?;

    eprintln!("[CMD] import_excel: 成功导入 {} 条记录", entries.len());
    Ok(serde_json::json!({ "entries": entries }))
}
