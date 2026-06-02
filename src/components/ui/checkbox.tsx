"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input type="checkbox" ref={ref} className={cn("accent-[var(--amber)] w-[13px] h-[13px] cursor-pointer", className)} {...props} />
  )
)
Checkbox.displayName = "Checkbox"
export { Checkbox }
