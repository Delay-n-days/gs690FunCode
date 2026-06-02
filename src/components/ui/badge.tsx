import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva("inline-flex items-center font-mono text-[9px] font-bold tracking-[0.05em] rounded-sm border", {
  variants: {
    variant: {
      rw: "bg-green/12 text-[var(--green)] border-green/30",
      r: "bg-cyan/10 text-[var(--cyan)] border-cyan/25",
      rws: "bg-amber/10 text-[var(--amber)] border-amber/30",
    },
  },
  defaultVariants: { variant: "r" },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), "px-1.5 py-[1px]", className)} {...props} />
}
export { Badge, badgeVariants }
