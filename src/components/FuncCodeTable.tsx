/**
 * FuncCodeTable 组件 — 功能码表格
 * 包含分组侧边栏、工具栏、选择栏、功能码表格
 */

'use client';

import { useMemo } from 'react';
import {
  useFuncodeStore, useConnectionStore, useReadWriteStore,
  useUIStore, useMonitorStore, useFavoriteStore,
} from '@/store';
import { ADDR_TYPE_NAMES } from '@/lib/constants';
import {
  getWrClass, getWrLabel, isWritable, getDisplayValue, getValueClass,
  getDisplayFactoryValue, getDisplayUpperLimit, getDisplayLowerLimit,
  getGroupCount, getGroupPrefix,
} from '@/lib/utils';
import type { FuncCodeRuntime, GroupInfo } from '@/lib/types';
import type { ThemeMode } from '@/hooks/useTheme';

interface Props {
  filteredCodes: FuncCodeRuntime[];
  theme: { themeIcon: string; toggleTheme: () => void; fontLabel: string; toggleFont: () => void; scanlineOn: boolean; toggleScanline: () => void };
}

export default function FuncCodeTable({ filteredCodes, theme }: Props) {
  const funcodes = useFuncodeStore(s => s.funcodes);
  const filterGroup = useFuncodeStore(s => s.filterGroup);
  const filterText = useFuncodeStore(s => s.filterText);
  const selectedAddrType = useFuncodeStore(s => s.selectedAddrType);
  const selectedRows = useFuncodeStore(s => s.selectedRows);
  const pendingWrites = useFuncodeStore(s => s.pendingWrites);
  const connected = useConnectionStore(s => s.connected);
  const busy = useConnectionStore(s => s.busy);

  // 计算分组列表
  const groups = useMemo(() => {
    const groupSet = new Set(funcodes.map(f => f.group).filter(Boolean));
    return Array.from(groupSet);
  }, [funcodes]);

  // 计算分组后的功能码
  const groupedCodes = useMemo(() => {
    const groupMap = new Map<string, FuncCodeRuntime[]>();
    filteredCodes.forEach(fc => {
      const group = fc.group || '未分组';
      if (!groupMap.has(group)) groupMap.set(group, []);
      groupMap.get(group)!.push(fc);
    });
    return Array.from(groupMap.entries()).map(([group, items], idx) => ({
      group,
      groupNo: idx + 1,
      groupPrefix: items.length > 0 ? items[0].function_code.split('.')[0] : '??',
      items,
    }));
  }, [filteredCodes]);

  const allVisibleSelected = filteredCodes.length > 0
    && filteredCodes.every(fc => selectedRows.has(fc.function_code));

  return (
    <div className="flex flex-row flex-1 border-r" style={{ borderColor: 'var(--border)' }}>
      {/* 分组侧边栏 */}
      <GroupSidebar
        groups={groups}
        funcodes={funcodes}
        filterGroup={filterGroup}
      />

      {/* 功能码表格区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 工具栏 */}
        <Toolbar
          filteredCodes={filteredCodes}
          connected={connected}
          busy={busy}
        />

        {/* 选择栏 */}
        <SelectBar
          filteredCodes={filteredCodes}
          allVisibleSelected={allVisibleSelected}
        />

        {/* 表格 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <table className="fc-table">
            <thead>
              <tr>
                <th style={{ width: 28 }}></th>
                <th style={{ width: 55 }}>属性</th>
                <th style={{ width: 60 }}>功能码</th>
                <th style={{ minWidth: 90 }}>注释</th>
                <th style={{ width: 70 }}>出厂值</th>
                <th style={{ width: 80, textAlign: 'right', paddingRight: 12 }}>当前值</th>
                <th style={{ width: 50 }}>单位</th>
                <th style={{ width: 155 }}>设置值</th>
                <th style={{ width: 100 }}>范围</th>
                <th style={{ width: 250 }}>选项说明</th>
              </tr>
            </thead>
            <tbody>
              {groupedCodes.map(groupFcs => (
                groupFcs.items.map(fc => (
                  <FuncCodeRow key={fc.function_code} fc={fc} />
                ))
              ))}
              {filteredCodes.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-5 font-mono text-[11px]"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    — NO MATCH —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** 分组侧边栏 */
function GroupSidebar({ groups, funcodes, filterGroup }: {
  groups: string[];
  funcodes: FuncCodeRuntime[];
  filterGroup: string;
}) {
  const setFilterGroup = useFuncodeStore(s => s.setFilterGroup);

  const handleGroupClick = (group: string) => {
    setFilterGroup(group);
  };

  return (
    <div
      className="w-[140px] flex-shrink-0 flex flex-col"
      style={{ background: 'var(--bg-base)', borderRight: '1px solid var(--border)' }}
    >
      <div
        className="px-2 py-1.5 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}
      >
        <span
          className="font-mono text-[10px] tracking-[0.1em]"
          style={{ color: 'var(--amber)' }}
        >
          分组列表
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 全部分组 */}
        <GroupItem
          name="全部"
          count={funcodes.length}
          isActive={filterGroup === ''}
          onClick={() => handleGroupClick('')}
        />

        {/* 各功能组 */}
        {groups.map(g => (
          <GroupItem
            key={g}
            name={g}
            prefix={getGroupPrefix(g, funcodes)}
            count={getGroupCount(g, funcodes)}
            isActive={filterGroup === g}
            onClick={() => handleGroupClick(g)}
          />
        ))}
      </div>
    </div>
  );
}

/** 单个分组项 */
function GroupItem({ name, prefix, count, isActive, onClick }: {
  name: string;
  prefix?: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="cursor-pointer px-2.5 py-2 border-b transition-all"
      style={{
        borderColor: 'var(--border)',
        background: isActive ? 'var(--bg-selected)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--amber)' : '3px solid transparent',
      }}
      onClick={onClick}
    >
      {prefix ? (
        <div className="flex items-center gap-1.5">
          <span
            className="font-mono text-[10px] px-1 rounded-sm"
            style={{ color: 'var(--amber)', background: 'var(--amber-glow)' }}
          >
            {prefix}
          </span>
          <span
            className="text-[11px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ color: 'var(--text-pri)' }}
            title={name}
          >
            {name}
          </span>
          <span
            className="font-mono text-[9px] px-1 rounded-sm"
            style={{ color: 'var(--cyan)', background: 'rgba(0,207,255,0.1)' }}
          >
            {count}
          </span>
        </div>
      ) : (
        <>
          <div className="text-[11px]" style={{ color: 'var(--text-pri)' }}>{name}</div>
          <div
            className="font-mono text-[9px] mt-0.5"
            style={{ color: 'var(--text-dim)' }}
          >
            {count} 个功能码
          </div>
        </>
      )}
    </div>
  );
}

/** 工具栏：搜索框 + 寻址方式选择 + 读取按钮 */
function Toolbar({ filteredCodes, connected, busy }: {
  filteredCodes: FuncCodeRuntime[];
  connected: boolean;
  busy: boolean;
}) {
  const filterText = useFuncodeStore(s => s.filterText);
  const setFilterText = useFuncodeStore(s => s.setFilterText);
  const selectedAddrType = useFuncodeStore(s => s.selectedAddrType);
  const setSelectedAddrType = useFuncodeStore(s => s.setSelectedAddrType);
  const selectedRows = useFuncodeStore(s => s.selectedRows);
  const readSelected = useReadWriteStore(s => s.readSelected);
  const readAll = useReadWriteStore(s => s.readAll);

  return (
    <div
      className="px-2.5 py-2 flex items-center gap-1.5 border-b flex-shrink-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}
    >
      <input
        className="filter-input flex-1"
        placeholder="搜索功能码 / 名称 / 注释..."
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
      />

      <select
        className="filter-input"
        style={{ width: 110 }}
        value={selectedAddrType}
        onChange={e => setSelectedAddrType(Number(e.target.value))}
      >
        {Object.entries(ADDR_TYPE_NAMES).map(([val, name]) => (
          <option key={val} value={val}>{name}</option>
        ))}
      </select>

      <button
        className="btn btn-amber"
        disabled={!connected || selectedRows.size === 0 || busy}
        onClick={readSelected}
        title="读取选中"
      >
        ▼ READ ({selectedRows.size})
      </button>

      <button
        className="btn btn-cyan"
        disabled={!connected || busy}
        onClick={readAll}
        title="读取全部可见"
      >
        ⟳ ALL
      </button>
    </div>
  );
}

/** 选择栏：全选 + 统计 + 清除 + 写入按钮 */
function SelectBar({ filteredCodes, allVisibleSelected }: {
  filteredCodes: FuncCodeRuntime[];
  allVisibleSelected: boolean;
}) {
  const selectedRows = useFuncodeStore(s => s.selectedRows);
  const toggleSelectAll = useFuncodeStore(s => s.toggleSelectAll);
  const clearSelection = useFuncodeStore(s => s.clearSelection);
  const connected = useConnectionStore(s => s.connected);
  const busy = useConnectionStore(s => s.busy);
  const writeSelected = useReadWriteStore(s => s.writeSelected);

  return (
    <div
      className="px-2.5 py-1 flex items-center gap-2.5 border-b flex-shrink-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}
    >
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          className="row-checkbox"
          checked={allVisibleSelected}
          onChange={e => toggleSelectAll(e.target.checked, filteredCodes)}
        />
        <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>全选</span>
      </label>

      <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>
        {filteredCodes.length} 条 · 已选 {selectedRows.size}
      </span>

      <div className="flex-1" />

      <button
        className="btn btn-ghost px-2 py-0.5 text-[9px]"
        onClick={clearSelection}
      >
        清除选择
      </button>

      <button
        className="btn btn-red px-2.5 py-0.5"
        disabled={!connected || selectedRows.size === 0 || busy}
        onClick={writeSelected}
      >
        ▲ WRITE
      </button>
    </div>
  );
}

/** 功能码单行 */
function FuncCodeRow({ fc }: { fc: FuncCodeRuntime }) {
  const toggleRow = useFuncodeStore(s => s.toggleRow);
  const selectedRows = useFuncodeStore(s => s.selectedRows);
  const pendingWrites = useFuncodeStore(s => s.pendingWrites);
  const setPendingWrite = useFuncodeStore(s => s.setPendingWrite);
  const connected = useConnectionStore(s => s.connected);
  const busy = useConnectionStore(s => s.busy);
  const readSingle = useReadWriteStore(s => s.readSingle);
  const writeSingle = useReadWriteStore(s => s.writeSingle);
  const setContextMenu = useUIStore(s => s.setContextMenu);
  const setPopover = useUIStore(s => s.setPopover);

  const isSelected = selectedRows.has(fc.function_code);
  const writable = isWritable(fc);
  const pendingVal = pendingWrites[fc.function_code] || '';

  /** 右键菜单 */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, funcCode: fc });
  };

  /** 选项弹出框 */
  const handleOptionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const popH = 300, popW = 320;
    let top = rect.bottom + 4;
    let left = rect.left;
    if (top + popH > window.innerHeight) top = rect.top - 4;
    if (left + popW > window.innerWidth) left = window.innerWidth - popW - 10;
    if (left < 0) left = 10;
    setPopover({ visible: true, x: left, y: top, funcCode: fc });
  };

  return (
    <tr
      className={`fc-row ${isSelected ? 'selected' : ''}`}
      onClick={() => setContextMenu({ ...useUIStore.getState().contextMenu, funcCode: fc })}
      onDoubleClick={() => readSingle(fc)}
      onContextMenu={handleContextMenu}
    >
      {/* 复选框 */}
      <td onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          className="row-checkbox"
          checked={isSelected}
          onChange={() => toggleRow(fc)}
        />
      </td>

      {/* 读写属性 */}
      <td>
        <span className={`wr-badge ${getWrClass(fc.wr_attribute)}`}>
          {getWrLabel(fc.wr_attribute)}
        </span>
      </td>

      {/* 功能码编号 */}
      <td>
        <span className="font-mono text-[11px]" style={{ color: 'var(--amber)' }}>
          {fc.function_code}
        </span>
      </td>

      {/* 注释 */}
      <td>
        <span
          className="text-[11px]"
          style={{ color: 'var(--text-pri)' }}
        >
          {fc.comment}
        </span>
      </td>

      {/* 出厂值 */}
      <td>
        <span className="font-mono text-[10px]" style={{ color: 'var(--amber)' }}>
          {getDisplayFactoryValue(fc)}
        </span>
      </td>

      {/* 当前值 */}
      <td style={{ textAlign: 'right', paddingRight: 12 }}>
        <span className={`val-display ${getValueClass(fc)}`}>
          {getDisplayValue(fc)}
        </span>
      </td>

      {/* 单位 */}
      <td>
        <span className="font-mono text-[10px]" style={{ color: 'var(--text-sec)' }}>
          {fc.unit}
        </span>
      </td>

      {/* 设置值输入 */}
      <td onClick={e => e.stopPropagation()} style={{ width: 155 }}>
        {writable && (
          <div className="flex items-center gap-0.5">
            <input
              className="fc-input"
              style={{ width: 80, flexShrink: 0 }}
              placeholder={getDisplayFactoryValue(fc)}
              value={pendingVal}
              onChange={e => setPendingWrite(fc.function_code, e.target.value)}
              onKeyDown={e => e.key === 'Enter' && writeSingle(fc)}
            />
            <button
              className="btn btn-green px-1.5 py-0.5 text-[10px]"
              style={{ visibility: pendingVal ? 'visible' : 'hidden' }}
              disabled={!connected || busy || !pendingVal}
              onClick={() => writeSingle(fc)}
            >
              ▲
            </button>
          </div>
        )}
      </td>

      {/* 范围 */}
      <td>
        <span className="font-mono text-[10px]" style={{ color: 'var(--text-sec)' }}>
          {getDisplayLowerLimit(fc)}~{getDisplayUpperLimit(fc)}
        </span>
      </td>

      {/* 选项说明 */}
      <td style={{ position: 'relative' }}>
        <div className="flex items-center gap-1">
          {parseOptions(fc.function_code_option).length > 0 && (
            <button
              className="px-1 py-0.5 rounded-sm cursor-pointer text-[9px]"
              style={{
                background: 'var(--amber-glow)',
                border: '1px solid var(--amber)',
                color: 'var(--amber)',
              }}
              onClick={handleOptionClick}
            >
              ▼
            </button>
          )}
          <span
            className="text-[10px] overflow-hidden text-ellipsis whitespace-nowrap block"
            style={{ color: 'var(--text-sec)', width: 250 }}
            title={fc.function_code_option}
          >
            {fc.function_code_option}
          </span>
        </div>
      </td>
    </tr>
  );
}
