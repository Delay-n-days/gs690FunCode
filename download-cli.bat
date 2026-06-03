@echo off
REM 从 R2 下载 cargo-tauri.exe，失败则 exit 1 让后续步骤知道需要重新编译
curl -fsSL -o cargo-tauri-windows-x64.exe "https://pub-634661256d2a40a5a022b824d51bf62d.r2.dev/tauri-cli/cargo-tauri-windows-x64.exe"
if %errorlevel% neq 0 (
    echo Download failed, will compile from source
    exit /b 1
)
echo Download succeeded, installing to cargo bin...
copy cargo-tauri-windows-x64.exe "%HOME%\.cargo\bin\cargo-tauri.exe"
del cargo-tauri-windows-x64.exe
echo cargo-tauri.exe ready
