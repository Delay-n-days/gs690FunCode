//! 串口通信模块
//! 封装串口的打开、读写、帧扫描等底层操作

use std::io::{Read, Write};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;

use crate::protocol;

/// 串口连接状态
pub struct SerialState {
    /// 串口实例（tokio 需要 Arc<Mutex> 包装）
    pub port: Option<Arc<Mutex<Box<dyn serialport::SerialPort>>>>,
    /// 当前端口名
    pub port_name: Option<String>,
    /// 当前波特率
    pub baudrate: Option<u32>,
    /// 统计信息
    pub stats: Stats,
}

/// 通信统计
pub struct Stats {
    pub tx: u64,
    pub rx: u64,
    pub err: u64,
}

impl Default for Stats {
    fn default() -> Self {
        Self { tx: 0, rx: 0, err: 0 }
    }
}

impl Default for SerialState {
    fn default() -> Self {
        Self {
            port: None,
            port_name: None,
            baudrate: None,
            stats: Stats::default(),
        }
    }
}

impl SerialState {
    /// 打开串口
    pub fn open(&mut self, port_name: &str, baudrate: u32) -> Result<(), String> {
        // 如果已连接，先关闭旧的
        if self.port.is_some() {
            self.close();
        }

        let port = serialport::new(port_name, baudrate)
            .timeout(Duration::from_millis(100))
            .open()
            .map_err(|e| format!("串口打开失败: {}", e))?;

        self.port = Some(Arc::new(Mutex::new(port)));
        self.port_name = Some(port_name.to_string());
        self.baudrate = Some(baudrate);
        self.stats = Stats::default();

        Ok(())
    }

    /// 关闭串口
    pub fn close(&mut self) {
        self.port = None;
        self.port_name = None;
        self.baudrate = None;
    }

    /// 是否已连接
    pub fn is_connected(&self) -> bool {
        self.port.is_some()
    }

    /// 获取串口引用
    fn get_port(&self) -> Result<Arc<Mutex<Box<dyn serialport::SerialPort>>>, String> {
        self.port.as_ref().cloned().ok_or("串口未连接".to_string())
    }

    /// 发送帧并等待响应
    /// 实现协议：[AA 55] [len LE 2B] [protobuf] [55 AA]
    pub async fn send_and_wait(
        &self,
        frame: &protocol::Frame,
        timeout: Duration,
    ) -> Result<protocol::Frame, String> {
        let port = self.get_port()?;

        // 序列化并发送
        let data = protocol::serialize_frame(frame);

        {
            let mut p = port.lock().await;
            p.write_all(&data)
                .map_err(|e| format!("发送失败: {}", e))?;
            p.flush().map_err(|e| format!("刷新失败: {}", e))?;
        }

        // 逐字节读取，扫描帧头 AA 55
        let start = std::time::Instant::now();
        let mut buf = Vec::with_capacity(4096);

        {
            let mut p = port.lock().await;

            while start.elapsed() < timeout {
                // 读取一个字节
                let mut byte = [0u8; 1];
                match p.read(&mut byte) {
                    Ok(0) => {
                        // 超时，继续等待
                        continue;
                    }
                    Ok(_) => {
                        buf.push(byte[0]);

                        // 检查是否找到帧头
                        if buf.len() >= 2 && buf[buf.len() - 2..] == [0xAA, 0x55] {
                            // 找到帧头，继续读取直到帧尾 55 AA
                            loop {
                                if start.elapsed() >= timeout {
                                    return Err("接收超时".to_string());
                                }

                                let mut b = [0u8; 1];
                                match p.read(&mut b) {
                                    Ok(0) => continue,
                                    Ok(_) => {
                                        buf.push(b[0]);
                                        // 检查帧尾
                                        if buf.len() >= 4
                                            && buf[buf.len() - 2..] == [0x55, 0xAA]
                                        {
                                            // 找到完整帧，解析
                                            let response =
                                                protocol::deserialize_frame(&buf)
                                                    .map_err(|e| format!("解析响应失败: {}", e))?;
                                            return Ok(response);
                                        }
                                    }
                                    Err(e) => {
                                        return Err(format!("读取失败: {}", e));
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        return Err(format!("读取失败: {}", e));
                    }
                }
            }
        }

        Err("接收超时".to_string())
    }
}

/// 列举系统串口
pub fn list_ports() -> Vec<serde_json::Value> {
    serialport::available_ports()
        .map(|ports| {
            ports
                .iter()
                .map(|p| {
                    serde_json::json!({
                        "device": p.port_name,
                        "description": p.port_name.clone(),
                        "hwid": format!("{:?}", p.port_type),
                    })
                })
                .collect()
        })
        .unwrap_or_default()
}
