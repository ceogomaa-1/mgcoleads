import { cn } from "@/lib/utils"

function Slider({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="range" className={cn("w-full cursor-pointer accent-primary", className)} {...props} />
}

export { Slider }
