//! GS690 功能码调试终端 - Tauri 主入口

mod commands;
mod excel;
mod protocol;
mod serial;

use commands::AppState;

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::get_status,
            commands::connect,
            commands::disconnect,
            commands::search_ports,
            commands::read_params,
            commands::write_params,
            commands::config_scope,
            commands::start_pause,
            commands::goto_boot,
            commands::import_excel,
        ])
        .run(tauri::generate_context!())
        .expect("启动 Tauri 应用失败");
}
