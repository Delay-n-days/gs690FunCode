"use client"
import { useState, useEffect } from "react"
import { loadFromStorage, saveToStorage } from "@/lib/utils"
import { STORAGE_KEYS, FONT_CONFIG, FONT_LABELS } from "@/lib/constants"

export function useTheme() {
  const [mode, setMode] = useState<"dark" | "light">(() => loadFromStorage(STORAGE_KEYS.THEME, "dark"))
  const [font, setFont] = useState<keyof typeof FONT_CONFIG>(() => loadFromStorage(STORAGE_KEYS.FONT, "mono"))
  const [scanline, setScanline] = useState(() => loadFromStorage(STORAGE_KEYS.SCANLINE, true))
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", mode === "light")
    document.documentElement.classList.toggle("scanline-off", !scanline)
    document.documentElement.style.setProperty("--mono", FONT_CONFIG[font].mono)
    document.documentElement.style.setProperty("--sans", FONT_CONFIG[font].sans)
    saveToStorage(STORAGE_KEYS.THEME, mode)
    saveToStorage(STORAGE_KEYS.FONT, font)
    saveToStorage(STORAGE_KEYS.SCANLINE, scanline)
  }, [mode, font, scanline])

  return {
    mounted,
    themeIcon: mode === "dark" ? "☀" : "☾",
    fontLabel: FONT_LABELS[font],
    scanlineOn: scanline,
    toggleTheme: () => setMode(m => m === "dark" ? "light" : "dark"),
    toggleFont: () => {
      const keys = Object.keys(FONT_CONFIG) as (keyof typeof FONT_CONFIG)[]
      setFont(keys[(keys.indexOf(font) + 1) % keys.length])
    },
    toggleScanline: () => setScanline(v => !v),
  }
}
