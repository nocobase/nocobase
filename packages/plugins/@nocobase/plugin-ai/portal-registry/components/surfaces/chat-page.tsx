import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export function ChatPage({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "h-[calc(100svh-11rem)] min-h-[560px] overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}
