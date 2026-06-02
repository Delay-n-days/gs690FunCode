"use client"
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root
const SelectTrigger = React.forwardRef<React.ComponentRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger ref={ref} className={cn("flex h-7 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-base)] px-2 font-mono text-[11px] text-[var(--text-pri)] outline-none", className)} {...props}>{children}</SelectPrimitive.Trigger>
  )
)
const SelectValue = SelectPrimitive.Value
const SelectContent = React.forwardRef<React.ComponentRef<typeof SelectPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content ref={ref} className={cn("relative z-50 max-h-60 overflow-auto rounded-md border border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-pri)]", className)} {...props}>
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
)
const SelectItem = React.forwardRef<React.ComponentRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item ref={ref} className={cn("relative flex cursor-pointer select-none items-center rounded-sm py-1 pl-2 pr-6 font-mono text-[11px] outline-none hover:bg-[var(--bg-selected)]", className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
)
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
