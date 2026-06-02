import * as React from "react"
import { cn } from "@/lib/utils"
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input type={type} ref={ref} className={cn("flex h-7 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-2 py-1 font-mono text-[var(--text-pri)] text-xs outline-none transition-colors placeholder:text-[var(--text-dim)] focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />
))
Input.displayName = "Input"
export { Input }
