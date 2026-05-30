"use client"

import { cn } from "@/lib/utils"

function DropdownMenu({ children }: { children: React.ReactNode }) { return <div className="relative">{children}</div> }
function DropdownMenuTrigger({ children }: { children: React.ReactNode }) { return <>{children}</> }
function DropdownMenuContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)}>{children}</div>
}
function DropdownMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent", className)} {...props} />
}
function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props} />
}
function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} />
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator }
