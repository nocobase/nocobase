import type { PropsWithChildren } from "react";
import { ChatSurface } from "./chat-surface";

export type ChatSidePanelProps = PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  width?: number | string;
  closeOnEscape?: boolean;
  showCloseHandle?: boolean;
}>;

export function ChatSidePanel({
  open,
  onOpenChange,
  side = "right",
  width = 450,
  closeOnEscape = true,
  showCloseHandle = true,
  children,
}: ChatSidePanelProps) {
  return (
    <ChatSurface
      open={open}
      variant="side-panel"
      onOpenChange={onOpenChange}
      side={side}
      width={width}
      closeOnEscape={closeOnEscape}
      showCloseHandle={showCloseHandle}
    >
      {children}
    </ChatSurface>
  );
}
