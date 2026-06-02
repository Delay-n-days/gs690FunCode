/**
 * BottomPanel 组件 — 底部面板
 * 包含监视窗口、收藏、修改历史、常用功能码四个标签页
 */

'use client';

import { useMemo } from 'react';
import {
  useUIStore, useMonitorStore, useFavoriteStore, useFrequentStore,
  useHistoryStore, useFuncodeStore, useConnectionStore, useReadWriteStore,
} from '@/store';
import { getWrClass, getWrLabel, isWritable, getDisplayValue, getValueClass, getDisplayFactoryValue } from '@/lib/utils';
import type { FuncCodeRuntime } from '@/lib/types';

export default function BottomPanel() {
  const visible = useUIStore(s => s.monitorPanelVisible);
  const bottomTab = useUIStore(s => s.bottomTab);
  const setBottomTab = useUIStore(s => s.setBottomTab);
  const mainFlex = useUIStore(s => s.mainFlex);

  if (!visible) return null;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        flex: `0 0 ${100 - mainFlex}%`,
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-panel)',
      }}
    >
      {/* 标签栏 */}
      <div
        className="flex items-center border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}
      >
        <TabButton
          active={bottomTab === 'monitor'}
          onClick={() => setBottomTab('monitor')}
          label="监视窗口"
        />
        <TabButton
          active={bottomTab === 'favorite'}
          onClick={() => setBottomTab('favorite')}
          label="收藏"
        />
        <TabButton
          active={bottomTab === 'history'}
          onClick={() => setBottomTab('history')}
          label="修改历史"
        />
        <TabButton
          active={bottomTab === 'frequent'}
          onClick={() => setBottomTab('frequent')}
          label="常用功能码"
        />

        {/* 标签计数 */}
        <TabCount tab="monitor" />
        <TabCount tab="favorite" />

        <div className="flex-1" />

        {/* 操作按钮 */}
        <TabActions />
      </div>

      {/* 标签内容 */}
      <div className="flex-1 overflow-y-auto">
        {bottomTab === 'monitor' && <MonitorTab />}
        {bottomTab === 'favorite' && <FavoriteTab />}
        {bottomTab === 'history' && <HistoryTab />}
        {bottomTab === 'frequent' && <FrequentTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button className={`tab-btn ${active ? 'active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

function TabCount({ tab }: { tab: string }) {
  const bottomTab = useUIStore(s => s.bottomTab);
  const watchCount = useMonitorStore(s => s.items.length);
  const favCount = useFavoriteStore(s => s.codes.length);

  if (bottomTab !== tab) return null;

  return (
    <span
      className="font-mono text-[10px] ml-2"
      style={{ color: 'var(--text-dim)' }}
    >
      {tab === 'monitor' ? `${watchCount}/20` : favCount}
    </span>
  );
}

function TabActions() {
  const bottomTab = useUIStore(s => s.bottomTab);
  const connected = useConnectionStore(s => s.connected);
  const monitoring = useMonitorStore(s => s.monitoring);
  const startMonitor = useMonitorStore(s => s.startMonitor);
  const stopMonitor = useMonitorStore(s => s.stopMonitor);
  const clearWatch = useMonitorStore(s => s.clearWatch);
  const clearHistory = useHistoryStore(s => s.clearHistory);
  const toggleMonitorPanel = useUIStore(s => s.toggleMonitorPanel);

  return (
    <>
      {bottomTab === 'monitor' && (
        <>
          <button
            className="btn btn-green px-2.5 py-0.5 text-[10px]"
            disabled={!connected || monitoring}
            onClick={startMonitor}
          >
            ▶ 开始监控
          </button>
          <button
            className="btn btn-red px-2.5 py-0.5 text-[10px]"
            disabled={!monitoring}
            onClick={stopMonitor}
          >
            ■ 停止
          </button>
          <button
            className="btn btn-ghost px-2.5 py-0.5 text-[10px]"
            onClick={clearWatch}
          >
            清空
          </button>
        </>
      )}

      {bottomTab === 'history' && (
        <button
          className="btn btn-ghost px-2.5 py-0.5 text-[10px]"
          onClick={clearHistory}
        >
          清空
        </button>
      )}

      <button
        className="btn btn-ghost px-2 py-0.5 text-[10px]"
        onClick={toggleMonitorPanel}
      >
        ▽ 隐藏
      </button>
    </>
  );
}

/** 监视窗口 */
function MonitorTab() {
  const items = useMonitorStore(s => s.items);
  const removeFromWatch = useMonitorStore(s => s.removeFromWatch);
  const readSingle = useReadWriteStore(s => s.readSingle);

  return (
    <table className="fc-table" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: 30 }} />
        <col style={{ width: 80 }} />
        <col style={{ width: 120 }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th></th>
          <th>功能码</th>
          <th>注释</th>
          <th>当前值</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr
            key={item.function_code}
            className="fc-row"
            onDoubleClick={() => readSingle(item)}
          >
            <td>
              <button
                className="btn btn-ghost px-1 py-0 text-[9px]"
                onClick={() => removeFromWatch(i)}
              >
                ✕
              </button>
            </td>
            <td className="overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="font-mono text-[11px]" style={{ color: 'var(--amber)' }}>
                {item.function_code}
              </span>
            </td>
            <td className="overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="text-[11px]" style={{ color: 'var(--text-pri)' }}>
                {item.comment}
              </span>
            </td>
            <td>
              <span className={`val-display ${getValueClass(item)}`}>
                {getDisplayValue(item)}
              </span>
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td
              colSpan={4}
              className="text-center py-5 font-mono text-[11px]"
              style={{ color: 'var(--text-dim)' }}
            >
              — 右键点击功能码添加到监视窗口 —
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/** 收藏标签页 */
function FavoriteTab() {
  const codes = useFavoriteStore(s => s.codes);
  const remove = useFavoriteStore(s => s.remove);
  const funcodes = useFuncodeStore(s => s.funcodes);
  const selectedRows = useFuncodeStore(s => s.selectedRows);
  const toggleRow = useFuncodeStore(s => s.toggleRow);
  const pendingWrites = useFuncodeStore(s => s.pendingWrites);
  const setPendingWrite = useFuncodeStore(s => s.setPendingWrite);
  const connected = useConnectionStore(s => s.connected);
  const busy = useConnectionStore(s => s.busy);
  const readSingle = useReadWriteStore(s => s.readSingle);
  const writeSingle = useReadWriteStore(s => s.writeSingle);
  const setContextMenu = useUIStore(s => s.setContextMenu);

  const items = useMemo(() =>
    codes.map(code => funcodes.find(f => f.function_code === code)).filter(Boolean) as FuncCodeRuntime[],
    [codes, funcodes]
  );

  return (
    <table className="fc-table">
      <thead>
        <tr>
          <th style={{ width: 28 }}></th>
          <th style={{ width: 28 }}></th>
          <th style={{ width: 55 }}>属性</th>
          <th style={{ width: 60 }}>功能码</th>
          <th style={{ minWidth: 90 }}>注释</th>
          <th style={{ width: 70 }}>出厂值</th>
          <th style={{ width: 80 }}>当前值</th>
          <th style={{ width: 50 }}>单位</th>
          <th style={{ width: 155 }}>设置值</th>
          <th style={{ width: 100 }}>范围</th>
          <th style={{ width: 250 }}>选项说明</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr
            key={item.function_code}
            className="fc-row"
            onDoubleClick={() => readSingle(item)}
            onContextMenu={e => {
              e.preventDefault();
              setContextMenu({ visible: true, x: e.clientX, y: e.clientY, funcCode: item });
            }}
          >
            <td>
              <button className="btn btn-ghost px-1 py-0 text-[9px]" onClick={() => remove(item.function_code)}>✕</button>
            </td>
            <td>
              <input
                type="checkbox"
                className="row-checkbox"
                checked={selectedRows.has(item.function_code)}
                onChange={() => toggleRow(item)}
              />
            </td>
            <td>
              <span className={`wr-badge ${getWrClass(item.wr_attribute)}`}>{getWrLabel(item.wr_attribute)}</span>
            </td>
            <td>
              <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--amber)' }}>{item.function_code}</span>
            </td>
            <td>
              <span className="text-[11px] font-bold" style={{ color: 'var(--text-pri)' }}>{item.comment}</span>
            </td>
            <td>
              <span className="font-mono text-[10px]" style={{ color: 'var(--amber)' }}>{getDisplayFactoryValue(item)}</span>
            </td>
            <td>
              <span className={`val-display ${getValueClass(item)}`}>{getDisplayValue(item)}</span>
            </td>
            <td>
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-sec)' }}>{item.unit}</span>
            </td>
            <td onClick={e => e.stopPropagation()}>
              {isWritable(item) && (
                <div className="flex items-center gap-0.5">
                  <input
                    className="fc-input"
                    style={{ width: 80, flexShrink: 0 }}
                    placeholder={getDisplayFactoryValue(item)}
                    value={pendingWrites[item.function_code] || ''}
                    onChange={e => setPendingWrite(item.function_code, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && writeSingle(item)}
                  />
                  <button
                    className="btn btn-green px-1.5 py-0.5 text-[10px]"
                    style={{ visibility: pendingWrites[item.function_code] ? 'visible' : 'hidden' }}
                    disabled={!connected || busy || !pendingWrites[item.function_code]}
                    onClick={() => writeSingle(item)}
                  >▲</button>
                </div>
              )}
            </td>
            <td>
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-sec)' }}>—</span>
            </td>
            <td>
              <span className="text-[10px] overflow-hidden text-ellipsis whitespace-nowrap block" style={{ color: 'var(--text-sec)', width: 250 }}>
                {item.function_code_option}
              </span>
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={11} className="text-center py-5 font-mono text-[11px]" style={{ color: 'var(--text-dim)' }}>
              — 右键点击功能码收藏 —
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/** 修改历史 */
function HistoryTab() {
  const items = useHistoryStore(s => s.items);
  const removeItem = useHistoryStore(s => s.removeItem);

  return (
    <table className="fc-table" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: 30 }} />
        <col style={{ width: 80 }} />
        <col style={{ width: 120 }} />
        <col />
        <col />
        <col style={{ width: 80 }} />
      </colgroup>
      <thead>
        <tr>
          <th></th>
          <th>功能码</th>
          <th>注释</th>
          <th>修改前</th>
          <th>修改后</th>
          <th>时间</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} className="fc-row">
            <td>
              <button className="btn btn-ghost px-1 py-0 text-[9px]" onClick={() => removeItem(i)}>✕</button>
            </td>
            <td className="overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="font-mono text-[11px]" style={{ color: 'var(--amber)' }}>{item.function_code}</span>
            </td>
            <td className="overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="text-[11px]" style={{ color: 'var(--text-pri)' }}>{item.comment}</span>
            </td>
            <td>
              <span className="font-mono text-xs" style={{ color: 'var(--red)' }}>{item.oldValue}</span>
            </td>
            <td>
              <span className="font-mono text-xs" style={{ color: 'var(--green)' }}>{item.newValue}</span>
            </td>
            <td>
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>{item.time}</span>
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={6} className="text-center py-5 font-mono text-[11px]" style={{ color: 'var(--text-dim)' }}>
              — 暂无修改记录 —
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/** 常用功能码 */
function FrequentTab() {
  const stats = useFrequentStore(s => s.stats);
  const removeFrequent = useFrequentStore(s => s.remove);
  const funcodes = useFuncodeStore(s => s.funcodes);

  const sorted = useMemo(() => {
    return Object.entries(stats)
      .map(([code, count]) => {
        const fc = funcodes.find(f => f.function_code === code);
        return fc ? { ...fc, count } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b!.count - a!.count))
      .slice(0, 20);
  }, [stats, funcodes]);

  return (
    <table className="fc-table" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: 30 }} />
        <col style={{ width: 80 }} />
        <col style={{ width: 120 }} />
        <col style={{ width: 80 }} />
      </colgroup>
      <thead>
        <tr>
          <th></th>
          <th>功能码</th>
          <th>注释</th>
          <th>操作次数</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((item, i) => (
          <tr key={item!.function_code} className="fc-row">
            <td>
              <button className="btn btn-ghost px-1 py-0 text-[9px]" onClick={() => removeFrequent(item!.function_code)}>✕</button>
            </td>
            <td className="overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="font-mono text-[11px]" style={{ color: 'var(--amber)' }}>{item!.function_code}</span>
            </td>
            <td className="overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="text-[11px]" style={{ color: 'var(--text-pri)' }}>{item!.comment}</span>
            </td>
            <td>
              <span className="font-mono text-[11px]" style={{ color: 'var(--cyan)' }}>{item!.count}</span>
            </td>
          </tr>
        ))}
        {sorted.length === 0 && (
          <tr>
            <td colSpan={4} className="text-center py-5 font-mono text-[11px]" style={{ color: 'var(--text-dim)' }}>
              — 暂无常用功能码 —
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
