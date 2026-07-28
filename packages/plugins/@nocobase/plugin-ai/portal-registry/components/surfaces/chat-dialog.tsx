import type { PropsWithChildren } from "react";
import { ChatSurface } from "./chat-surface";

export function ChatDialog({
  open,
  onOpenChange,
  children,
}: PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>) {
  return (
    <ChatSurface open={open} variant="dialog" onOpenChange={onOpenChange}>
      {children}
    </ChatSurface>
  );
}
