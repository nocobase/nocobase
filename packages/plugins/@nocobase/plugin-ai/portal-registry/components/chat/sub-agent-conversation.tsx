import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import {
  useAI,
  type AISubAgentConversation as AISubAgentConversationType,
  type AIToolCallDecision,
} from "../../providers";
import { AIEmployeeAvatar } from "./ai-employee-avatar";
import { MarkdownMessage } from "./markdown-message";
import { ReasoningPanel } from "./reasoning-panel";
import {
  getToolCallName,
  isToolCallPart,
  ToolCallCard,
} from "./tool-call-card";

export function SubAgentConversation({
  conversation,
  onToolCallDecision,
  status = "ready",
  decideToolCall,
  focusComposer,
}: {
  conversation: AISubAgentConversationType;
  onToolCallDecision?: (decision: AIToolCallDecision) => void | Promise<void>;
  status?: "submitted" | "streaming" | "ready" | "error";
  decideToolCall?: (decision: AIToolCallDecision) => Promise<void>;
  focusComposer?: () => void;
}) {
  const ai = useAI();
  const completed = conversation.status === "completed";
  const [expanded, setExpanded] = useState(true);
  const employee = ai.employees.find(
    (item) => item.username === conversation.username
  ) ?? {
    username: conversation.username,
    nickname: conversation.username,
  };
  const messages =
    conversation.messages[0]?.role === "user"
      ? conversation.messages.slice(1)
      : conversation.messages;
  const interactionPending = status === "streaming" || status === "submitted";

  return (
    <section className="min-w-0 max-w-full rounded-xl border border-dashed bg-muted/15">
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-full justify-start rounded-xl px-3 py-2 text-left"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? (
          <ChevronDown className="size-4 shrink-0" />
        ) : (
          <ChevronRight className="size-4 shrink-0" />
        )}
        <AIEmployeeAvatar employee={employee} className="size-6" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {employee.nickname}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-normal text-muted-foreground">
          {!completed ? <LoaderCircle className="size-3 animate-spin" /> : null}
          {completed ? "Completed" : "Working"}
        </span>
      </Button>
      {expanded ? (
        <div className="min-w-0 space-y-3 border-t border-dashed px-3 py-3">
          {messages.flatMap((message) =>
            message.parts.map((part, index) => {
              if (part.type === "reasoning") {
                return (
                  <ReasoningPanel
                    key={`${message.id}-reasoning-${index}`}
                    streaming={part.state === "streaming"}
                  >
                    {part.text}
                  </ReasoningPanel>
                );
              }
              if (part.type === "text") {
                return (
                  <div
                    key={`${message.id}-text-${index}`}
                    className="ai-markdown min-w-0 max-w-full [overflow-wrap:anywhere] text-sm leading-6 text-foreground"
                  >
                    <MarkdownMessage>{part.text}</MarkdownMessage>
                  </div>
                );
              }
              if (part.type === "data-subAgent") {
                return (
                  <SubAgentConversation
                    key={part.id ?? part.data.sessionId}
                    conversation={part.data}
                    onToolCallDecision={onToolCallDecision}
                    status={status}
                    decideToolCall={decideToolCall}
                    focusComposer={focusComposer}
                  />
                );
              }
              if (!isToolCallPart(part)) return [];
              return (
                <ToolCallCard
                  key={part.toolCallId}
                  part={part}
                  approval={message.metadata?.toolApprovals?.[part.toolCallId]}
                  disabled={interactionPending}
                  onRevise={focusComposer}
                  onDecision={async (decision, input) => {
                    const toolDecision = {
                      messageId: message.id,
                      toolCallId: part.toolCallId,
                      toolName: getToolCallName(part),
                      decision,
                      input,
                    } satisfies AIToolCallDecision;
                    await decideToolCall?.(toolDecision);
                    await onToolCallDecision?.(toolDecision);
                  }}
                />
              );
            })
          )}
          {!messages.length ? (
            <div
              className={cn(
                "text-xs text-muted-foreground",
                !completed && "animate-pulse"
              )}
            >
              {completed ? "No visible output." : "Starting delegated work…"}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
