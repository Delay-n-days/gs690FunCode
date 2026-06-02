"use client"
import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<React.ComponentRef<typeof SheetPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>>(
  ({ className, ...props }, ref) => (
    <SheetPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out", className)} {...props} ref={ref} />
  )
)

const SheetContent = React.forwardRef<React.ComponentRef<typeof SheetPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>>(
  ({ className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content ref={ref} className={cn("fixed right-0 top-0 h-full z-50 bg-[var(--bg-panel)] border-l border-[var(--border)] shadow-[-4px_0_20px_rgba(0,0,0,0.5)]", className)} {...props}>
        {children}
        <SheetPrimitive.Close className="absolute right-2 top-2 p-1 text-[var(--text-dim)] hover:text-[var(--text-pri)]"><X className="h-4 w-4" /></SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
)

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetOverlay, SheetPortal }
