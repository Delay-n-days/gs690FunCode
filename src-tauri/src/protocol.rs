//! GS690 功能码调试终端 - Protocol Buffers 模块
//! 自动生成的 protobuf 代码封装 + 帧序列化/反序列化

/// 包含 protoc 自动生成的 protobuf 代码
pub mod pb {
    include!(concat!(env!("OUT_DIR"), "/gs690_protocol.rs"));
}

use pb::*;
pub use pb::Frame;
use prost::Message;

/// 帧头标记 [0xAA, 0x55]
const FRAME_HEADER: [u8; 2] = [0xAA, 0x55];
/// 帧尾标记 [0x55, 0xAA]
const FRAME_TAIL: [u8; 2] = [0x55, 0xAA];

/// 协议常量：寻址类型
#[allow(dead_code)]
pub const ADDR_TYPE_NAMES: &[(i32, &str)] = &[
    (0, "DSP 功能码"),
    (1, "DSP 内存"),
    (2, "PG 功能码"),
    (3, "PG 内存"),
    (4, "COMM 功能码"),
    (5, "COMM 内存"),
];

/// 协议常量：数值类型
#[allow(dead_code)]
pub const NUMBER_TYPE_NAMES: &[(i32, &str)] = &[
    (0, "16位"),
    (1, "32位"),
    (2, "8位"),
];

/// 协议常量：状态码
#[allow(dead_code)]
pub const STATUS_NAMES: &[(i32, &str)] = &[
    (0, "成功"),
    (1, "失败"),
    (2, "超时"),
    (3, "地址无效"),
    (4, "值无效"),
    (5, "权限不足"),
    (6, "设备忙"),
    (255, "未知错误"),
];

/// 协议命令码
#[allow(dead_code)]
pub const CMD_READ_REQUEST: u32 = 0x0100;
#[allow(dead_code)]
pub const CMD_READ_RESPONSE: u32 = 0x8100;
pub const CMD_WRITE_REQUEST: u32 = 0x0101;
#[allow(dead_code)]
pub const CMD_WRITE_RESPONSE: u32 = 0x8101;
pub const CMD_CONFIG_SCOPE_REQUEST: u32 = 0x0200;
#[allow(dead_code)]
pub const CMD_CONFIG_SCOPE_RESPONSE: u32 = 0x8200;
pub const CMD_START_PAUSE_REQUEST: u32 = 0x0201;
#[allow(dead_code)]
pub const CMD_START_PAUSE_RESPONSE: u32 = 0x8201;
#[allow(dead_code)]
pub const CMD_DATA_TRANSFER: u32 = 0x8202;
pub const CMD_GOTO_BOOT_REQUEST: u32 = 0x0300;
#[allow(dead_code)]
pub const CMD_GOTO_BOOT_RESPONSE: u32 = 0x8300;

/// 根据命令码获取命令名称
#[allow(dead_code)]
pub fn get_command_name(cmd: u32) -> &'static str {
    match cmd {
        0x0100 => "读请求",
        0x8100 => "读响应",
        0x0101 => "写请求",
        0x8101 => "写响应",
        0x0200 => "配置示波器请求",
        0x8200 => "配置示波器响应",
        0x0201 => "启动/暂停请求",
        0x8201 => "启动/暂停响应",
        0x8202 => "数据传输",
        0x0300 => "进入Boot请求",
        0x8300 => "进入Boot响应",
        _ => "未知命令",
    }
}

/// 创建帧
pub fn create_frame(version: u32, command: u32, payload: FramePayload) -> Frame {
    Frame {
        version,
        command,
        payload: Some(payload),
    }
}

/// 序列化帧为字节：[AA 55] [len LE 2B] [protobuf data] [55 AA]
pub fn serialize_frame(frame: &Frame) -> Vec<u8> {
    let data = frame.encode_to_vec();
    let len = data.len() as u16;

    let mut buf = Vec::with_capacity(2 + 2 + data.len() + 2);
    buf.extend_from_slice(&FRAME_HEADER);
    buf.extend_from_slice(&len.to_le_bytes());
    buf.extend_from_slice(&data);
    buf.extend_from_slice(&FRAME_TAIL);
    buf
}

/// 从字节反序列化帧（去掉头尾标记后解析 protobuf）
pub fn deserialize_frame(data: &[u8]) -> Result<Frame, String> {
    // 找到帧头
    let start = data
        .windows(2)
        .position(|w| w == FRAME_HEADER)
        .ok_or("帧头未找到")?;

    // 从帧头后读取长度
    if data.len() < start + 4 {
        return Err("数据长度不足".to_string());
    }
    let len = u16::from_le_bytes([data[start + 2], data[start + 3]]) as usize;

    // 提取 protobuf 数据
    let proto_start = start + 4;
    if data.len() < proto_start + len + 2 {
        return Err(format!(
            "数据不完整: 需要 {} 字节，实际 {}",
            proto_start + len + 2,
            data.len()
        ));
    }
    let proto_data = &data[proto_start..proto_start + len];

    // 验证帧尾
    let tail = &data[proto_start + len..proto_start + len + 2];
    if tail != FRAME_TAIL {
        return Err("帧尾校验失败".to_string());
    }

    Frame::decode(proto_data).map_err(|e| format!("protobuf 解码失败: {}", e))
}

/// 构建读请求
pub fn build_read_request(addresses: &[(i32, u32, i32)]) -> FramePayload {
    let addrs: Vec<VariableAddress> = addresses
        .iter()
        .map(|(addr_type, var_address, number_type)| VariableAddress {
            addr_type: *addr_type,
            var_address: *var_address,
            number_type: *number_type,
        })
        .collect();

    FramePayload {
        payload: Some(frame_payload::Payload::ReadRequest(ReadRequest {
            addresses: addrs,
        })),
    }
}

/// 构建写请求
pub fn build_write_request(variables: &[(i32, u32, u32, i32)]) -> FramePayload {
    let vars: Vec<WriteVariable> = variables
        .iter()
        .map(|(addr_type, var_address, value, number_type)| WriteVariable {
            addr_type: *addr_type,
            var_address: *var_address,
            value: *value,
            number_type: *number_type,
        })
        .collect();

    FramePayload {
        payload: Some(frame_payload::Payload::WriteRequest(WriteRequest {
            variables: vars,
        })),
    }
}

/// 构建配置示波器请求
pub fn build_config_scope_request(
    channels: &[(u32, i32, u32, i32)],
    count_every_second: u32,
) -> FramePayload {
    let chs: Vec<ChannelAddress> = channels
        .iter()
        .map(
            |(channel_number, addr_type, var_address, number_type)| ChannelAddress {
                channel_number: *channel_number,
                addr_type: *addr_type,
                number_type: *number_type,
                var_address: *var_address,
            },
        )
        .collect();

    let len = chs.len() as u32;
    FramePayload {
        payload: Some(frame_payload::Payload::ConfigScopeRequest(
            ConfigScopeRequest {
                channels: chs,
                len,
                count_every_secound: count_every_second,
            },
        )),
    }
}

/// 构建启动/暂停请求
pub fn build_start_pause_request(operation: u32) -> FramePayload {
    FramePayload {
        payload: Some(frame_payload::Payload::StartPauseRequest(
            StartPauseRequest { operation },
        )),
    }
}

/// 构建进入 Boot 请求
pub fn build_goto_boot_request() -> FramePayload {
    FramePayload {
        payload: Some(frame_payload::Payload::GotoBootRequest(GotoBootRequest {
            reserved: 1,
        })),
    }
}

/// 解析响应 payload 为 serde_json::Value
pub fn parse_response_payload(frame: &Frame) -> Result<serde_json::Value, String> {
    let payload = frame.payload.as_ref().ok_or("帧无 payload")?;

    match &payload.payload {
        Some(frame_payload::Payload::ReadResponse(resp)) => {
            let values: Vec<serde_json::Value> = resp
                .values
                .iter()
                .map(|v| {
                    serde_json::json!({
                        "status": v.status,
                        "addr_type": v.addr_type,
                        "var_address": v.var_address,
                        "value": v.value,
                        "number_type": v.number_type,
                    })
                })
                .collect();
            Ok(serde_json::json!({ "values": values }))
        }
        Some(frame_payload::Payload::WriteResponse(resp)) => {
            let statuses: Vec<serde_json::Value> = resp
                .statuses
                .iter()
                .map(|s| {
                    serde_json::json!({
                        "addr_type": s.addr_type,
                        "var_address": s.var_address,
                        "status": s.status,
                        "current_value": s.current_value,
                        "number_type": s.number_type,
                    })
                })
                .collect();
            Ok(serde_json::json!({ "statuses": statuses }))
        }
        Some(frame_payload::Payload::ConfigScopeResponse(resp)) => {
            Ok(serde_json::json!({
                "status": resp.status,
                "error_code": resp.error_code,
                "count_every_secound": resp.count_every_secound,
            }))
        }
        Some(frame_payload::Payload::StartPauseResponse(resp)) => {
            Ok(serde_json::json!({
                "status": resp.status,
                "current_state": resp.current_state,
            }))
        }
        Some(frame_payload::Payload::GotoBootResponse(resp)) => {
            Ok(serde_json::json!({ "status": resp.status }))
        }
        _ => Err("未知响应类型".to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========== 帧序列化/反序列化测试 ==========

    #[test]
    fn test_serialize_deserialize_roundtrip() {
        // 构建一个读请求帧
        let payload = build_read_request(&[(0, 100, 0)]);
        let frame = create_frame(0x02, CMD_READ_REQUEST, payload);
        
        // 序列化
        let bytes = serialize_frame(&frame);
        
        // 验证帧头帧尾
        assert_eq!(bytes[0..2], [0xAA, 0x55], "帧头错误");
        assert_eq!(bytes[bytes.len()-2..], [0x55, 0xAA], "帧尾错误");
        
        // 验证长度字段（little-endian）
        let len = u16::from_le_bytes([bytes[2], bytes[3]]);
        assert_eq!(len as usize, bytes.len() - 6, "长度字段不匹配");
        
        // 反序列化
        let parsed = deserialize_frame(&bytes).unwrap();
        assert_eq!(parsed.version, 0x02);
        assert_eq!(parsed.command, CMD_READ_REQUEST);
    }

    #[test]
    fn test_serialize_frame_structure() {
        let payload = build_read_request(&[]);
        let frame = create_frame(1, 0x0100, payload);
        let bytes = serialize_frame(&frame);
        
        // 最小帧 = 2(header) + 2(len) + 0(protobuf) + 2(tail) = 6
        // 但 protobuf 空消息也有编码，所以 > 6
        assert!(bytes.len() >= 6, "帧太短");
        assert_eq!(&bytes[0..2], &[0xAA, 0x55]);
        assert_eq!(&bytes[bytes.len()-2..], &[0x55, 0xAA]);
    }

    #[test]
    fn test_deserialize_invalid_header() {
        let data = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        let result = deserialize_frame(&data);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("帧头未找到"));
    }

    #[test]
    fn test_deserialize_too_short() {
        let data = [0xAA, 0x55]; // 只有帧头
        let result = deserialize_frame(&data);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("数据长度不足"));
    }

    #[test]
    fn test_deserialize_invalid_tail() {
        // 构造一个帧头正确但帧尾错误的数据
        let payload = build_read_request(&[(0, 100, 0)]);
        let frame = create_frame(0x02, CMD_READ_REQUEST, payload);
        let mut bytes = serialize_frame(&frame);
        // 篡改帧尾
        let len = bytes.len();
        bytes[len - 1] = 0xFF;
        
        let result = deserialize_frame(&bytes);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("帧尾校验失败"));
    }

    #[test]
    fn test_deserialize_with_garbage_before_header() {
        // 帧头前有垃圾数据
        let payload = build_read_request(&[(0, 42, 1)]);
        let frame = create_frame(0x02, CMD_READ_REQUEST, payload);
        let mut bytes = serialize_frame(&frame);
        
        // 前面加垃圾
        let mut data = vec![0xDE, 0xAD, 0xBE, 0xEF];
        data.append(&mut bytes);
        
        let parsed = deserialize_frame(&data).unwrap();
        assert_eq!(parsed.version, 0x02);
        assert_eq!(parsed.command, CMD_READ_REQUEST);
    }

    // ========== 请求构建测试 ==========

    #[test]
    fn test_build_read_request() {
        let payload = build_read_request(&[
            (0, 100, 0),
            (1, 200, 1),
        ]);
        
        match &payload.payload {
            Some(frame_payload::Payload::ReadRequest(req)) => {
                assert_eq!(req.addresses.len(), 2);
                assert_eq!(req.addresses[0].addr_type, 0);
                assert_eq!(req.addresses[0].var_address, 100);
                assert_eq!(req.addresses[0].number_type, 0);
                assert_eq!(req.addresses[1].addr_type, 1);
                assert_eq!(req.addresses[1].var_address, 200);
                assert_eq!(req.addresses[1].number_type, 1);
            }
            _ => panic!("不是 ReadRequest"),
        }
    }

    #[test]
    fn test_build_write_request() {
        let payload = build_write_request(&[
            (0, 100, 9999, 0),
        ]);
        
        match &payload.payload {
            Some(frame_payload::Payload::WriteRequest(req)) => {
                assert_eq!(req.variables.len(), 1);
                assert_eq!(req.variables[0].addr_type, 0);
                assert_eq!(req.variables[0].var_address, 100);
                assert_eq!(req.variables[0].value, 9999);
                assert_eq!(req.variables[0].number_type, 0);
            }
            _ => panic!("不是 WriteRequest"),
        }
    }

    #[test]
    fn test_build_config_scope_request() {
        let payload = build_config_scope_request(&[
            (1, 0, 100, 0),
            (2, 1, 200, 1),
        ], 1000);
        
        match &payload.payload {
            Some(frame_payload::Payload::ConfigScopeRequest(req)) => {
                assert_eq!(req.channels.len(), 2);
                assert_eq!(req.len, 2);
                assert_eq!(req.count_every_secound, 1000);
                assert_eq!(req.channels[0].channel_number, 1);
                assert_eq!(req.channels[0].var_address, 100);
            }
            _ => panic!("不是 ConfigScopeRequest"),
        }
    }

    #[test]
    fn test_build_start_pause_request() {
        let payload = build_start_pause_request(1);
        match &payload.payload {
            Some(frame_payload::Payload::StartPauseRequest(req)) => {
                assert_eq!(req.operation, 1);
            }
            _ => panic!("不是 StartPauseRequest"),
        }
    }

    #[test]
    fn test_build_goto_boot_request() {
        let payload = build_goto_boot_request();
        match &payload.payload {
            Some(frame_payload::Payload::GotoBootRequest(req)) => {
                assert_eq!(req.reserved, 1);
            }
            _ => panic!("不是 GotoBootRequest"),
        }
    }

    // ========== 响应解析测试 ==========

    #[test]
    fn test_parse_read_response() {
        let resp_frame = Frame {
            version: 0x02,
            command: CMD_READ_RESPONSE,
            payload: Some(FramePayload {
                payload: Some(frame_payload::Payload::ReadResponse(ReadResponse {
                    values: vec![
                        VariableValue {
                            status: 0,
                            addr_type: 0,
                            var_address: 100,
                            value: 42,
                            number_type: 0,
                        },
                    ],
                })),
            }),
        };
        
        let result = parse_response_payload(&resp_frame).unwrap();
        let values = result["values"].as_array().unwrap();
        assert_eq!(values.len(), 1);
        assert_eq!(values[0]["status"], 0);
        assert_eq!(values[0]["value"], 42);
        assert_eq!(values[0]["var_address"], 100);
    }

    #[test]
    fn test_parse_write_response() {
        let resp_frame = Frame {
            version: 0x02,
            command: CMD_WRITE_RESPONSE,
            payload: Some(FramePayload {
                payload: Some(frame_payload::Payload::WriteResponse(WriteResponse {
                    statuses: vec![
                        WriteStatus {
                            addr_type: 0,
                            var_address: 100,
                            status: 0,
                            current_value: 50,
                            number_type: 0,
                        },
                    ],
                })),
            }),
        };
        
        let result = parse_response_payload(&resp_frame).unwrap();
        let statuses = result["statuses"].as_array().unwrap();
        assert_eq!(statuses.len(), 1);
        assert_eq!(statuses[0]["status"], 0);
        assert_eq!(statuses[0]["current_value"], 50);
    }

    #[test]
    fn test_parse_empty_payload() {
        let resp_frame = Frame {
            version: 0x02,
            command: 0x0100,
            payload: None,
        };
        
        let result = parse_response_payload(&resp_frame);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("帧无 payload"));
    }

    // ========== 完整流程测试 ==========

    #[test]
    fn test_full_roundtrip_read() {
        // 构建读请求 → 序列化 → 反序列化 → 验证
        let payload = build_read_request(&[(0, 50, 0), (2, 100, 1)]);
        let frame = create_frame(0x02, CMD_READ_REQUEST, payload);
        let bytes = serialize_frame(&frame);
        let parsed = deserialize_frame(&bytes).unwrap();
        
        assert_eq!(parsed.version, 0x02);
        assert_eq!(parsed.command, CMD_READ_REQUEST);
        
        // 验证数据完整性
        match &parsed.payload.as_ref().unwrap().payload {
            Some(frame_payload::Payload::ReadRequest(req)) => {
                assert_eq!(req.addresses.len(), 2);
                assert_eq!(req.addresses[0].var_address, 50);
                assert_eq!(req.addresses[1].var_address, 100);
            }
            _ => panic!("数据损坏"),
        }
    }

    #[test]
    fn test_full_roundtrip_write() {
        let payload = build_write_request(&[(0, 200, 12345, 0)]);
        let frame = create_frame(0x02, CMD_WRITE_REQUEST, payload);
        let bytes = serialize_frame(&frame);
        let parsed = deserialize_frame(&bytes).unwrap();
        
        assert_eq!(parsed.command, CMD_WRITE_REQUEST);
    }

    // ========== 常量测试 ==========

    #[test]
    fn test_command_names() {
        assert_eq!(get_command_name(0x0100), "读请求");
        assert_eq!(get_command_name(0x8100), "读响应");
        assert_eq!(get_command_name(0x0101), "写请求");
        assert_eq!(get_command_name(0x8101), "写响应");
        assert_eq!(get_command_name(0x0200), "配置示波器请求");
        assert_eq!(get_command_name(0x0300), "进入Boot请求");
        assert_eq!(get_command_name(0xFFFF), "未知命令");
    }

    #[test]
    fn test_frame_header_tail_constants() {
        assert_eq!(FRAME_HEADER, [0xAA, 0x55]);
        assert_eq!(FRAME_TAIL, [0x55, 0xAA]);
    }
}
