/** Ordered SDK parts, with source segments retaining one logical message and independent notices. */
import {
  AgentAvatar,
  ChatExtensionsContext,
  noticeText,
  useFormatters,
  type PendingMessage,
  type AppUIMessage,
  type AppUIToolApprovalInput,
  type ChatMessageSegment,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationNotice } from '@nocobase/app-plugin-agents/shared/conversations';
import { isToolUIPart } from 'ai';
import { AlertCircleIcon, RotateCcwIcon } from 'lucide-react';
import { useContext, useState, type ReactElement, type ReactNode } from 'react';
import { Button } from '#components/ui/button';
import { cn } from 'cn';
import { ChatMarkdown } from './chat-markdown.js';
import { useChatTranslation } from './chat-i18n.js';
import { ConsultationCard } from './consultation-card.js';
import { SentContext } from './context-chips.js';
import { MessageAttachments } from './message-attachments.js';

function Time({
  at,
  className,
}: {
  readonly at: string;
  readonly className?: string;
}): ReactElement {
  const format = useFormatters();
  return (
    <time
      dateTime={at}
      className={cn('text-xs text-muted-foreground', className)}
      title={format.dateTime(at)}
    >
      {format.relative(at)}
    </time>
  );
}
export interface MessageItemProps {
  readonly message: AppUIMessage;
  readonly segment?: ChatMessageSegment;
  readonly agentName: (agentId: string | undefined) => string;
  readonly extra?: ReactNode;
  readonly onApproval?: (input: AppUIToolApprovalInput) => Promise<void>;
  readonly approvalDisabled?: boolean;
}
export function MessageItem({
  message,
  segment,
  agentName,
  extra,
  onApproval,
  approvalDisabled,
}: MessageItemProps): ReactElement {
  const { t } = useChatTranslation();
  const extensions = useContext(ChatExtensionsContext);
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState(false);
  const parts = (
    segment?.partIndexes ?? message.parts.map((_part, index) => index)
  ).map((index) => ({ part: message.parts[index], index }));
  const fromAgent = message.role === 'assistant';
  const streaming = parts.some(
    ({ part }) => part.type === 'text' && part.state === 'streaming',
  );
  const at = segment?.at || message.metadata?.createdAt;
  const approve = async (approval: { id: string; approved: boolean }) => {
    if (!onApproval || !message.metadata?.executionId || approving) return;
    setApproving(true);
    setApprovalError(false);
    try {
      await onApproval({
        messageId: message.id,
        executionId: message.metadata.executionId,
        approval,
      });
    } catch {
      setApprovalError(true);
    } finally {
      setApproving(false);
    }
  };
  const content = parts.map(({ part, index }, position): ReactNode => {
    const key = String(index);
    if (part.type === 'text')
      return fromAgent ? (
        <ChatMarkdown key={key} content={part.text} />
      ) : (
        <p key={key} className='whitespace-pre-wrap wrap-anywhere'>
          {part.text}
        </p>
      );
    if (part.type === 'file') {
      if (parts[position - 1]?.part.type === 'file') return null;
      const files = [];
      for (const next of parts.slice(position)) {
        if (next.part.type !== 'file') break;
        files.push(next.part);
      }
      return <MessageAttachments key={key} attachments={files} />;
    }
    if (part.type === 'data-notice') {
      const card =
        extensions.renderDataPart?.(part, message) ??
        extensions.renderNews?.(part.data, message);
      return (
        <div key={part.id ?? key} data-chat-part='notice'>
          {card ?? (
            <p className='text-xs text-muted-foreground'>
              {extensions.newsText?.(part.data, t) ?? part.data.title}
            </p>
          )}
        </div>
      );
    }
    if (part.type === 'data-business') {
      const card = extensions.renderDataPart?.(part, message);
      if (card != null)
        return (
          <div key={part.id ?? key} data-chat-part='business'>
            {card}
          </div>
        );
      const payload = part.data.payload;
      const notice =
        payload &&
        typeof payload === 'object' &&
        !Array.isArray(payload) &&
        payload.code === part.data.kind
          ? (payload as unknown as ConversationNotice)
          : undefined;
      if (notice?.code === 'consultation')
        return <ConsultationCard key={part.id ?? key} notice={notice} />;
      return (
        <p key={part.id ?? key} className='text-xs text-muted-foreground'>
          {noticeText(
            t,
            notice,
            part.data.kind,
            (id) => agentName(id),
            extensions.newsText,
          )}
        </p>
      );
    }
    if (isToolUIPart(part)) {
      const name =
        part.type === 'dynamic-tool' ? part.toolName : part.type.slice(5);
      return (
        <div
          key={part.toolCallId}
          className='my-1 space-y-2 rounded-md border bg-background/60 p-3 text-sm'
          data-chat-part='tool'
          data-tool-call={part.toolCallId}
        >
          <p className='font-medium'>{name}</p>
          {part.input !== undefined ? (
            <pre className='overflow-auto whitespace-pre-wrap text-xs'>
              {JSON.stringify(part.input, null, 2)}
            </pre>
          ) : null}
          {part.state === 'approval-requested' ? (
            <div className='space-y-2'>
              <p>{t('chat.approval.request')}</p>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  disabled={approvalDisabled || approving || !onApproval}
                  onClick={() =>
                    void approve({ id: part.approval.id, approved: true })
                  }
                >
                  {t('chat.approval.approve')}
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={approvalDisabled || approving || !onApproval}
                  onClick={() =>
                    void approve({ id: part.approval.id, approved: false })
                  }
                >
                  {t('chat.approval.deny')}
                </Button>
              </div>
            </div>
          ) : null}
          {part.state === 'output-available' ? (
            <pre className='overflow-auto whitespace-pre-wrap text-xs'>
              {JSON.stringify(part.output, null, 2)}
            </pre>
          ) : null}
          {part.state === 'output-denied' ? (
            <p>{t('chat.approval.denied')}</p>
          ) : null}
          {part.state === 'output-error' ? (
            <p role='alert'>{part.errorText}</p>
          ) : null}
        </div>
      );
    }
    return null;
  });
  if (message.role === 'system')
    return (
      <li
        className='space-y-2 px-1'
        data-chat-message='system'
        data-message-id={message.id}
        data-seq={segment?.seq ?? message.metadata?.seq}
      >
        {content}
        {extra ?? null}
      </li>
    );
  const name = fromAgent ? agentName(message.metadata?.agentId) : null;
  return (
    <li
      className={cn('group/message flex gap-2', !fromAgent && 'justify-end')}
      data-chat-message={message.role}
      data-message-id={message.id}
      data-seq={segment?.seq ?? message.metadata?.seq}
      data-streaming={streaming ? true : undefined}
      aria-busy={streaming ? true : undefined}
    >
      {fromAgent ? (
        <AgentAvatar name={name} size='sm' className='mt-0.5' />
      ) : null}
      <div
        className={cn(
          'flex min-w-0 flex-col',
          fromAgent ? 'max-w-[92%] items-start' : 'max-w-[85%] items-end',
        )}
      >
        {fromAgent ? (
          <p className='mb-1 flex items-center gap-2 text-xs'>
            <span className='font-medium text-muted-foreground'>{name}</span>
            {at ? <Time at={at} /> : null}
          </p>
        ) : (
          <span className='sr-only'>{t('chat.you')}</span>
        )}
        <div
          className={cn(
            'max-w-full min-w-0 space-y-1 rounded-lg px-3 py-2 text-sm',
            fromAgent ? 'bg-muted' : 'bg-primary/10',
          )}
        >
          {content}
          {streaming ? (
            <span
              className='ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-foreground/60 align-middle motion-reduce:animate-none'
              role='status'
              aria-label={t('chat.reply.writing')}
            />
          ) : null}
        </div>
        {!fromAgent && message.metadata?.context ? (
          <SentContext context={message.metadata.context} />
        ) : null}
        {!fromAgent && at ? (
          <Time
            at={at}
            className='mt-1 text-muted-foreground/80 opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100 motion-reduce:transition-none pointer-coarse:opacity-100'
          />
        ) : null}
        {approvalError ? (
          <p role='alert' className='mt-1 text-xs text-destructive'>
            {t('chat.approval.failed')}
          </p>
        ) : null}
        {extra ?? null}
      </div>
    </li>
  );
}

export interface PendingItemProps {
  readonly message: PendingMessage;
  readonly onRetry: () => void;
  readonly onDiscard: () => void;
  readonly onContinue?: () => void;
  readonly onCheck?: () => void;
}

/** A message the server has not confirmed: "sending", or "not sent" with a retry. */
export function PendingItem({
  message,
  onRetry,
  onDiscard,
  onContinue,
  onCheck,
}: PendingItemProps): ReactElement {
  const { t } = useChatTranslation();
  const failed = message.status === 'failed';
  return (
    <li
      className='flex justify-end'
      data-chat-message='pending'
      data-status={message.status}
      aria-busy={message.status === 'sending' ? true : undefined}
    >
      <div className='flex max-w-[85%] min-w-0 flex-col items-end'>
        <p className='mb-1 text-xs text-muted-foreground'>
          {failed ? (
            <span className='inline-flex items-center gap-1 text-destructive'>
              <AlertCircleIcon className='size-3.5' aria-hidden='true' />
              {t('chat.pending.failed')}
            </span>
          ) : message.status === 'unknown' ? (
            t('chat.connectionUnknown')
          ) : (
            t('chat.pending.sending')
          )}
        </p>
        {message.attachments?.length ? (
          <MessageAttachments
            attachments={message.attachments}
            className={cn(
              message.content.trim() && 'mb-1',
              !failed && 'opacity-70',
            )}
          />
        ) : null}
        {message.content.trim() ? (
          <div
            className={cn(
              'max-w-full min-w-0 rounded-lg bg-primary/10 px-3 py-2 text-sm',
              !failed && 'opacity-70',
            )}
          >
            <p className='whitespace-pre-wrap wrap-anywhere'>
              {message.content}
            </p>
          </div>
        ) : null}
        {message.status === 'unknown' ? (
          <div className='mt-1 flex flex-wrap gap-1'>
            <Button variant='outline' size='xs' onClick={onCheck}>
              {t('chat.refreshHistory')}
            </Button>
            {onContinue ? (
              <Button variant='outline' size='xs' onClick={onContinue}>
                {t('chat.allowAnother')}
              </Button>
            ) : null}
          </div>
        ) : null}
        {failed ? (
          <div className='mt-1 flex gap-1'>
            <Button variant='ghost' size='xs' onClick={onDiscard}>
              {t('chat.pending.discard')}
            </Button>
            <Button variant='outline' size='xs' onClick={onRetry}>
              <RotateCcwIcon data-icon='inline-start' />
              {t('chat.pending.retry')}
            </Button>
          </div>
        ) : null}
      </div>
    </li>
  );
}
