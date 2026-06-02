/**
 * GS690 功能码调试终端 — 主页面
 * 整合所有子组件，管理全局交互逻辑
 */

'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Toaster } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import {
  useFuncodeStore, useConnectionStore, useReadWriteStore,
  useUIStore, useMonitorStore, useFavoriteStore,
} from '@/store';
import Header from '@/components/Header';
import FuncCodeTable from '@/components/FuncCodeTable';
import RightPanel from '@/components/RightPanel';
import BottomPanel from '@/components/BottomPanel';
import ConnectDialog from '@/components/ConnectDialog';
import ContextMenu from '@/components/ContextMenu';
import OptionPopover from '@/components/OptionPopover';
import StatusBar from '@/components/StatusBar';
import { ADDR_TYPE_NAMES } from '@/lib/constants';
import { parseOptions } from '@/lib/utils';

export default function HomePage() {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Store hooks
  const filterGroup = useFuncodeStore(s => s.filterGroup);
  const funcodes = useFuncodeStore(s => s.funcodes);
  const filterText = useFuncodeStore(s => s.filterText);
  const selectedAddrType = useFuncodeStore(s => s.selectedAddrType);
  const connected = useConnectionStore(s => s.connected);
  const mainFlex = useUIStore(s => s.mainFlex);
  const contextMenu = useUIStore(s => s.contextMenu);
  const popover = useUIStore(s => s.popover);

  // 计算过滤后的功能码
  const filteredCodes = useMemo(() => {
    const txt = filterText.toLowerCase();
    return funcodes.filter(fc => {
      if (filterGroup && fc.group !== filterGroup) return false;
      if (txt) {
        return (fc.function_code || '').toLowerCase().includes(txt)
          || (fc.comment || '').toLowerCase().includes(txt)
          || (fc.variable_name || '').toLowerCase().includes(txt)
          || (fc.address_str || '').includes(txt);
      }
      return true;
    });
  }, [funcodes, filterText, filterGroup]);

  // 拖动分隔条
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startFlex = useUIStore.getState().mainFlex;
    const container = containerRef.current;
    if (!container) return;
    const containerHeight = container.offsetHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      const deltaPercent = (delta / containerHeight) * 100;
      let newFlex = startFlex + deltaPercent;
      newFlex = Math.max(20, Math.min(80, newFlex));
      useUIStore.getState().setMainFlex(Math.round(newFlex));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // 定时检查连接状态
  useEffect(() => {
    const check = useConnectionStore.getState().checkConnection;
    check(); // 初始检查
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, []);

  // 点击空白处关闭弹出菜单
  useEffect(() => {
    const closeAll = () => {
      useUIStore.getState().closeContextMenu();
      useUIStore.getState().closePopover();
    };
    document.addEventListener('click', closeAll);
    return () => document.removeEventListener('click', closeAll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen"
      style={{ fontFamily: 'var(--sans)' }}
    >
      {/* Sonner 通知容器 */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            color: 'var(--text-pri)',
            fontFamily: 'var(--mono)',
            fontSize: '12px',
          },
        }}
      />

      {/* 选项弹出框 */}
      {popover.visible && popover.funcCode && (
        <OptionPopover
          fc={popover.funcCode}
          x={popover.x}
          y={popover.y}
        />
      )}

      {/* 右键菜单 */}
      {contextMenu.visible && contextMenu.funcCode && (
        <ContextMenu
          fc={contextMenu.funcCode}
          x={contextMenu.x}
          y={contextMenu.y}
        />
      )}

      {/* 连接对话框 */}
      <ConnectDialog />

      {/* 标题栏 */}
      <Header theme={theme} />

      {/* 进度条 */}
      <ProgressBar />

      {/* 主布局：上方功能码表 + 右侧面板 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex overflow-hidden"
          style={{ flex: `0 0 ${mainFlex}%` }}
        >
          {/* 功能码表格（含分组侧边栏） */}
          <FuncCodeTable
            filteredCodes={filteredCodes}
            theme={theme}
          />

          {/* 右侧抽屉面板 */}
          <RightPanel />
        </div>

        {/* 拖动分隔条 */}
        <div className="resize-handle" onMouseDown={startResize} />

        {/* 底部监视面板 */}
        <BottomPanel />
      </div>

      {/* 状态栏 */}
      <StatusBar />
    </div>
  );
}

/** 进度条组件 */
function ProgressBar() {
  const busy = useConnectionStore(s => s.busy);
  return (
    <div className="prog-bar flex-shrink-0">
      <div
        className={`prog-fill ${busy ? 'animate' : ''}`}
        style={{ width: busy ? '100%' : '0%' }}
      />
    </div>
  );
}
