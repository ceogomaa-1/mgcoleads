"use client"

import { cn } from "@/lib/utils"

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm", props.className)} {...props}>{children}</select>
}
function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-muted-foreground">{placeholder}</span>
}
function SelectContent({ children }: { children: React.ReactNode }) { return <>{children}</> }
function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>
}
function SelectGroup({ children }: { children: React.ReactNode }) { return <>{children}</> }
function SelectLabel({ children }: { children: React.ReactNode }) { return <optgroup label={String(children)} /> }

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel }
