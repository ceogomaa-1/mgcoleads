"use client"

import { cn } from "@/lib/utils"

function ScrollArea({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-auto", className)} {...props}>{children}</div>
}
function ScrollBar({ className }: { className?: string }) {
  return <div className={cn("hidden", className)} />
}

export { ScrollArea, ScrollBar }
