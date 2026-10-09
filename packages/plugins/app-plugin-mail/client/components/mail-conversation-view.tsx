import { isVisibleMailAttachment } from '../../shared/inline-images.js';
import { MailScheduledStatus } from './mail-scheduled-status.js';
import {
  Archive,
  Check,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  Download,
  Forward,
  Mail,
  MailOpen,
  MoreHorizontal,
  Paperclip,
  PenLine,
  Reply,
  Star,
  StickyNote,
  Tag,
  Trash2,
} from 'lucide-react';
import type { ReactElement } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { MailMessageContent } from './mail-message-content.js';
import type { MailLabel, MailMessage } from '../mail-client.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import {
  mailAddressName,
  formatMailAddress,
  formatMailAddresses,
} from '../lib/mail-address.js';
import { Button, type ButtonProps } from './ui/button.js';
import { Checkbox } from './ui/checkbox.js';
import { MailLabelTag } from './mail-label-tag.js';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip.js';
import { Textarea } from './ui/textarea.js';

export interface MailConversationViewLabels {
  readonly attachmentCount: (count: number) => string;
  readonly conversation: (count: number) => string;
  readonly loadMore: string;
  readonly noSubject: string;
  readonly selectMessage: string;
  readonly unknownSender: string;
  readonly labels: string;
  readonly addLabel?: string;
  readonly note: string;
  readonly editNote?: string;
  readonly notePlaceholder: string;
  readonly saveNote: string;
  readonly todo: string;
  readonly markTodo?: string;
  readonly cancelTodo?: string;
  readonly completeTodo?: string;
  readonly more?: string;
  readonly close?: string;
  readonly collapseMessage?: string;
  readonly expandMessage?: string;
}

export interface MailConversationViewProps {
  readonly labels: MailConversationViewLabels;
  readonly loading?: boolean;
  readonly messages: readonly MailMessage[];
  readonly nextCursor?: string;
  readonly onLoadMore: () => void;
  readonly subject?: string;
  readonly availableLabels?: readonly MailLabel[];
  readonly actions?: {
    readonly archive?: (message: MailMessage) => void;
    readonly delete: (message: MailMessage) => void;
    readonly canDelete?: (message: MailMessage) => boolean;
    readonly downloadAttachment?: (
      message: MailMessage,
      attachment: MailMessage['attachments'][number],
    ) => void;
    readonly reply?: (message: MailMessage) => void;
    readonly forward?: (message: MailMessage) => void;
    readonly editDraft?: (message: MailMessage) => void;
    readonly cancelScheduled?: (message: MailMessage) => void;
    readonly toggleRead: (message: MailMessage) => void;
    readonly toggleStarred: (message: MailMessage) => void;
    readonly toggleTodo?: (message: MailMessage) => void;
    readonly saveNote?: (message: MailMessage, note: string) => void;
    readonly toggleLabel?: (
      message: MailMessage,
      labelId: string,
      assigned: boolean,
    ) => void;
  };
  readonly actionLabels?: {
    readonly archive: string;
    readonly delete: string;
    readonly download: string;
    readonly reply: string;
    readonly forward: string;
    readonly editDraft?: string;
    readonly markRead: string;
    readonly markUnread: string;
    readonly star: string;
    readonly unstar: string;
    readonly collapseMessage?: string;
    readonly expandMessage?: string;
  };
}

export function MailConversationView({
  labels,
  loading = false,
  messages,
  nextCursor,
  onLoadMore,
  subject,
  actions,
  actionLabels,
  availableLabels = [],
}: MailConversationViewProps): ReactElement {
  const { t, i18n } = useTranslation(MAIL_PLUGIN_NS);
  const noteTriggerRef = useRef<HTMLButtonElement>(null);
  const [noteEditor, setNoteEditor] = useState<{
    readonly messageId: string;
    readonly value: string;
  }>();
  const noteMessage = messages.find(
    (message) => message.id === noteEditor?.messageId,
  );
  const editNoteLabel =
    labels.editNote ?? t('workspace.editNote', { defaultValue: 'Edit note' });
  const addLabelText =
    labels.addLabel ?? t('workspace.addLabel', { defaultValue: 'Add label' });
  const openNoteEditor = (
    message: MailMessage,
    trigger: HTMLButtonElement | null,
  ): void => {
    noteTriggerRef.current = trigger;
    setNoteEditor({ messageId: message.id, value: message.note ?? '' });
  };
  const conversationKey = JSON.stringify([
    subject,
    messages[0]?.accountId,
    messages[0]?.conversationId,
  ]);
  const [collapseState, setCollapseState] = useState<{
    readonly conversationKey: string;
    readonly messages: ReadonlyMap<string, boolean>;
  }>(() => ({
    conversationKey,
    messages: new Map(messages.map((message) => [message.id, message.read])),
  }));
  let messageCollapseStates = collapseState.messages;
  if (
    collapseState.conversationKey !== conversationKey ||
    messages.some((message) => !collapseState.messages.has(message.id))
  ) {
    // Capture read state once so automatic read updates do not close an open message.
    messageCollapseStates = new Map(
      messages.map((message) => [
        message.id,
        collapseState.conversationKey === conversationKey
          ? (collapseState.messages.get(message.id) ?? message.read)
          : message.read,
      ]),
    );
    setCollapseState({ conversationKey, messages: messageCollapseStates });
  }
  // Conversation pages are ordered oldest first; older pages are prepended.
  const latestMessage = [...messages]
    .reverse()
    .find((message) => !message.draft);
  const canCollapse = messages.length > 1;
  const collapsedMessageIds = new Set(
    canCollapse
      ? messages
          .filter((message) => messageCollapseStates.get(message.id))
          .map((message) => message.id)
      : [],
  );

  if (messages.length === 0) {
    return (
      <section className='grid h-full min-h-0 flex-1 place-items-center overflow-y-auto p-8 text-sm text-muted-foreground'>
        {loading ? null : labels.selectMessage}
      </section>
    );
  }

  return (
    <section
      aria-busy={loading}
      className='@container/conversation h-full min-h-0 flex-1 overflow-y-auto bg-card text-card-foreground'
    >
      <header className='flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 pt-5 pb-4'>
        <h2 className='min-w-0 text-xl leading-snug font-semibold wrap-anywhere'>
          {subject || labels.noSubject}
        </h2>
        {messages.length > 1 ? (
          <span className='shrink-0 text-xs text-muted-foreground'>
            {labels.conversation(messages.length)}
          </span>
        ) : null}
      </header>
      <div className='px-5 pb-5'>
        {nextCursor ? (
          <Button
            className='mb-4 w-full'
            disabled={loading}
            onClick={onLoadMore}
            variant='outline'
          >
            {labels.loadMore}
          </Button>
        ) : null}
        {messages.map((message) => {
          const visibleAttachments = message.attachments.filter(
            isVisibleMailAttachment,
          );
          const sender = mailAddressName(message.from);
          const messageLabels = availableLabels.filter((label) =>
            message.labelIds.includes(label.id),
          );
          const canEditLabels =
            availableLabels.length > 0 && Boolean(actions?.toggleLabel);
          return (
            <article
              className='py-4 first:pt-0 last:pb-0 [&+article]:border-t'
              key={message.id}
            >
              <MailScheduledStatus
                message={message}
                variant='banner'
                action={
                  message.scheduledSend &&
                  ['pending', 'failed'].includes(
                    message.scheduledSend.status,
                  ) &&
                  actions?.cancelScheduled ? (
                    <Button
                      className='shrink-0 text-primary'
                      variant='ghost'
                      onClick={() => actions.cancelScheduled?.(message)}
                    >
                      {t('workspace.cancelScheduled', {
                        defaultValue: 'Cancel scheduled send',
                      })}
                    </Button>
                  ) : null
                }
              />
              <header className='relative isolate flex items-center gap-3'>
                {canCollapse ? (
                  <Button
                    aria-expanded={!collapsedMessageIds.has(message.id)}
                    aria-label={
                      collapsedMessageIds.has(message.id)
                        ? (actionLabels?.expandMessage ??
                          labels.expandMessage ??
                          'Expand message')
                        : (actionLabels?.collapseMessage ??
                          labels.collapseMessage ??
                          'Collapse message')
                    }
                    className='absolute -inset-2 z-0 block h-auto w-auto cursor-pointer rounded-md border-0 bg-transparent p-0 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
                    onClick={() =>
                      setCollapseState((current) => {
                        const next = new Map(current.messages);
                        next.set(message.id, !next.get(message.id));
                        return { conversationKey, messages: next };
                      })
                    }
                    type='button'
                    variant='ghost'
                  />
                ) : null}
                {canCollapse ? (
                  <span className='pointer-events-none relative text-muted-foreground'>
                    {collapsedMessageIds.has(message.id) ? (
                      <ChevronRight aria-hidden='true' className='size-4' />
                    ) : (
                      <ChevronDown aria-hidden='true' className='size-4' />
                    )}
                  </span>
                ) : null}
                <span className='pointer-events-none relative grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                  {sender?.trim().charAt(0).toUpperCase() || '?'}
                </span>
                <div className='pointer-events-none relative min-w-0 flex-1'>
                  <p
                    aria-label={t('workspace.senderLabel', {
                      defaultValue: 'From',
                    })}
                    title={
                      message.from ? formatMailAddress(message.from) : undefined
                    }
                    className='truncate text-sm font-medium'
                  >
                    {sender || labels.unknownSender}
                  </p>
                  {message.from?.address &&
                  message.from.address.trim() !== sender ? (
                    <p className='truncate text-xs text-muted-foreground'>
                      {message.from.address}
                    </p>
                  ) : null}
                </div>
                <div className='pointer-events-none relative flex max-w-2/3 shrink-0 flex-col items-end gap-1 @2xl/conversation:flex-row @2xl/conversation:items-center @2xl/conversation:gap-3'>
                  <time className='pointer-events-none relative max-w-full text-right text-xs text-muted-foreground'>
                    {formatFullDate(
                      message.receivedAt ?? message.sentAt,
                      i18n.language,
                    )}
                  </time>
                  {actions ? (
                    <div className='pointer-events-none relative flex max-w-full flex-wrap items-center justify-end gap-1 [&_button]:pointer-events-auto'>
                      {actionLabels ? (
                        <>
                          {message.draft &&
                          actions.editDraft &&
                          (!message.scheduledSend ||
                            ['pending', 'failed'].includes(
                              message.scheduledSend.status,
                            )) ? (
                            <MessageActionButton
                              aria-label={
                                message.scheduledSend
                                  ? t('workspace.cancelScheduledEdit', {
                                      defaultValue: 'Cancel schedule and edit',
                                    })
                                  : actionLabels.editDraft
                              }
                              title={
                                message.scheduledSend
                                  ? t('workspace.cancelScheduledEdit', {
                                      defaultValue: 'Cancel schedule and edit',
                                    })
                                  : actionLabels.editDraft
                              }
                              className='size-9 p-0 [&_svg]:size-4'
                              onClick={() => actions.editDraft?.(message)}
                              variant='ghost'
                            >
                              <PenLine aria-hidden='true' />
                            </MessageActionButton>
                          ) : null}
                          {!message.draft && actions.reply ? (
                            <MessageActionButton
                              aria-label={actionLabels.reply}
                              title={actionLabels.reply}
                              className='size-9 p-0 [&_svg]:size-4'
                              onClick={() => actions.reply?.(message)}
                              variant='ghost'
                            >
                              <Reply aria-hidden='true' />
                            </MessageActionButton>
                          ) : null}
                          {!message.draft && actions.forward ? (
                            <MessageActionButton
                              aria-label={actionLabels.forward}
                              title={actionLabels.forward}
                              className='size-9 p-0 [&_svg]:size-4'
                              onClick={() => actions.forward?.(message)}
                              variant='ghost'
                            >
                              <Forward aria-hidden='true' />
                            </MessageActionButton>
                          ) : null}
                          <MessageActionButton
                            aria-label={
                              message.starred
                                ? actionLabels.unstar
                                : actionLabels.star
                            }
                            title={
                              message.starred
                                ? actionLabels.unstar
                                : actionLabels.star
                            }
                            className='size-9 p-0 [&_svg]:size-4'
                            onClick={() => actions.toggleStarred(message)}
                            variant='ghost'
                          >
                            <Star
                              aria-hidden='true'
                              fill={message.starred ? 'currentColor' : 'none'}
                            />
                          </MessageActionButton>
                        </>
                      ) : null}
                      {canEditLabels ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <MessageActionButton
                                aria-label={addLabelText}
                                title={addLabelText}
                                className='size-9 p-0 [&_svg]:size-4'
                                variant='ghost'
                              />
                            }
                          >
                            <Tag aria-hidden='true' />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            aria-label={labels.labels}
                            className='max-h-64 w-64 max-w-(--available-width)'
                          >
                            {availableLabels.map((label) => (
                              <DropdownMenuCheckboxItem
                                key={label.id}
                                label={label.name}
                                checked={message.labelIds.includes(label.id)}
                                closeOnClick={false}
                                onCheckedChange={(assigned) =>
                                  actions?.toggleLabel?.(
                                    message,
                                    label.id,
                                    assigned,
                                  )
                                }
                              >
                                <MailLabelTag label={label} size='md' />
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                      <MessageMoreActions
                        actionLabels={actionLabels}
                        actions={actions}
                        availableLabels={availableLabels}
                        key={`${message.id}:${message.note ?? ''}`}
                        labels={labels}
                        message={message}
                        noteOpen={noteMessage?.id === message.id}
                        onEditNote={(trigger) =>
                          openNoteEditor(message, trigger)
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </header>
              {!collapsedMessageIds.has(message.id) ? (
                <div className='mt-2 space-y-1 text-xs text-muted-foreground'>
                  {(
                    [
                      ['to', 'To', message.to],
                      ['cc', 'Cc', message.cc],
                      ['bcc', 'Bcc', message.bcc],
                    ] as const
                  ).map(([key, fallback, addresses]) => {
                    const value = formatMailAddresses(addresses);
                    const label = t(`workspace.${key}`, {
                      defaultValue: fallback,
                    });
                    return value ? (
                      <p key={key} aria-label={label} className='wrap-anywhere'>
                        {label}: {value}
                      </p>
                    ) : null;
                  })}
                </div>
              ) : null}
              {collapsedMessageIds.has(message.id) ? (
                <p className='mt-3 truncate text-sm text-muted-foreground'>
                  {message.preview ??
                    message.text ??
                    (message.html ? plainMessageBody(message) : '')}
                </p>
              ) : null}
              {message.todo ||
              (!collapsedMessageIds.has(message.id) &&
                messageLabels.length > 0) ? (
                <div className='mt-3 flex flex-wrap items-center gap-1.5'>
                  {message.todo ? (
                    <label className='inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary has-disabled:cursor-default'>
                      <Checkbox
                        checked={false}
                        disabled={!actions?.toggleTodo}
                        aria-label={
                          labels.completeTodo ??
                          t('workspace.completeTodo', {
                            defaultValue: 'Mark as completed',
                          })
                        }
                        onCheckedChange={() => actions?.toggleTodo?.(message)}
                        className='size-3.5 accent-primary'
                      />
                      {labels.todo}
                    </label>
                  ) : null}
                  {!collapsedMessageIds.has(message.id)
                    ? messageLabels.map((label) => (
                        <MailLabelTag key={label.id} label={label} size='md' />
                      ))
                    : null}
                </div>
              ) : null}
              {message.note ? (
                <div className='mt-3 flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm'>
                  <StickyNote
                    aria-hidden='true'
                    className='mt-0.5 size-4 shrink-0 text-muted-foreground'
                  />
                  <p
                    aria-label={labels.note}
                    className={
                      collapsedMessageIds.has(message.id)
                        ? 'min-w-0 flex-1 truncate'
                        : 'min-w-0 flex-1 whitespace-pre-wrap wrap-anywhere'
                    }
                  >
                    {message.note}
                  </p>
                  {actions?.saveNote ? (
                    <MessageActionButton
                      aria-label={editNoteLabel}
                      title={editNoteLabel}
                      className='size-7 shrink-0 self-center p-0 text-muted-foreground [&_svg]:size-4'
                      onClick={(event) =>
                        openNoteEditor(message, event.currentTarget)
                      }
                      variant='ghost'
                    >
                      <PenLine aria-hidden='true' />
                    </MessageActionButton>
                  ) : null}
                </div>
              ) : null}
              {!collapsedMessageIds.has(message.id) ? (
                <MessageBody
                  message={message}
                  title={message.subject || labels.noSubject}
                />
              ) : null}
              {!collapsedMessageIds.has(message.id) &&
              visibleAttachments.length > 0 ? (
                <div className='mt-4 border-t pt-3 text-xs text-muted-foreground'>
                  <div className='mb-2 flex items-center gap-2'>
                    <Paperclip aria-hidden='true' className='size-3.5' />
                    {labels.attachmentCount(visibleAttachments.length)}
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {visibleAttachments.map((attachment) =>
                      actions?.downloadAttachment && actionLabels ? (
                        <Button
                          aria-label={`${actionLabels.download} ${attachment.fileName}`}
                          className='h-auto max-w-full justify-start gap-2 px-3 py-2'
                          key={attachment.id}
                          onClick={() =>
                            actions.downloadAttachment?.(message, attachment)
                          }
                          variant='outline'
                        >
                          <Download className='size-3.5 shrink-0' />
                          <span className='truncate'>
                            {attachment.fileName}
                          </span>
                        </Button>
                      ) : (
                        <span
                          className='inline-flex max-w-full items-center gap-2 rounded-md border px-3 py-2'
                          key={attachment.id}
                        >
                          <Paperclip className='size-3.5 shrink-0' />
                          <span className='truncate'>
                            {attachment.fileName}
                          </span>
                        </span>
                      ),
                    )}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {latestMessage && actionLabels && (actions?.reply || actions?.forward) ? (
        <footer className='flex flex-wrap items-center gap-2 px-5 py-4'>
          {actions.reply ? (
            <Button
              aria-label={t('workspace.replyLatest', {
                defaultValue: 'Reply to latest message',
              })}
              disabled={loading}
              onClick={() => actions.reply?.(latestMessage)}
              type='button'
              variant='outline'
            >
              <Reply aria-hidden='true' className='size-4' />
              {actionLabels.reply}
            </Button>
          ) : null}
          {actions.forward ? (
            <Button
              aria-label={t('workspace.forwardLatest', {
                defaultValue: 'Forward latest message',
              })}
              disabled={loading}
              onClick={() => actions.forward?.(latestMessage)}
              type='button'
              variant='outline'
            >
              <Forward aria-hidden='true' className='size-4' />
              {actionLabels.forward}
            </Button>
          ) : null}
        </footer>
      ) : null}
      <Dialog
        open={Boolean(noteMessage)}
        onOpenChange={(open) => {
          if (!open) setNoteEditor(undefined);
        }}
      >
        <DialogContent
          className='max-w-lg'
          finalFocus={noteTriggerRef}
          closeLabel={labels.close ?? 'Close'}
        >
          <DialogHeader>
            <DialogTitle>{labels.note}</DialogTitle>
          </DialogHeader>
          <Textarea
            aria-label={labels.note}
            autoFocus
            className='mt-4 min-h-28'
            onChange={(event) => {
              const value = event.target.value;
              setNoteEditor((current) =>
                current ? { ...current, value } : current,
              );
            }}
            placeholder={labels.notePlaceholder}
            value={noteEditor?.value ?? ''}
          />
          <DialogFooter>
            <Button
              disabled={noteEditor?.value === (noteMessage?.note ?? '')}
              onClick={() => {
                if (noteMessage && noteEditor) {
                  actions?.saveNote?.(noteMessage, noteEditor.value);
                  setNoteEditor(undefined);
                }
              }}
              type='button'
            >
              {labels.saveNote}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function MessageActionButton({ title, ...props }: ButtonProps): ReactElement {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger render={<Button {...props} />} />
        <TooltipContent className='max-w-xs' side='bottom' sideOffset={4}>
          {title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MessageMoreActions({
  actionLabels,
  actions,
  availableLabels,
  labels,
  message,
  noteOpen,
  onEditNote,
}: {
  readonly actionLabels: MailConversationViewProps['actionLabels'];
  readonly actions: NonNullable<MailConversationViewProps['actions']>;
  readonly availableLabels: readonly MailLabel[];
  readonly labels: MailConversationViewLabels;
  readonly message: MailMessage;
  readonly noteOpen: boolean;
  readonly onEditNote: (trigger: HTMLButtonElement | null) => void;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const assignedLabelCount = availableLabels.filter((label) =>
    message.labelIds.includes(label.id),
  ).length;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={moreButtonRef}
          render={
            <MessageActionButton
              aria-label={labels.more ?? 'More actions'}
              title={labels.more ?? 'More actions'}
              className='size-9 p-0 [&_svg]:size-4'
              variant='ghost'
            />
          }
        >
          <MoreHorizontal aria-hidden='true' />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          finalFocus={!(noteOpen || labelsOpen)}
          className='[&_svg]:size-4 [&_svg]:shrink-0'
        >
          {actions.saveNote ? (
            <DropdownMenuItem onClick={() => onEditNote(moreButtonRef.current)}>
              <StickyNote aria-hidden='true' />
              <span className='flex-1'>{labels.note}</span>
              {message.note ? (
                <Check aria-hidden='true' className='text-primary' />
              ) : null}
            </DropdownMenuItem>
          ) : null}
          {actions.toggleTodo ? (
            <DropdownMenuItem
              role='menuitemcheckbox'
              aria-checked={Boolean(message.todo)}
              onClick={() => actions.toggleTodo?.(message)}
            >
              <CheckSquare2 aria-hidden='true' />
              <span className='flex-1'>
                {message.todo
                  ? (labels.cancelTodo ??
                    t('workspace.cancelTodo', {
                      defaultValue: 'Remove to-do mark',
                    }))
                  : (labels.markTodo ??
                    t('workspace.markTodo', {
                      defaultValue: 'Mark as to do',
                    }))}
              </span>
              {message.todo ? (
                <Check aria-hidden='true' className='text-primary' />
              ) : null}
            </DropdownMenuItem>
          ) : null}
          {availableLabels.length > 0 && actions.toggleLabel ? (
            <DropdownMenuItem onClick={() => setLabelsOpen(true)}>
              <Tag aria-hidden='true' />
              <span className='flex-1'>{labels.labels}</span>
              {assignedLabelCount > 0 ? (
                <span className='text-xs text-muted-foreground'>
                  {assignedLabelCount}
                </span>
              ) : null}
            </DropdownMenuItem>
          ) : null}
          {actionLabels ? (
            <>
              {actions.saveNote ||
              actions.toggleTodo ||
              (availableLabels.length > 0 && actions.toggleLabel) ? (
                <div role='separator' className='my-1 h-px bg-border' />
              ) : null}
              <DropdownMenuItem onClick={() => actions.toggleRead(message)}>
                {message.read ? (
                  <Mail aria-hidden='true' />
                ) : (
                  <MailOpen aria-hidden='true' />
                )}
                {message.read ? actionLabels.markUnread : actionLabels.markRead}
              </DropdownMenuItem>
              {actions.archive ? (
                <DropdownMenuItem onClick={() => actions.archive?.(message)}>
                  <Archive aria-hidden='true' />
                  {actionLabels.archive}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                disabled={
                  actions.canDelete ? !actions.canDelete(message) : false
                }
                className='text-destructive focus:text-destructive'
                onClick={() => actions.delete(message)}
              >
                <Trash2 aria-hidden='true' />
                {actionLabels.delete}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={labelsOpen} onOpenChange={setLabelsOpen}>
        <DialogContent
          finalFocus={moreButtonRef}
          closeLabel={labels.close ?? 'Close'}
        >
          <DialogHeader>
            <DialogTitle>{labels.labels}</DialogTitle>
          </DialogHeader>
          <fieldset className='mt-4 grid gap-2'>
            <legend className='sr-only'>{labels.labels}</legend>
            {availableLabels.map((label) => {
              const assigned = message.labelIds.includes(label.id);
              return (
                <label
                  className='flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50'
                  key={label.id}
                >
                  <Checkbox
                    checked={assigned}
                    onCheckedChange={(checked) =>
                      actions.toggleLabel?.(message, label.id, checked === true)
                    }
                  />
                  <MailLabelTag label={label} size='md' />
                </label>
              );
            })}
          </fieldset>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MessageBody({
  message,
  title,
}: {
  readonly message: MailMessage;
  readonly title: string;
}): ReactElement {
  return <MailMessageContent message={message} title={title} />;
}

function plainMessageBody(message: MailMessage): string {
  if (message.text) return message.text;
  if (message.preview) return message.preview;
  if (!message.html) return '';
  if (typeof DOMParser === 'undefined') {
    return message.html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  const document = new DOMParser().parseFromString(message.html, 'text/html');
  for (const element of document.querySelectorAll('script, style')) {
    element.remove();
  }
  return document.body.textContent?.trim() ?? '';
}

function formatFullDate(value?: string, locale?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
