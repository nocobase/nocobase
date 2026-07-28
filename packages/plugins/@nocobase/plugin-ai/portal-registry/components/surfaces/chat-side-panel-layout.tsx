import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";
import { ChatSidePanel } from "./chat-side-panel";

export type ChatSidePanelLayoutProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panel: ReactNode;
  children: ReactNode;
  side?: "left" | "right";
  width?: number | string;
  closeOnEscape?: boolean;
  showCloseHandle?: boolean;
  className?: string;
};

export function ChatSidePanelLayout({
  open,
  onOpenChange,
  panel,
  children,
  side = "right",
  width = 450,
  closeOnEscape = true,
  showCloseHandle = true,
  className,
}: ChatSidePanelLayoutProps) {
  const panelWidth = typeof width === "number" ? `${width}px` : width;

  return (
    <div
      data-open={open}
      data-side={side}
      className={cn("chat-side-panel-layout @container min-w-0", className)}
      style={
        {
          "--chat-side-panel-width": panelWidth,
        } as CSSProperties
      }
    >
      <div className="min-w-0">{children}</div>
      <ChatSidePanel
        open={open}
        onOpenChange={onOpenChange}
        side={side}
        width={width}
        closeOnEscape={closeOnEscape}
        showCloseHandle={showCloseHandle}
      >
        {panel}
      </ChatSidePanel>
    </div>
  );
}
