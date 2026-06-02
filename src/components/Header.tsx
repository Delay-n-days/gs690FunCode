/**
 * Header 组件 — 标题栏
 * 显示应用标题、连接状态、导入按钮、主题切换等
 */

'use client';

import { useRef } from 'react';
import { useConnectionStore, useFuncodeStore, useUIStore } from '@/store';
import { importExcel } from '@/lib/api';
import { toast } from 'sonner';

interface HeaderProps {
  theme: {
    themeIcon: string;
    fontLabel: string;
    toggleTheme: () => void;
    toggleFont: () => void;
    toggleScanline: () => void;
    scanlineOn: boolean;
  };
}

export default function Header({ theme }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const connected = useConnectionStore(s => s.connected);
  const toggleRightPanel = useUIStore(s => s.toggleRightPanel);
  const toggleMonitorPanel = useUIStore(s => s.toggleMonitorPanel);
  const monitorPanelVisible = useUIStore(s => s.monitorPanelVisible);
  const rightPanelVisible = useUIStore(s => s.rightPanelVisible);
  const setDialogVisible = useUIStore(s => s.setDialogVisible);
  const disconnect = useConnectionStore(s => s.disconnect);

  /** 处理连接/断开按钮点击 */
  const handleConnectToggle = async () => {
    if (connected) {
      await disconnect();
    } else {
      setDialogVisible(true);
    }
  };

  /** 处理文件导入 */
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let data: Array<Record<string, unknown>>;
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        const text = await file.text();
        data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('JSON格式错误：应为功能码数组');
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        data = await importExcel(file);
      } else {
        throw new Error('不支持的文件格式，请使用 .json 或 .xlsx 文件');
      }

      // 验证数据结构
      const requiredFields = ['function_code', 'address_str', 'group'];
      const isValid = data.every(item =>
        requiredFields.every(field => field in item)
      );
      if (!isValid) throw new Error('数据缺少必要字段 (function_code, address_str, group)');

      useFuncodeStore.getState().replaceFuncodes(data as never[]);
      toast.success(`已导入 ${data.length} 个功能码`);
    } catch (err: unknown) {
      toast.error(`导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }

    // 清空 input 以便重复选择同一文件
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="header-bar px-4 flex items-center gap-4 h-11 flex-shrink-0">
      {/* 应用标题 */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-[3px] h-7"
          style={{ background: 'var(--amber)', boxShadow: '0 0 8px var(--amber)' }}
        />
        <div>
          <div
            className="font-mono text-[13px] tracking-[0.15em] leading-none"
            style={{ color: 'var(--amber)' }}
          >
            GS690 · PARAM TERMINAL
          </div>
          <div
            className="text-[9px] tracking-[0.1em] mt-0.5"
            style={{ color: 'var(--text-dim)' }}
          >
            功能码读写调试终端 v3.0
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* 连接状态指示 */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-1.5">
          <span className={`status-led ${connected ? 'led-green pulse-amber' : 'led-dim'}`} />
          <span
            className="font-mono text-[10px]"
            style={{ color: 'var(--text-sec)' }}
          >
            {connected ? 'SERIAL OK' : 'OFFLINE'}
          </span>
        </div>

        <div className="w-px h-5" style={{ background: 'var(--border)' }} />

        {/* 导入按钮 */}
        <label className="btn btn-cyan cursor-pointer px-2.5 py-1 text-[10px]">
          📁 导入
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        {/* 主题切换 */}
        <button
          className="btn btn-ghost px-2.5 py-1 text-xs"
          onClick={theme.toggleTheme}
        >
          {theme.themeIcon}
        </button>

        <div className="flex-1" />

        {/* 连接/断开按钮 */}
        <button
          className="btn btn-amber px-3 py-1 text-[10px]"
          onClick={handleConnectToggle}
        >
          {connected ? '⏹ DISCONNECT' : '▶ CONNECT'}
        </button>

        {/* 监视面板切换 */}
        <button
          className="btn btn-ghost px-2.5 py-1 text-[10px]"
          onClick={toggleMonitorPanel}
        >
          {monitorPanelVisible ? '▽ 监视' : '△ 监视'}
        </button>

        {/* 右侧面板切换 */}
        <button
          className="btn btn-ghost px-2.5 py-1 text-[10px]"
          onClick={toggleRightPanel}
        >
          {rightPanelVisible ? '▷' : '◁'}
        </button>
      </div>
    </div>
  );
}
