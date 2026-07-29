import { Button } from "@/components/ui/button";
import {
  type AIChatMessage as AIChatMessageType,
  type AIToolCallDecision,
} from "../../providers";
import { Check, Copy, Pencil, RefreshCcw } from "lucide-react";
import { memo, useState } from "react";
import { MarkdownMessage } from "./markdown-message";
import { ReasoningPanel } from "./reasoning-panel";
import {
  getToolCallName,
  isToolCallPart,
  ToolCallCard,
} from "./tool-call-card";
import { ChatAttachment } from "./chat-attachment";
import { useAIToolRenderer } from "../tools/tool-renderer-provider";
import { SubAgentConversation } from "./sub-agent-conversation";
import { WorkContextChip } from "./work-context-chip";

type ChatMessageProps = {
  message: AIChatMessageType;
  onToolCallDecision?: (decision: AIToolCallDecision) => void | Promise<void>;
  showActions?: boolean;
  status?: "submitted" | "streaming" | "ready" | "error";
  retryMessage?: (message: AIChatMessageType) => Promise<void>;
  decideToolCall?: (decision: AIToolCallDecision) => Promise<void>;
  startEditingMessage?: (message: AIChatMessageType) => Promise<void>;
  focusComposer?: () => void;
};

function ChatMessageComponent({
  message,
  onToolCallDecision,
  showActions = true,
  status = "ready",
  retryMessage,
  decideToolCall,
  startEditingMessage,
  focusComposer,
}: ChatMessageProps) {
  const interactionPending = status === "streaming" || status === "submitted";
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
  const toolCalls = message.parts.filter(isToolCallPart);
  const singleToolCall = toolCalls.length === 1 ? toolCalls[0] : undefined;
  const singleToolRenderer = useAIToolRenderer(
    singleToolCall ? getToolCallName(singleToolCall) : ""
  );
  const useInlineToolActions =
    !text && Boolean(singleToolCall) && !singleToolRenderer;
  const assistantParts = message.parts.filter(
    (part) =>
      part.type === "text" ||
      part.type === "reasoning" ||
      part.type === "data-subAgent" ||
      isToolCallPart(part)
  );
  const showGenerating = !assistantParts.length && interactionPending;
  const attachments = message.metadata?.attachments ?? [];
  const workContext = message.metadata?.workContext ?? [];
  if (isUser) {
    return (
      <article className="group/message flex min-w-0 max-w-full flex-col items-end px-4 py-2 sm:px-5">
        <div className="flex min-w-0 max-w-[80%] flex-col items-end">
          {workContext.length ? (
            <div className="mb-1.5 flex max-w-full flex-wrap justify-end gap-1.5">
              {workContext.map((item, index) => (
                <WorkContextChip
                  key={`${item.type}:${item.id ?? item.title ?? index}`}
                  item={item}
                  className="bg-background"
                />
              ))}
            </div>
          ) : null}
          {attachments.length ? (
            <div className="mb-1.5 flex max-w-full flex-wrap justify-end gap-1.5">
              {attachments.map((attachment) => (
                <ChatAttachment key={attachment.uid} attachment={attachment} />
              ))}
            </div>
          ) : null}
          {text ? (
            <div className="min-w-0 max-w-full rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-sm leading-6 text-secondary-foreground">
              <div className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                {text}
              </div>
            </div>
          ) : null}
        </div>
        {showActions ? (
          <div className="pointer-events-none mt-1 flex h-6 items-center gap-1 opacity-0 transition-opacity group-hover/message:pointer-events-auto group-hover/message:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Edit message"
              disabled={interactionPending || !startEditingMessage}
              onClick={() => void startEditingMessage?.(message)}
            >
              <Pencil />
            </Button>
            {text ? (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Copy message"
                onClick={async () => {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                }}
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  }

  const messageActions = (
    <>
      {text ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Copy response"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Retry response"
        disabled={interactionPending || !retryMessage}
        onClick={() => void retryMessage?.(message)}
      >
        <RefreshCcw />
      </Button>
    </>
  );

  return (
    <article className="group/message min-w-0 max-w-full px-4 py-2 sm:px-5">
      <div className="min-w-0 space-y-4">
        {assistantParts.map((part, index) => {
          if (part.type === "reasoning") {
            return (
              <ReasoningPanel
                key={`reasoning-${index}`}
                streaming={part.state === "streaming"}
              >
                {part.text}
              </ReasoningPanel>
            );
          }
          if (part.type === "text") {
            return (
              <div
                key={`text-${index}`}
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
          if (!isToolCallPart(part)) return null;
          return (
            <ToolCallCard
              key={part.toolCallId}
              part={part}
              approval={message.metadata?.toolApprovals?.[part.toolCallId]}
              disabled={interactionPending}
              onRevise={focusComposer}
              inlineActions={
                showActions && useInlineToolActions && part === singleToolCall
                  ? messageActions
                  : undefined
              }
              onDecision={async (decision, input) => {
                const toolDecision = {
                  messageId: message.id,
                  toolCallId: part.toolCallId,
                  toolName: getToolCallName(part),
                  decision,
                  input,
                } satisfies AIToolCallDecision;
                await decideToolCall?.(toolDecision);
                try {
                  await onToolCallDecision?.(toolDecision);
                } catch (error) {
                  console.error("Tool-call decision callback failed", error);
                }
              }}
            />
          );
        })}
        {showGenerating ? (
          <div className="min-h-6 text-sm leading-6 text-foreground">
            <span
              className="inline-flex gap-1 py-2"
              aria-label="Generating response"
            >
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/70" />
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:120ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:240ms]" />
            </span>
          </div>
        ) : null}
      </div>
      {showActions && (text || (toolCalls.length && !useInlineToolActions)) ? (
        <div className="pointer-events-none mt-1 flex h-6 items-center gap-1 opacity-0 transition-opacity group-hover/message:pointer-events-auto group-hover/message:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
          {messageActions}
        </div>
      ) : null}
    </article>
  );
}

export const ChatMessage = memo(
  ChatMessageComponent,
  (previous, next) =>
    previous.message === next.message &&
    previous.status === next.status &&
    previous.showActions === next.showActions &&
    previous.onToolCallDecision === next.onToolCallDecision &&
    previous.retryMessage === next.retryMessage &&
    previous.decideToolCall === next.decideToolCall &&
    previous.startEditingMessage === next.startEditingMessage &&
    previous.focusComposer === next.focusComposer
);
