/**
 * StatusBar 组件 — 底部状态栏
 * 显示当前状态消息、连接类型、时间
 */

'use client';

import { useState, useEffect } from 'react';
import { useConnectionStore } from '@/store';

export default function StatusBar() {
  const statusMsg = useConnectionStore(s => s.statusMsg);
  const busy = useConnectionStore(s => s.busy);
  const [time, setTime] = useState('');

  // 定时更新时钟
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('zh-CN'));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="h-6 flex items-center px-3 gap-4 flex-shrink-0"
      style={{
        background: 'var(--bg-base)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* 状态消息 */}
      <span className="font-mono text-[10px]">
        <span
          className={busy ? 'blink' : ''}
          style={{ color: busy ? 'var(--amber)' : 'var(--text-dim)' }}
        >
          {statusMsg}
        </span>
      </span>

      <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>|</span>
      <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>SERIAL</span>

      <div className="flex-1" />

      {/* 时钟 */}
      <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
        {time}
      </span>
    </div>
  );
}
