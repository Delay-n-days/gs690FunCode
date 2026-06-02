/**
 * 主题管理 Hook
 * 支持深色/亮色主题切换，CRT 扫描线效果，字体切换
 *
 * 使用 lazy initializer 从 localStorage 初始化状态，
 * 避免在 useEffect 中同步调用 setState。
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, FONT_CONFIG, FONT_LABELS } from '@/lib/constants';

export type ThemeMode = 'dark' | 'light';
export type FontMode = keyof typeof FONT_CONFIG;

/** 从 localStorage 安全读取初始值（SSR 时 localStorage 不可用） */
function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem(STORAGE_KEYS.THEME) || 'dark') as ThemeMode;
}

function readFont(): FontMode {
  if (typeof window === 'undefined') return 'mono';
  return (localStorage.getItem(STORAGE_KEYS.FONT) || 'mono') as FontMode;
}

function readScanline(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEYS.SCANLINE) !== 'off';
}

export function useTheme() {
  // 用 lazy initializer 直接从 localStorage 初始化，effect 里不再需要 setState
  const [theme, setTheme] = useState<ThemeMode>(readTheme);
  const [fontMode, setFontMode] = useState<FontMode>(readFont);
  const [scanlineOn, setScanlineOn] = useState<boolean>(readScanline);

  // 初始化：只做 DOM 副作用，不调 setState
  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.documentElement.classList.toggle('scanline-off', !scanlineOn);

    const css = FONT_CONFIG[fontMode];
    if (css) {
      document.documentElement.style.setProperty('--mono', css.mono);
      document.documentElement.style.setProperty('--sans', css.sans);
    }
  }, [theme, fontMode, scanlineOn]);

  /** 切换深色/亮色主题 */
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('theme-light', next === 'light');
      localStorage.setItem(STORAGE_KEYS.THEME, next);
      return next;
    });
  }, []);

  /** 切换字体 */
  const toggleFont = useCallback(() => {
    setFontMode(prev => {
      const modes = Object.keys(FONT_CONFIG) as FontMode[];
      const idx = modes.indexOf(prev);
      const next = modes[(idx + 1) % modes.length];
      const css = FONT_CONFIG[next];
      document.documentElement.style.setProperty('--mono', css.mono);
      document.documentElement.style.setProperty('--sans', css.sans);
      localStorage.setItem(STORAGE_KEYS.FONT, next);
      return next;
    });
  }, []);

  /** 切换 CRT 扫描线效果 */
  const toggleScanline = useCallback(() => {
    setScanlineOn(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('scanline-off', !next);
      localStorage.setItem(STORAGE_KEYS.SCANLINE, next ? 'on' : 'off');
      return next;
    });
  }, []);

  /** 获取主题图标 */
  const themeIcon = theme === 'dark' ? '☀' : '☾';

  /** 获取字体标签 */
  const fontLabel = FONT_LABELS[fontMode] || fontMode;

  return {
    theme,
    themeIcon,
    fontMode,
    fontLabel,
    scanlineOn,
    toggleTheme,
    toggleFont,
    toggleScanline,
  };
}
