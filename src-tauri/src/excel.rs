//! Excel 功能码表导入模块
//! 使用 calamine 读取 Excel，解析功能码数据

use calamine::{open_workbook_auto, Reader};
use serde::Serialize;

/// 从 Excel 导入的功能码条目
#[derive(Serialize, Clone, Debug)]
#[allow(non_snake_case)]
pub struct FuncCodeEntry {
    pub device: String,
    pub group: String,
    pub address_str: String,
    pub function_code: String,
    pub comment: String,
    pub variable_name: String,
    pub function_code_option: String,
    pub factory_value: String,
    pub ParamValue: String,
    pub upper_limit: String,
    pub lower_limit: String,
    pub upper_association: String,
    pub lower_association: String,
    pub wr_attribute: String,
    pub factor: String,
    pub unit: String,
    pub display_format_u16: String,
    pub data_width: String,
    pub whether_signed: String,
}

/// 读取 Excel 文件并解析为功能码列表
pub fn import_excel(file_path: &str, device_name: &str) -> Result<Vec<FuncCodeEntry>, String> {
    let mut workbook = open_workbook_auto(file_path)
        .map_err(|e| format!("无法打开 Excel 文件: {}", e))?;

    let sheet_name = workbook
        .sheet_names()
        .first()
        .cloned()
        .ok_or("Excel 文件中没有工作表".to_string())?;

    let range = workbook
        .worksheet_range(&sheet_name)
        .map_err(|e| format!("读取工作表失败: {}", e))?;

    let mut entries = Vec::new();

    for (row_idx, row) in range.rows().enumerate() {
        // 跳过第一行（表头）
        if row_idx == 0 {
            continue;
        }

        // 至少要有 7 列（group, address, funcode, comment, variable_name, option, factory_value）
        if row.len() < 7 {
            continue;
        }

        let get_str = |idx: usize| -> String {
            row.get(idx)
                .map(|cell| match cell {
                    calamine::Data::String(s) => s.clone(),
                    calamine::Data::Float(f) => {
                        if *f == (*f as i64) as f64 {
                            format!("{}", *f as i64)
                        } else {
                            format!("{}", f)
                        }
                    }
                    calamine::Data::Int(i) => format!("{}", i),
                    calamine::Data::Bool(b) => format!("{}", b),
                    _ => String::new(),
                })
                .unwrap_or_default()
        };

        // 去除空白
        let group = get_str(0).trim().to_string();
        let address_str = get_str(1).trim().to_string();
        let function_code = get_str(2).trim().to_string();
        let comment = get_str(3).trim().to_string();
        let variable_name = get_str(4).trim().to_string();
        let function_code_option = get_str(5).trim().to_string();
        let factory_value = get_str(6).trim().to_string();

        // 跳过空白行
        if group.is_empty() && function_code.is_empty() {
            continue;
        }

        let factor = if row.len() > 12 { get_str(12).trim().to_string() } else { "1".to_string() };
        let unit = if row.len() > 13 { get_str(13).trim().to_string() } else { "X".to_string() };
        let display_format_u16 = if row.len() > 14 { get_str(14).trim().to_string() } else { "0".to_string() };
        let data_width = if row.len() > 15 { get_str(15).trim().to_string() } else { "2".to_string() };
        let whether_signed = if row.len() > 16 { get_str(16).trim().to_string() } else { "0".to_string() };

        entries.push(FuncCodeEntry {
            device: device_name.to_string(),
            group,
            address_str,
            function_code,
            comment,
            variable_name,
            function_code_option,
            factory_value,
            ParamValue: String::new(),
            upper_limit: if row.len() > 7 { get_str(7) } else { String::new() },
            lower_limit: if row.len() > 8 { get_str(8) } else { String::new() },
            upper_association: if row.len() > 9 { get_str(9) } else { String::new() },
            lower_association: if row.len() > 10 { get_str(10) } else { String::new() },
            wr_attribute: if row.len() > 11 { get_str(11) } else { String::new() },
            factor,
            unit,
            display_format_u16,
            data_width,
            whether_signed,
        });
    }

    Ok(entries)
}
