import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import {
  type AIChatMessage as AIChatMessageType,
  type AIToolCallDecision,
} from '../../providers/index.js';
import { Check, Copy, Pencil, RefreshCcw } from 'lucide-react';
import { memo, useState } from 'react';
import { MarkdownMessage } from './markdown-message.js';
import { ReasoningPanel } from './reasoning-panel.js';
import { ToolCallCard } from './tool-call-card.js';
import { getToolCallName, isToolCallPart } from './tool-call-utils.js';
import { ChatAttachment } from './chat-attachment.js';
import { useAIToolRenderer } from '../tools/tool-renderer-context.js';
import { SubAgentConversation } from './sub-agent-conversation.js';
import { WorkContextChip } from './work-context-chip.js';
import { withStableKeys } from '../../shared/keys.js';

const getPartKey = (part: AIChatMessageType['parts'][number]) => {
  if (part.type === 'data-subAgent') return part.id ?? part.data.sessionId;
  if (isToolCallPart(part)) return part.toolCallId;
  return part.type;
};

type ChatMessageProps = {
  message: AIChatMessageType;
  onToolCallDecision?: (decision: AIToolCallDecision) => void | Promise<void>;
  showActions?: boolean;
  readOnly?: boolean;
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
  retryMessage?: (message: AIChatMessageType) => Promise<void>;
  decideToolCall?: (decision: AIToolCallDecision) => Promise<void>;
  startEditingMessage?: (message: AIChatMessageType) => Promise<void>;
  focusComposer?: () => void;
};

function ChatMessageComponent({
  message,
  onToolCallDecision,
  showActions = true,
  readOnly = false,
  status = 'ready',
  retryMessage,
  decideToolCall,
  startEditingMessage,
  focusComposer,
}: ChatMessageProps) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const interactionPending = status === 'streaming' || status === 'submitted';
  const [copied, setCopied] = useState(false);
  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  const isUser = message.role === 'user';
  const text = message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
  const toolCalls = message.parts.filter(isToolCallPart);
  const singleToolCall = toolCalls.length === 1 ? toolCalls[0] : undefined;
  const singleToolRenderer = useAIToolRenderer(
    singleToolCall ? getToolCallName(singleToolCall) : '',
  );
  const useInlineToolActions =
    !text && Boolean(singleToolCall) && !singleToolRenderer;
  const assistantParts = message.parts.filter(
    (part) =>
      part.type === 'text' ||
      part.type === 'reasoning' ||
      part.type === 'data-subAgent' ||
      isToolCallPart(part),
  );
  const showGenerating = !assistantParts.length && interactionPending;
  const attachments = message.metadata?.attachments ?? [];
  const workContext = message.metadata?.workContext ?? [];
  if (isUser) {
    return (
      <article className='group/message flex min-w-0 max-w-full flex-col items-end px-4 py-2 sm:px-5'>
        <div className='flex min-w-0 max-w-[80%] flex-col items-end'>
          {workContext.length ? (
            <div className='mb-1.5 flex max-w-full flex-wrap justify-end gap-1.5'>
              {workContext.map((item, index) => (
                <WorkContextChip
                  key={`${item.type}:${item.id ?? item.title ?? index}`}
                  item={item}
                  className='bg-background'
                />
              ))}
            </div>
          ) : null}
          {attachments.length ? (
            <div className='mb-1.5 flex max-w-full flex-wrap justify-end gap-1.5'>
              {attachments.map((attachment) => (
                <ChatAttachment key={attachment.uid} attachment={attachment} />
              ))}
            </div>
          ) : null}
          {text ? (
            <div className='min-w-0 max-w-full rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-sm leading-6 text-secondary-foreground'>
              <div className='whitespace-pre-wrap [overflow-wrap:anywhere]'>
                {text}
              </div>
            </div>
          ) : null}
        </div>
        {showActions && !readOnly ? (
          <div className='pointer-events-none mt-1 flex h-6 items-center gap-1 opacity-0 transition-opacity group-hover/message:pointer-events-auto group-hover/message:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100'>
            <Button
              variant='ghost'
              size='icon-xs'
              aria-label={t('chat.message.edit', 'Edit message')}
              disabled={interactionPending || !startEditingMessage}
              onClick={() => void startEditingMessage?.(message)}
            >
              <Pencil />
            </Button>
            {text ? (
              <Button
                variant='ghost'
                size='icon-xs'
                aria-label={t('chat.message.copy', 'Copy message')}
                onClick={() => void copyText()}
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
          variant='ghost'
          size='icon-xs'
          aria-label={t('chat.message.copyResponse', 'Copy response')}
          onClick={() => void copyText()}
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      ) : null}
      <Button
        variant='ghost'
        size='icon-xs'
        aria-label={t('chat.message.retry', 'Retry response')}
        disabled={interactionPending || !retryMessage}
        onClick={() => void retryMessage?.(message)}
      >
        <RefreshCcw />
      </Button>
    </>
  );

  return (
    <article className='group/message min-w-0 max-w-full px-4 py-2 sm:px-5'>
      <div className='min-w-0 space-y-4'>
        {withStableKeys(assistantParts, getPartKey).map(
          ({ key, item: part }) => {
            if (part.type === 'reasoning') {
              return (
                <ReasoningPanel
                  key={key}
                  streaming={part.state === 'streaming'}
                >
                  {part.text}
                </ReasoningPanel>
              );
            }
            if (part.type === 'text') {
              return (
                <div
                  key={key}
                  className='ai-markdown min-w-0 max-w-full [overflow-wrap:anywhere] text-sm leading-6 text-foreground'
                >
                  <MarkdownMessage>{part.text}</MarkdownMessage>
                </div>
              );
            }
            if (part.type === 'data-subAgent') {
              return (
                <SubAgentConversation
                  key={key}
                  conversation={part.data}
                  readOnly={readOnly}
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
                key={key}
                part={part}
                approval={message.metadata?.toolApprovals?.[part.toolCallId]}
                disabled={interactionPending}
                readOnly={readOnly}
                onRevise={focusComposer}
                inlineActions={
                  showActions &&
                  !readOnly &&
                  useInlineToolActions &&
                  part === singleToolCall
                    ? messageActions
                    : undefined
                }
                onDecision={async (decision, input) => {
                  if (readOnly) return;
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
                    console.error('Tool-call decision callback failed', error);
                  }
                }}
              />
            );
          },
        )}
        {showGenerating ? (
          <div className='min-h-6 text-sm leading-6 text-foreground'>
            <span
              className='inline-flex gap-1 py-2'
              aria-label={t('chat.message.generating', 'Generating response')}
            >
              <span className='size-1.5 animate-pulse rounded-full bg-muted-foreground/70' />
              <span className='size-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:120ms]' />
              <span className='size-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:240ms]' />
            </span>
          </div>
        ) : null}
      </div>
      {showActions &&
      !readOnly &&
      (text || (toolCalls.length && !useInlineToolActions)) ? (
        <div className='pointer-events-none mt-1 flex h-6 items-center gap-1 opacity-0 transition-opacity group-hover/message:pointer-events-auto group-hover/message:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100'>
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
    previous.readOnly === next.readOnly &&
    previous.onToolCallDecision === next.onToolCallDecision &&
    previous.retryMessage === next.retryMessage &&
    previous.decideToolCall === next.decideToolCall &&
    previous.startEditingMessage === next.startEditingMessage &&
    previous.focusComposer === next.focusComposer,
);
