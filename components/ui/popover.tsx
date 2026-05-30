"use client"

import { cn } from "@/lib/utils"

function Popover({ children }: { children: React.ReactNode }) { return <div className="relative">{children}</div> }
function PopoverTrigger({ children }: { children: React.ReactNode }) { return <>{children}</> }
function PopoverContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md", className)}>{children}</div>
}

export { Popover, PopoverTrigger, PopoverContent }
