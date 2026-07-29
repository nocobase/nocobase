import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { PanelLeftClose, PanelRightClose } from "lucide-react";
import type { CSSProperties, PropsWithChildren } from "react";

export type ChatSurfaceVariant = "side-panel" | "dialog";

export type ChatSurfaceProps = PropsWithChildren<{
  open: boolean;
  variant: ChatSurfaceVariant;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  width?: number | string;
  closeOnEscape?: boolean;
  showCloseHandle?: boolean;
}>;

export function ChatSurface({
  open,
  variant,
  onOpenChange,
  side = "right",
  width = 450,
  closeOnEscape = true,
  showCloseHandle = false,
  children,
}: ChatSurfaceProps) {
  const expanded = variant === "dialog";
  const panelWidth = typeof width === "number" ? `${width}px` : width;

  return (
    <DialogPrimitive.Root
      open={open}
      modal={expanded}
      disablePointerDismissal={!expanded}
      onOpenChange={(nextOpen, eventDetails) => {
        if (
          !nextOpen &&
          eventDetails.reason === "escape-key" &&
          !closeOnEscape
        ) {
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-closed:pointer-events-none",
            !expanded && "pointer-events-none opacity-0"
          )}
        />
        <DialogPrimitive.Popup
          data-variant={variant}
          data-side={side}
          initialFocus={expanded}
          className={cn(
            "fixed z-50 flex max-w-full bg-background text-foreground shadow-2xl outline-none",
            "data-closed:pointer-events-none data-closed:opacity-0",
            expanded
              ? "top-1/2 left-1/2 h-[95svh] w-[95vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border"
              : cn(
                  "inset-y-0 h-svh w-(--chat-surface-width) translate-x-0 translate-y-0 overflow-visible rounded-none",
                  side === "right"
                    ? "right-0 border-l"
                    : "left-0 border-r"
                )
          )}
          style={
            {
              "--chat-surface-width": panelWidth,
            } as CSSProperties
          }
        >
          <DialogPrimitive.Title className="sr-only">
            NocoBase AI employee
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {expanded
              ? "Expanded AI conversation window."
              : "AI conversation side panel."}
          </DialogPrimitive.Description>
          {showCloseHandle && !expanded ? (
            <Button
              variant="outline"
              size="icon-sm"
              className={cn(
                "absolute top-1/2 z-40 size-9 -translate-y-1/2 rounded-full bg-background shadow-md before:absolute before:-inset-2",
                side === "right"
                  ? "left-0 -translate-x-1/2"
                  : "right-0 translate-x-1/2"
              )}
              aria-label="Close side panel"
              onClick={() => onOpenChange(false)}
            >
              {side === "right" ? <PanelRightClose /> : <PanelLeftClose />}
            </Button>
          ) : null}
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            {children}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
