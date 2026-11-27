import { cn } from "@/lib/utils"

// Decorative, CSS-animated Pong rally (see `.pong-*` in app/templates.css).
export function PongDemo({
  className,
  ballClassName,
  paddleClassName,
}: {
  className?: string
  ballClassName?: string
  paddleClassName?: string
}) {
  return (
    <div aria-hidden className={cn("pong-demo", className)}>
      <div className="pong-net" />
      <div className={cn("pong-paddle pong-paddle-left bg-foreground", paddleClassName)} />
      <div className={cn("pong-paddle pong-paddle-right bg-foreground", paddleClassName)} />
      <div className={cn("pong-ball bg-foreground", ballClassName)} />
    </div>
  )
}
