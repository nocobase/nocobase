import { MailScheduledStatus } from './mail-scheduled-status.js';
import { CheckSquare2, Paperclip, Star, StickyNote } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import type { MailLabel, MailMessageSummary } from '../mail-client.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { cn } from '../lib/utils.js';
import {
  mailAddressName,
  formatMailAddress,
  formatMailAddresses,
} from '../lib/mail-address.js';
import { Button } from './ui/button.js';
import { MailLabelTag } from './mail-label-tag.js';

export interface MailMessageListLabels {
  readonly empty: string;
  readonly loading?: string;
  readonly messages?: string;
  readonly loadMore: string;
  readonly noSubject: string;
  readonly subjectCount?: (count: number) => string;
  readonly unknownSender: string;
}

export interface MailMessageListProps {
  readonly accountNames?: ReadonlyMap<string, string>;
  readonly availableLabels?: readonly MailLabel[];
  readonly labels: MailMessageListLabels;
  readonly loading?: boolean;
  readonly messages: readonly MailMessageSummary[];
  readonly nextCursor?: string;
  readonly onLoadMore: () => void;
  readonly onSelect: (message: MailMessageSummary) => void;
  readonly selectedMessageId?: string;
  readonly showAccount?: boolean;
}

export function MailMessageList({
  availableLabels = [],
  labels,
  loading = false,
  messages,
  nextCursor,
  onLoadMore,
  onSelect,
  selectedMessageId,
}: MailMessageListProps): ReactElement {
  const { t, i18n } = useTranslation(MAIL_PLUGIN_NS);
  const groupedMessages = groupMessagesByConversation(messages);
  const labelsById = new Map(availableLabels.map((label) => [label.id, label]));

  return (
    <section
      aria-busy={loading}
      aria-label={labels.messages ?? 'Messages'}
      className='h-full min-h-0 overflow-y-auto'
    >
      {loading && groupedMessages.length === 0 ? (
        <div role='status' className='space-y-4 p-4'>
          <span className='sr-only'>
            {labels.loading ?? 'Loading messages…'}
          </span>
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              aria-hidden='true'
              className='space-y-2 motion-safe:animate-pulse'
            >
              <div className='h-4 w-2/3 rounded bg-muted' />
              <div className='h-3 w-full rounded bg-muted' />
              <div className='h-3 w-4/5 rounded bg-muted' />
            </div>
          ))}
        </div>
      ) : null}
      {groupedMessages.length === 0 && !loading ? (
        <p className='p-8 text-center text-sm text-muted-foreground'>
          {labels.empty}
        </p>
      ) : null}
      <div className='divide-y'>
        {groupedMessages.map(({ message, subjectCount }) => {
          const sender = mailAddressName(message.from);
          const recipients = message.to
            .map(mailAddressName)
            .filter(Boolean)
            .join(', ');
          const messageLabels = message.labelIds
            .map((labelId) => labelsById.get(labelId))
            .filter((label): label is MailLabel => Boolean(label));
          return (
            <Button
              aria-current={
                selectedMessageId === message.id ? 'true' : undefined
              }
              className={cn(
                'block h-auto w-full border-0 px-4 py-3 text-left font-normal whitespace-normal hover:bg-muted/60',
                selectedMessageId === message.id && 'bg-primary/5',
                !message.read && 'bg-muted/30',
              )}
              key={message.id}
              onClick={() => onSelect(message)}
              type='button'
              variant='ghost'
            >
              <div className='flex items-center gap-2'>
                <span
                  aria-label={t('workspace.senderLabel', {
                    defaultValue: 'From',
                  })}
                  title={
                    message.from ? formatMailAddress(message.from) : undefined
                  }
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    !message.read && 'font-semibold',
                  )}
                >
                  {sender || labels.unknownSender}
                </span>
                {message.starred ? (
                  <Star
                    aria-label='Starred'
                    className='size-3.5 fill-amber-400 text-amber-500'
                  />
                ) : null}
                <time className='shrink-0 text-xs text-muted-foreground'>
                  {formatMessageDate(
                    message.receivedAt ?? message.sentAt,
                    i18n.language,
                  )}
                </time>
              </div>
              {recipients ? (
                <p
                  aria-label={t('workspace.to', { defaultValue: 'To' })}
                  title={formatMailAddresses(message.to)}
                  className='mt-1 truncate text-xs text-muted-foreground'
                >
                  {recipients}
                </p>
              ) : null}
              <div className='mt-1 flex items-center gap-2'>
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    !message.read && 'font-medium',
                  )}
                >
                  {message.subject || labels.noSubject}
                </span>
                {subjectCount > 1 ? (
                  <span
                    aria-label={
                      labels.subjectCount?.(subjectCount) ??
                      `${subjectCount} messages in this conversation`
                    }
                    className='shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary'
                  >
                    {subjectCount}
                  </span>
                ) : null}
                {message.hasAttachments ? (
                  <Paperclip
                    aria-label='Has attachments'
                    className='size-3.5 text-muted-foreground'
                  />
                ) : null}
                {message.note ? (
                  <StickyNote
                    aria-label='Has note'
                    className='size-3.5 text-muted-foreground'
                  />
                ) : null}
                {message.todo ? (
                  <CheckSquare2
                    aria-label='To do'
                    className='size-3.5 text-primary'
                  />
                ) : null}
              </div>
              {messageLabels.length > 0 ? (
                <div className='mt-2 flex min-w-0 flex-wrap gap-1.5'>
                  {messageLabels.map((label) => (
                    <MailLabelTag key={label.id} label={label} />
                  ))}
                </div>
              ) : null}
              <MailScheduledStatus message={message} />
              {message.preview ? (
                <p className='mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground'>
                  {message.preview}
                </p>
              ) : null}
            </Button>
          );
        })}
      </div>
      {nextCursor ? (
        <div className='p-3'>
          <Button
            className='w-full'
            disabled={loading}
            onClick={onLoadMore}
            variant='outline'
          >
            {labels.loadMore}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

interface GroupedMailMessage {
  readonly message: MailMessageSummary;
  readonly loadedCount: number;
  readonly subjectCount: number;
}

function groupMessagesByConversation(
  messages: readonly MailMessageSummary[],
): readonly GroupedMailMessage[] {
  const groups = new Map<string, GroupedMailMessage>();
  for (const message of messages) {
    const key = messageGroupKey(message);
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        message,
        loadedCount: 1,
        subjectCount: Math.max(1, message.subjectCount ?? 1),
      });
      continue;
    }
    groups.set(key, {
      message: mergeGroupedMessage(existing.message, message),
      loadedCount: existing.loadedCount + 1,
      subjectCount: Math.max(
        existing.subjectCount,
        existing.loadedCount + 1,
        message.subjectCount ?? 1,
      ),
    });
  }
  return [...groups.values()];
}

function messageGroupKey(message: MailMessageSummary): string {
  if (!message.draft && message.conversationId)
    return `${message.accountId}:conversation:${message.conversationId}`;
  return `${message.accountId}:message:${message.id}`;
}

function mergeGroupedMessage(
  representative: MailMessageSummary,
  message: MailMessageSummary,
): MailMessageSummary {
  return {
    ...representative,
    hasAttachments: representative.hasAttachments || message.hasAttachments,
    note: representative.note ?? message.note,
    read: representative.read && message.read,
    starred: representative.starred || message.starred,
    todo: representative.todo || message.todo,
    labelIds: [...new Set([...representative.labelIds, ...message.labelIds])],
  };
}

function formatMessageDate(value?: string, locale?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
