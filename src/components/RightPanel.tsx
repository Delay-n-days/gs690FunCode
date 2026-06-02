/**
 * RightPanel 组件 — 右侧抽屉面板
 * 包含通信日志、批量操作、设置三个标签页
 */

'use client';

import { useState } from 'react';
import { useUIStore, useLogStore, useConnectionStore, useReadWriteStore, useFuncodeStore } from '@/store';
import { useTheme } from '@/hooks/useTheme';
import { parseOptions } from '@/lib/utils';

export default function RightPanel() {
  const visible = useUIStore(s => s.rightPanelVisible);
  const rightTab = useUIStore(s => s.rightTab);
  const setRightTab = useUIStore(s => s.setRightTab);
  const toggleRightPanel = useUIStore(s => s.toggleRightPanel);

  return (
    <>
      {/* 遮罩层 */}
      {visible && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={toggleRightPanel}
        />
      )}

      {/* 抽屉面板 */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: 360,
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
        }}
      >
        {/* 标签栏 */}
        <div
          className="flex border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}
        >
          <TabButton
            active={rightTab === 'log'}
            onClick={() => setRightTab('log')}
            label="通信日志"
          />
          <TabButton
            active={rightTab === 'batch'}
            onClick={() => setRightTab('batch')}
            label="批量操作"
          />
          <TabButton
            active={rightTab === 'settings'}
            onClick={() => setRightTab('settings')}
            label="设置"
          />
          <div className="flex-1" />
          <button
            className="btn btn-ghost px-2 py-1 my-1"
            onClick={toggleRightPanel}
          >
            ✕
          </button>
        </div>

        {/* 标签内容 */}
        {rightTab === 'log' && <LogPanel />}
        {rightTab === 'batch' && <BatchPanel />}
        {rightTab === 'settings' && <SettingsPanel />}
      </div>
    </>
  );
}

/** 标签按钮 */
function TabButton({ active, onClick, label }: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className={`tab-btn ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/** 通信日志面板 */
function LogPanel() {
  const logs = useLogStore(s => s.logs);
  const autoScroll = useLogStore(s => s.autoScroll);
  const setAutoScroll = useLogStore(s => s.setAutoScroll);
  const clearLogs = useLogStore(s => s.clearLogs);
  const copyLogs = useLogStore(s => s.copyLogs);
  const exportLogs = useLogStore(s => s.exportLogs);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 工具栏 */}
      <div
        className="px-2.5 py-1.5 flex gap-1.5 items-center border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}
      >
        <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
          {logs.length}/500
        </span>
        <div className="flex-1" />

        <label className="flex items-center gap-1 font-mono text-[10px] cursor-pointer" style={{ color: 'var(--text-sec)' }}>
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={e => setAutoScroll(e.target.checked)}
            style={{ accentColor: 'var(--amber)' }}
          />
          AUTO
        </label>

        <button className="btn btn-ghost px-2 py-0.5 text-[9px]" onClick={copyLogs}>复制</button>
        <button className="btn btn-ghost px-2 py-0.5 text-[9px]" onClick={exportLogs}>导出</button>
        <button className="btn btn-ghost px-2 py-0.5 text-[9px]" onClick={clearLogs}>清空</button>
      </div>

      {/* 日志列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {logs.map((entry, i) => (
          <div key={i} className="log-entry">
            <span className="log-ts">{entry.ts}</span>
            <span className={`log-${entry.type}`}>{entry.msg}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-8 font-mono text-[11px]" style={{ color: 'var(--text-dim)' }}>
            — NO LOG ENTRIES —
          </div>
        )}
      </div>
    </div>
  );
}

/** 批量操作面板 */
function BatchPanel() {
  const [batchText, setBatchText] = useState('');
  const [sampleRate, setSampleRate] = useState('100');
  const connected = useConnectionStore(s => s.connected);
  const busy = useConnectionStore(s => s.busy);
  const selectedRows = useFuncodeStore(s => s.selectedRows);
  const readSelected = useReadWriteStore(s => s.readSelected);
  const readAll = useReadWriteStore(s => s.readAll);
  const batchWrite = useReadWriteStore(s => s.batchWrite);

  /** 导出当前值为 CSV */
  const exportValues = async () => {
    const funcodes = useFuncodeStore.getState().funcodes;
    const { getDisplayValue } = await import('@/lib/utils');
    const rows = funcodes.filter((fc: { _value: number | null }) => fc._value !== null);
    const csv = ['功能码,地址,注释,当前值,单位', ...rows.map((fc: { function_code: string; address_str: string; comment: string; unit: string }) =>
      `${fc.function_code},${fc.address_str},${fc.comment},${getDisplayValue(fc)},${fc.unit}`
    )].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    a.download = `GS690_values_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
      {/* 批量读取 */}
      <div className="panel">
        <div className="panel-title">◈ 批量读取</div>
        <div className="p-2.5 flex gap-2 items-center flex-wrap">
          <span className="font-mono text-[11px]" style={{ color: 'var(--text-sec)' }}>
            已选 {selectedRows.size} 个功能码
          </span>
          <button
            className="btn btn-amber"
            disabled={!connected || selectedRows.size === 0 || busy}
            onClick={readSelected}
          >
            ▼ 读取选中
          </button>
          <button
            className="btn btn-cyan"
            disabled={!connected || busy}
            onClick={readAll}
          >
            ⟳ 读取全部
          </button>
          <button className="btn btn-ghost" onClick={exportValues}>⬇ 导出当前值</button>
        </div>
      </div>

      {/* 批量写入 */}
      <div className="panel">
        <div className="panel-title">◈ 批量写入</div>
        <div className="p-2.5">
          <div className="font-mono text-[10px] mb-2" style={{ color: 'var(--text-dim)' }}>
            格式: 功能码,值 (每行一条，如 A0.00,100)
          </div>
          <textarea
            className="fc-input w-full h-[120px] resize-y leading-relaxed"
            value={batchText}
            onChange={e => setBatchText(e.target.value)}
            placeholder={`A0.00,0\nA0.01,1\nC0.01,3`}
          />
          <div className="mt-2 flex gap-1.5">
            <button
              className="btn btn-green"
              disabled={!connected || busy}
              onClick={() => batchWrite(batchText)}
            >
              ▲ 执行批量写入
            </button>
            <button className="btn btn-ghost" onClick={() => setBatchText('')}>清空</button>
          </div>
        </div>
      </div>

      {/* 示波器配置 */}
      <div className="panel">
        <div className="panel-title">◈ 示波器配置</div>
        <div className="p-2.5 font-mono text-[11px] leading-8" style={{ color: 'var(--text-sec)' }}>
          <div className="flex gap-2.5 items-center flex-wrap mb-2">
            <span>采样率:</span>
            <input
              className="fc-input"
              style={{ width: 80 }}
              value={sampleRate}
              onChange={e => setSampleRate(e.target.value)}
              placeholder="100"
            />
            <span>pts/s</span>
            <span className="ml-2.5">通道数:</span>
            <span style={{ color: 'var(--amber)' }}>{selectedRows.size}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 设置面板 */
function SettingsPanel() {
  const theme = useTheme();

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
      {/* 外观设置 */}
      <div className="panel">
        <div className="panel-title">◈ 外观设置</div>
        <div className="p-3">
          {/* 主题 */}
          <SettingRow label="主题">
            <button className="btn btn-ghost px-3 py-1" onClick={theme.toggleTheme}>
              {theme.themeIcon === '☀' ? '深色主题' : '亮色主题'}
            </button>
          </SettingRow>

          {/* 字体 */}
          <SettingRow label="字体">
            <button className="btn btn-ghost px-3 py-1" onClick={theme.toggleFont}>
              {theme.fontLabel}
            </button>
          </SettingRow>

          {/* CRT 扫描线 */}
          <SettingRow label="CRT扫描线">
            <button className="btn btn-ghost px-3 py-1" onClick={theme.toggleScanline}>
              {theme.scanlineOn ? '开启' : '关闭'}
            </button>
          </SettingRow>
        </div>
      </div>

      {/* 关于 */}
      <div className="panel">
        <div className="panel-title">◈ 关于</div>
        <div className="p-3 text-[11px] leading-7" style={{ color: 'var(--text-sec)' }}>
          <div>GS690 功能码调试终端</div>
          <div style={{ color: 'var(--text-dim)' }}>版本: v3.0.0 (Next.js)</div>
        </div>
      </div>
    </div>
  );
}

/** 设置行 */
function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3 last:mb-0">
      <span className="text-xs" style={{ color: 'var(--text-pri)' }}>{label}</span>
      {children}
    </div>
  );
}
