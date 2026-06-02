/**
 * ConnectDialog 组件 — 串口连接对话框
 * 选择串口号和波特率，连接/断开串口
 */

'use client';

import { useEffect } from 'react';
import { useUIStore, useConnectionStore } from '@/store';

export default function ConnectDialog() {
  const visible = useUIStore(s => s.dialogVisible);
  const setDialogVisible = useUIStore(s => s.setDialogVisible);
  const ports = useConnectionStore(s => s.ports);
  const selectedPort = useConnectionStore(s => s.selectedPort);
  const selectedBaudrate = useConnectionStore(s => s.selectedBaudrate);
  const searching = useConnectionStore(s => s.searching);
  const connecting = useConnectionStore(s => s.connecting);
  const searchPorts = useConnectionStore(s => s.searchPorts);
  const connect = useConnectionStore(s => s.connect);

  // 打开对话框时自动搜索串口
  useEffect(() => {
    if (visible) searchPorts();
  }, [visible, searchPorts]);

  if (!visible) return null;

  const handleConnect = async () => {
    if (!selectedPort) return;
    try {
      await connect(selectedPort, selectedBaudrate);
      setDialogVisible(false);
    } catch {
      // 错误已在 store 中处理
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={() => setDialogVisible(false)}
    >
      <div
        className="w-[380px] max-h-[80vh] overflow-hidden rounded-lg"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div
          className="px-4 py-3 flex items-center justify-between border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="font-mono text-xs" style={{ color: 'var(--amber)' }}>
            串口连接配置
          </span>
          <button
            className="text-base cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)' }}
            onClick={() => setDialogVisible(false)}
          >
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4">
          {/* 串口号选择 */}
          <div className="mb-3">
            <label
              className="block font-mono text-[10px] mb-1"
              style={{ color: 'var(--text-dim)' }}
            >
              COM 口
            </label>
            <div className="flex gap-2">
              <select
                className="filter-input flex-1 min-w-0"
                value={selectedPort}
                onChange={e => {
                  // 更新 store 中的 selectedPort
                  useConnectionStore.setState({ selectedPort: e.target.value });
                }}
              >
                {ports.map(p => (
                  <option key={p.device} value={p.device}>
                    {p.device} - {p.description}
                  </option>
                ))}
                {ports.length === 0 && (
                  <option value="">未找到串口</option>
                )}
              </select>

              <button
                className="btn btn-cyan px-2.5 py-1 text-[10px] whitespace-nowrap flex-shrink-0"
                disabled={searching}
                onClick={() => searchPorts()}
              >
                {searching ? '搜索中...' : '🔍 搜索'}
              </button>
            </div>
          </div>

          {/* 波特率选择 */}
          <div className="mb-4">
            <label
              className="block font-mono text-[10px] mb-1"
              style={{ color: 'var(--text-dim)' }}
            >
              波特率
            </label>
            <select
              className="filter-input w-full"
              value={selectedBaudrate}
              onChange={e => {
                useConnectionStore.setState({ selectedBaudrate: Number(e.target.value) });
              }}
            >
              {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map(rate => (
                <option key={rate} value={rate}>{rate}</option>
              ))}
            </select>
          </div>

          {/* 按钮 */}
          <div className="flex gap-2 justify-end">
            <button
              className="btn btn-ghost px-4 py-1.5"
              onClick={() => setDialogVisible(false)}
            >
              取消
            </button>
            <button
              className="btn btn-amber px-4 py-1.5"
              disabled={!selectedPort || connecting}
              onClick={handleConnect}
            >
              {connecting ? '连接中...' : '连接'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
