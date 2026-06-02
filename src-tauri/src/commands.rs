//! Tauri 命令层
//! 暴露给前端 invoke() 调用的函数，对应原来的 HTTP API

use std::time::Duration;
use tauri::State;
use tokio::sync::Mutex;

use crate::protocol;
use crate::serial::{SerialState, list_ports};

/// 全局串口状态
pub type AppState = Mutex<SerialState>;

/// 前端传入的连接参数
#[derive(serde::Deserialize)]
pub struct ConnectParams {
    pub port: String,
    pub baudrate: u32,
}

/// 前端传入的地址参数
#[derive(serde::Deserialize)]
pub struct AddressParam {
    pub addr_type: i32,
    pub var_address: u32,
    pub number_type: i32,
}

/// 前端传入的写参数
#[derive(serde::Deserialize)]
pub struct WriteParam {
    pub addr_type: i32,
    pub var_address: u32,
    pub value: u32,
    pub number_type: i32,
}

/// 前端传入的示波器通道参数
#[derive(serde::Deserialize)]
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
    Ok(serde_json::json!({
        "connected": s.is_connected(),
        "port": s.port_name,
        "baudrate": s.baudrate,
        "stats": {
            "tx": s.stats.tx,
            "rx": s.stats.rx,
            "err": s.stats.err,
        }
    }))
}

/// 打开串口
#[tauri::command]
pub async fn connect(
    state: State<'_, AppState>,
    params: ConnectParams,
) -> Result<serde_json::Value, String> {
    let mut s = state.lock().await;
    s.open(&params.port, params.baudrate)?;
    Ok(serde_json::json!({
        "status": "connected",
        "port": params.port,
        "baudrate": params.baudrate,
    }))
}

/// 关闭串口
#[tauri::command]
pub async fn disconnect(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let mut s = state.lock().await;
    s.close();
    Ok(serde_json::json!({ "status": "disconnected" }))
}

/// 列举可用串口
#[tauri::command]
pub async fn search_ports() -> Result<serde_json::Value, String> {
    let ports = list_ports();
    Ok(serde_json::json!({ "ports": ports }))
}

/// 批量读取参数
#[tauri::command]
pub async fn read_params(
    state: State<'_, AppState>,
    addresses: Vec<AddressParam>,
) -> Result<serde_json::Value, String> {
    let s = state.lock().await;

    // 构建协议地址列表
    let addrs: Vec<(i32, u32, i32)> = addresses
        .iter()
        .map(|a| (a.addr_type, a.var_address, a.number_type))
        .collect();

    // 构建帧并发送
    let payload = protocol::build_read_request(&addrs);
    let frame = protocol::create_frame(0x02, protocol::CMD_READ_REQUEST, payload);

    // 发送并等待
    let resp = s.send_and_wait(&frame, Duration::from_secs(3)).await?;
    let result = protocol::parse_response_payload(&resp)?;
    Ok(result)
}

/// 批量写入参数
#[tauri::command]
pub async fn write_params(
    state: State<'_, AppState>,
    variables: Vec<WriteParam>,
) -> Result<serde_json::Value, String> {
    let s = state.lock().await;

    let vars: Vec<(i32, u32, u32, i32)> = variables
        .iter()
        .map(|v| (v.addr_type, v.var_address, v.value, v.number_type))
        .collect();

    let payload = protocol::build_write_request(&vars);
    let frame = protocol::create_frame(0x02, protocol::CMD_WRITE_REQUEST, payload);

    let resp = s.send_and_wait(&frame, Duration::from_secs(3)).await?;
    let result = protocol::parse_response_payload(&resp)?;
    Ok(result)
}

/// 配置示波器
#[tauri::command]
pub async fn config_scope(
    state: State<'_, AppState>,
    channels: Vec<ChannelParam>,
    count_every_second: u32,
) -> Result<serde_json::Value, String> {
    let s = state.lock().await;

    let chs: Vec<(u32, i32, u32, i32)> = channels
        .iter()
        .map(|c| (c.channel_number, c.addr_type, c.var_address, c.number_type))
        .collect();

    let payload = protocol::build_config_scope_request(&chs, count_every_second);
    let frame = protocol::create_frame(0x02, protocol::CMD_CONFIG_SCOPE_REQUEST, payload);

    let resp = s.send_and_wait(&frame, Duration::from_secs(3)).await?;
    let result = protocol::parse_response_payload(&resp)?;
    Ok(result)
}

/// 启动/暂停示波器
#[tauri::command]
pub async fn start_pause(
    state: State<'_, AppState>,
    operation: u32,
) -> Result<serde_json::Value, String> {
    let s = state.lock().await;

    let payload = protocol::build_start_pause_request(operation);
    let frame = protocol::create_frame(0x02, protocol::CMD_START_PAUSE_REQUEST, payload);

    let resp = s.send_and_wait(&frame, Duration::from_secs(3)).await?;
    let result = protocol::parse_response_payload(&resp)?;
    Ok(result)
}

/// 进入 Boot 模式
#[tauri::command]
pub async fn goto_boot(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let s = state.lock().await;

    let payload = protocol::build_goto_boot_request();
    let frame = protocol::create_frame(0x02, protocol::CMD_GOTO_BOOT_REQUEST, payload);

    let resp = s.send_and_wait(&frame, Duration::from_secs(3)).await?;
    let result = protocol::parse_response_payload(&resp)?;
    Ok(result)
}

/// 导入 Excel 功能码表
#[tauri::command]
pub async fn import_excel(file_path: String, device: String) -> Result<serde_json::Value, String> {
    let entries = crate::excel::import_excel(&file_path, &device)?;
    Ok(serde_json::json!({ "entries": entries }))
}
