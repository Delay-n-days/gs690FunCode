/**
 * ContextMenu 组件 — 右键上下文菜单
 * 提供添加到监视窗口、收藏、选项选择等功能
 */

'use client';

import { useEffect, useRef } from 'react';
import { useUIStore, useMonitorStore, useFavoriteStore, useFuncodeStore } from '@/store';
import { parseOptions } from '@/lib/utils';
import { toast } from 'sonner';
import type { FuncCodeRuntime } from '@/lib/types';

interface Props {
  fc: FuncCodeRuntime;
  x: number;
  y: number;
}

export default function ContextMenu({ fc, x, y }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const closeContextMenu = useUIStore(s => s.closeContextMenu);
  const addToWatch = useMonitorStore(s => s.addToWatch);
  const addFavorite = useFavoriteStore(s => s.add);
  const removeFavorite = useFavoriteStore(s => s.remove);
  const isFavorited = useFavoriteStore(s => s.isFavorited);
  const setPendingWrite = useFuncodeStore(s => s.setPendingWrite);

  const options = parseOptions(fc.function_code_option);
  const isFav = isFavorited(fc.function_code);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    // 延迟绑定，避免打开时立刻触发
    const timer = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handler);
    };
  }, [closeContextMenu]);

  // 修正位置：确保菜单不超出屏幕
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      className="fixed z-[10000] rounded border py-1 min-w-[200px] max-h-[300px] overflow-y-auto"
      style={{
        left: adjustedX,
        top: adjustedY,
        background: 'var(--bg-panel)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* 添加到监视窗口 */}
      <MenuItem
        label="添加到监视窗口"
        onClick={() => { addToWatch(fc); closeContextMenu(); }}
      />

      {/* 收藏/取消收藏 */}
      <MenuItem
        label={isFav ? '取消收藏' : '收藏'}
        danger={isFav}
        onClick={() => {
          if (isFav) removeFavorite(fc.function_code);
          else addFavorite(fc.function_code);
          closeContextMenu();
        }}
      />

      {/* 选项分隔线 + 选项列表 */}
      {options.length > 0 && (
        <>
          <Divider />
          <div
            className="px-4 py-1 font-mono text-[9px]"
            style={{ color: 'var(--text-dim)' }}
          >
            选项
          </div>
          {options.map(opt => (
            <MenuItem
              key={opt.value}
              label={`${opt.value} ${opt.label}`}
              mono
              onClick={() => {
                setPendingWrite(fc.function_code, opt.value);
                closeContextMenu();
                toast.info(`已选择: ${opt.value} - ${opt.label}`);
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

/** 菜单项 */
function MenuItem({ label, danger, mono, onClick }: {
  label: string;
  danger?: boolean;
  mono?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`px-4 py-1.5 text-[11px] cursor-pointer transition-colors hover:bg-[var(--bg-selected)] ${mono ? 'font-mono' : ''}`}
      style={{ color: danger ? 'var(--red)' : 'var(--text-pri)' }}
      onClick={onClick}
    >
      {label}
    </div>
  );
}

/** 分隔线 */
function Divider() {
  return (
    <div
      className="my-1 mx-0"
      style={{ height: 1, background: 'var(--border)' }}
    />
  );
}
