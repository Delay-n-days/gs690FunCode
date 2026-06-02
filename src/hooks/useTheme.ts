/**
 * 主题管理 Hook
 * 支持深色/亮色主题切换，CRT 扫描线效果，字体切换
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, FONT_CONFIG, FONT_LABELS } from '@/lib/constants';

export type ThemeMode = 'dark' | 'light';
export type FontMode = keyof typeof FONT_CONFIG;

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [fontMode, setFontMode] = useState<FontMode>('mono');
  const [scanlineOn, setScanlineOn] = useState(true);

  // 初始化：从 localStorage 读取偏好
  useEffect(() => {
    const savedTheme = (localStorage.getItem(STORAGE_KEYS.THEME) || 'dark') as ThemeMode;
    const savedFont = (localStorage.getItem(STORAGE_KEYS.FONT) || 'mono') as FontMode;
    const savedScanline = localStorage.getItem(STORAGE_KEYS.SCANLINE);

    setTheme(savedTheme);
    setFontMode(savedFont);
    setScanlineOn(savedScanline !== 'off');

    // 应用主题 class
    document.documentElement.classList.toggle('theme-light', savedTheme === 'light');
    document.documentElement.classList.toggle('scanline-off', savedScanline === 'off');

    // 应用字体
    const css = FONT_CONFIG[savedFont];
    if (css) {
      document.documentElement.style.setProperty('--mono', css.mono);
      document.documentElement.style.setProperty('--sans', css.sans);
    }
  }, []);

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
