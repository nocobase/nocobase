import { cn } from "@/lib/utils";
import { useAIChatBase, type AIToolCallDecision } from "../../providers";
import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { ChatComposer, type AIChatComposerAction } from "./chat-composer";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ConversationList } from "./conversation-list";

export function AIChatWindow({
  className,
  headerActions,
  composerActions,
  showConversationToggle = true,
  showNewConversation = true,
  showEmployeeSelector = true,
  showModelSelector = true,
  showUserPrompt = true,
  enableAttachments = false,
  attachmentActionIndex = 0,
  placeholder,
  disclaimer,
  onToolCallDecision,
}: AIChatWindowProps) {
  const { conversationListOpen, setConversationListOpen, uploadFiles } =
    useAIChatBase();
  const [draggingFiles, setDraggingFiles] = useState(false);
  const dragDepthRef = useRef(0);

  const hasFiles = (event: DragEvent) =>
    Array.from(event.dataTransfer.types).includes("Files");

  return (
    <section
      className={cn(
        "ai-chat-window relative flex h-full min-h-0 w-full overflow-hidden bg-background text-foreground",
        className
      )}
      onDragEnter={(event) => {
        if (!enableAttachments || !hasFiles(event)) return;
        event.preventDefault();
        dragDepthRef.current += 1;
        setDraggingFiles(true);
      }}
      onDragOver={(event) => {
        if (!enableAttachments || !hasFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        if (!enableAttachments || !hasFiles(event)) return;
        event.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setDraggingFiles(false);
      }}
      onDrop={(event) => {
        if (!enableAttachments || !hasFiles(event)) return;
        event.preventDefault();
        dragDepthRef.current = 0;
        setDraggingFiles(false);
        const files = Array.from(event.dataTransfer.files);
        if (files.length) void uploadFiles(files);
      }}
    >
      {draggingFiles ? (
        <div className="pointer-events-none absolute inset-2 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-foreground/25 bg-background/90 text-sm font-medium shadow-sm backdrop-blur-sm">
          Drop files to upload
        </div>
      ) : null}
      {conversationListOpen && showConversationToggle ? (
        <button
          type="button"
          className="ai-chat-conversation-backdrop absolute inset-0 z-20 bg-black/25 backdrop-blur-[1px]"
          aria-label="Close conversation list"
          onClick={() => setConversationListOpen(false)}
        />
      ) : null}
      {conversationListOpen && showConversationToggle ? (
        <aside className="ai-chat-conversation-panel z-30 flex h-full w-[300px] shrink-0 border-r bg-card">
          <ConversationList />
        </aside>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          actions={headerActions}
          showConversationToggle={showConversationToggle}
          showNewConversation={showNewConversation}
          showUserPrompt={showUserPrompt}
        />
        <ChatMessages onToolCallDecision={onToolCallDecision} />
        <ChatComposer
          actions={composerActions}
          showEmployeeSelector={showEmployeeSelector}
          showModelSelector={showModelSelector}
          enableAttachments={enableAttachments}
          attachmentActionIndex={attachmentActionIndex}
          placeholder={placeholder}
          disclaimer={disclaimer}
        />
      </div>
    </section>
  );
}

export type AIChatWindowProps = {
  className?: string;
  headerActions?: ReactNode;
  composerActions?: AIChatComposerAction[];
  showConversationToggle?: boolean;
  showNewConversation?: boolean;
  showEmployeeSelector?: boolean;
  showModelSelector?: boolean;
  showUserPrompt?: boolean;
  enableAttachments?: boolean;
  attachmentActionIndex?: number;
  placeholder?: string;
  disclaimer?: ReactNode | false;
  onToolCallDecision?: (decision: AIToolCallDecision) => void | Promise<void>;
};
