"use client"
import { useState, useEffect } from "react"

export function useTheme() {
  const [mode, setMode] = useState<"dark" | "light">("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("theme") as "dark" | "light" | null
    if (saved) setMode(saved)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle("dark", mode === "dark")
    document.documentElement.classList.toggle("light", mode === "light")
    localStorage.setItem("theme", mode)
  }, [mode, mounted])

  return {
    mounted,
    themeIcon: mode === "dark" ? "☀" : "☾",
    toggleTheme: () => setMode(m => m === "dark" ? "light" : "dark"),
  }
}
