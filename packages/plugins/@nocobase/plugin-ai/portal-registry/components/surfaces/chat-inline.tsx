import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export function ChatInline({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "min-h-96 overflow-hidden rounded-xl border bg-card",
        className
      )}
    >
      {children}
    </div>
  );
}
