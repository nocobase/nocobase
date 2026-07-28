import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { History, LoaderCircle } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  useAIChatBase,
  useAIChatStatus,
  type AIToolCallDecision,
} from "../../providers";
import { ChatComposer, type AIChatComposerAction } from "./chat-composer";
import { AIChatHistoryDialog } from "./chat-history-dialog";
import { ChatHeader } from "./chat-header";

export type AIChatCompactProps = {
  className?: string;
  headerActions?: ReactNode;
  composerActions?: AIChatComposerAction[];
  showEmployeeSelector?: boolean;
  showModelSelector?: boolean;
  showUserPrompt?: boolean;
  enableAttachments?: boolean;
  placeholder?: string;
  disclaimer?: ReactNode | false;
  onToolCallDecision?: (decision: AIToolCallDecision) => void | Promise<void>;
};

export function AIChatCompact({
  className,
  headerActions,
  composerActions,
  showEmployeeSelector = true,
  showModelSelector = true,
  showUserPrompt = true,
  enableAttachments = false,
  placeholder,
  disclaimer,
  onToolCallDecision,
}: AIChatCompactProps) {
  const { currentEmployee } = useAIChatBase();
  const { status } = useAIChatStatus();
  const [historyOpen, setHistoryOpen] = useState(false);
  const busy = status === "submitted" || status === "streaming";

  return (
    <section
      className={cn(
        "flex min-h-0 w-full flex-col overflow-hidden rounded-xl border bg-card",
        className
      )}
    >
      <ChatHeader
        showConversationToggle={false}
        showUserPrompt={showUserPrompt}
        actions={
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open message history"
              onClick={() => setHistoryOpen(true)}
            >
              <History />
            </Button>
            {headerActions}
          </>
        }
      />
      {busy ? (
        <div className="flex items-center gap-2 border-b bg-muted/25 px-4 py-2 text-xs text-muted-foreground">
          <LoaderCircle className="size-3.5 animate-spin" />
          {currentEmployee.nickname} is working…
        </div>
      ) : null}
      <ChatComposer
        actions={composerActions}
        showEmployeeSelector={showEmployeeSelector}
        showModelSelector={showModelSelector}
        enableAttachments={enableAttachments}
        placeholder={placeholder}
        disclaimer={disclaimer}
      />
      <AIChatHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        trigger={null}
        onToolCallDecision={onToolCallDecision}
      />
    </section>
  );
}
