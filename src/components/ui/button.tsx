import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.08em] transition-all disabled:opacity-35 disabled:cursor-not-allowed border",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-[var(--amber)] border-[var(--amber-dim)] hover:bg-primary/20 hover:shadow-[0_0_12px_var(--amber-glow)]",
        destructive: "bg-red/10 text-[var(--red)] border-[var(--red-dim)] hover:bg-red/20 hover:shadow-[0_0_12px_rgba(255,68,68,0.2)]",
        outline: "bg-transparent text-[var(--text-sec)] border-[var(--border)] hover:bg-white/5 hover:text-[var(--text-pri)]",
        ghost: "bg-transparent text-[var(--text-sec)] border-transparent hover:bg-white/5 hover:text-[var(--text-pri)]",
        green: "bg-green/10 text-[var(--green)] border-[var(--green-dim)] hover:bg-green/20 hover:shadow-[0_0_12px_rgba(0,230,118,0.2)]",
        cyan: "bg-cyan/10 text-[var(--cyan)] border-[var(--cyan-dim)] hover:bg-cyan/15 hover:shadow-[0_0_12px_rgba(0,207,255,0.2)]",
      },
      size: { sm: "h-6 px-2 text-[10px]", default: "h-7 px-3.5", lg: "h-8 px-4" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = "Button"
export { Button, buttonVariants }
