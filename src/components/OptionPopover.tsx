/**
 * OptionPopover 组件 — 功能码选项弹出框
 * 显示功能码的可选值列表，点击选择后写入设置值
 */

'use client';

import { useEffect, useRef } from 'react';
import { useUIStore, useFuncodeStore } from '@/store';
import { parseOptions } from '@/lib/utils';
import { toast } from 'sonner';
import type { FuncCodeRuntime } from '@/lib/types';

interface Props {
  fc: FuncCodeRuntime;
  x: number;
  y: number;
}

export default function OptionPopover({ fc, x, y }: Props) {
  const popRef = useRef<HTMLDivElement>(null);
  const closePopover = useUIStore(s => s.closePopover);
  const pendingWrites = useFuncodeStore(s => s.pendingWrites);
  const setPendingWrite = useFuncodeStore(s => s.setPendingWrite);

  const options = parseOptions(fc.function_code_option);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        closePopover();
      }
    };
    const timer = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handler);
    };
  }, [closePopover]);

  // 修正位置
  const adjustedX = Math.min(x, window.innerWidth - 340);
  const adjustedY = Math.min(y, window.innerHeight - 320);

  return (
    <div
      ref={popRef}
      className="fixed z-[10001] rounded border py-1 min-w-[300px] max-h-[300px] overflow-y-auto"
      style={{
        left: adjustedX,
        top: adjustedY,
        background: 'var(--bg-panel)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* 标题 */}
      <div
        className="px-3 py-1 font-mono text-[9px]"
        style={{ color: 'var(--text-dim)' }}
      >
        {fc.function_code} 选项
      </div>

      <div className="mx-3" style={{ height: 1, background: 'var(--border)' }} />

      {/* 选项列表 */}
      {options.map(opt => {
        const isCurrent = pendingWrites[fc.function_code] === opt.value;
        return (
          <div
            key={opt.value}
            className="px-3 py-1.5 text-[11px] font-mono cursor-pointer transition-colors"
            style={{
              background: isCurrent ? 'var(--bg-selected)' : 'transparent',
              borderLeft: isCurrent ? '3px solid var(--amber)' : '3px solid transparent',
            }}
            onClick={() => {
              setPendingWrite(fc.function_code, opt.value);
              closePopover();
              toast.info(`已选择: ${opt.value} - ${opt.label}`);
            }}
            onMouseEnter={e => {
              if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'var(--bg-row-hover)';
            }}
            onMouseLeave={e => {
              if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <span style={{ color: 'var(--amber)' }}>{opt.value}</span>
            <span className="ml-2 text-[10px]" style={{ color: 'var(--text-sec)' }}>{opt.label}</span>
          </div>
        );
      })}
    </div>
  );
}
