import { useConversationActions } from './conversation-actions.js';
import {
  ChatExtensionsContext,
  chatFeedback,
  chatIsRunning,
  useChatScroll,
  newConversationAgent,
  timelineOrder,
  useAgentText,
  useChatAgents,
  useChatModels,
  useChatPanel,
  useConversation,
  useConversationMessages,
  useChatStream,
  useChatController,
  useSendMessage,
  type ChatTimelineItem,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  ConversationDetail,
  ConversationMessage,
} from '@nocobase/app-plugin-agents/shared/conversations';
import type { ModelRef } from '@nocobase/app-plugin-agents/shared/models';
import { BotMessageSquareIcon, PaperclipIcon } from 'lucide-react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { ChatInputAvailability } from './input-availability.js';

import { Button } from '#components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#components/ui/empty';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';
import { cn } from 'cn';

import { NewChatChoice } from './agent-choice.js';
import { AgentNotice } from './agent-status.js';
import { errorStatus, useChatTranslation } from './chat-i18n.js';
import { LoadError } from './chat-ui.js';
import { Composer } from './composer.js';
import { LiveSteps, TurnAnnouncer } from './live-steps.js';
import { MessageItem, PendingItem } from './message-item.js';

const NO_ITEMS: readonly ChatTimelineItem[] = [];

function noTimelineItems(): readonly ChatTimelineItem[] {
  return NO_ITEMS;
}

export type ConversationVariant = 'panel' | 'page';

/** The full-page view's column: the messages and the composer at a readable width, centred. */
export const PAGE_COLUMN = 'mx-auto w-full max-w-3xl px-4 sm:px-6';

export function ConversationView({
  conversationId,
  className,
  variant = 'panel',
  inputAvailability,
}: {
  readonly conversationId: string | null;
  readonly className?: string;
  /** `page`: the full-page view, its messages and composer centred at a readable width. */
  readonly variant?: ConversationVariant;
  readonly inputAvailability?: ChatInputAvailability;
}): ReactElement {
  const { t } = useChatTranslation();
  const panel = useChatPanel();
  const detail = useConversation(conversationId);
  // A conversation its first message just created keeps the same body (no skeleton, no remount), so the composer
  // keeps its focus and the message stays where it is.
  const [created, setCreated] = useState<string | null>(null);
  const continuing = conversationId !== null && created === conversationId;
  // Each "new conversation" is a fresh body.
  const [freshKey, setFreshKey] = useState(0);
  const [seenId, setSeenId] = useState(conversationId);
  if (seenId !== conversationId) {
    setSeenId(conversationId);
    if (conversationId === null) setFreshKey((value) => value + 1);
  }

  if (conversationId && detail.isError && !detail.data) {
    const status = errorStatus(detail.error);
    const gone = status === 403 || status === 404;
    return gone ? (
      <div className={variant === 'page' ? cn(PAGE_COLUMN, 'py-10') : 'p-1'}>
        <Empty className='min-h-48 border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <BotMessageSquareIcon />
            </EmptyMedia>
            <EmptyTitle>{t('chat.notFound')}</EmptyTitle>
            <EmptyDescription>{t('chat.notFoundDescription')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant='outline'
              onClick={() => panel.selectConversation(null)}
            >
              {t('chat.newConversation')}
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    ) : (
      <div
        className={variant === 'page' ? cn(PAGE_COLUMN, 'py-10') : undefined}
      >
        <LoadError
          title={t('chat.loadFailed')}
          error={detail.error}
          onRetry={() => void detail.refetch()}
        />
      </div>
    );
  }
  if (conversationId && !continuing && !detail.data) {
    return (
      <div
        role='status'
        aria-label={t('chat.loading')}
        className={cn(
          'flex flex-col gap-3',
          variant === 'page' ? cn(PAGE_COLUMN, 'py-6') : 'p-1',
        )}
      >
        <Skeleton className='h-12 w-3/4' />
        <Skeleton className='ml-auto h-10 w-2/3' />
        <Skeleton className='h-16 w-4/5' />
      </div>
    );
  }
  return (
    <ConversationBody
      key={
        continuing || conversationId === null
          ? `new-${freshKey}`
          : conversationId
      }
      conversationId={conversationId}
      conversation={detail.data ?? null}
      onCreated={(id) => setCreated(id)}
      className={className}
      variant={variant}
      inputAvailability={inputAvailability}
    />
  );
}

interface Entry {
  readonly key: string;
  readonly at: string;
  /** Messages before other items at the same time. */
  readonly rank: number;
  readonly node: ReactNode;
}

function ConversationBody({
  conversationId,
  conversation,
  onCreated,
  className,
  variant,
  inputAvailability,
}: {
  readonly conversationId: string | null;
  readonly conversation: ConversationDetail | null;
  readonly onCreated: (conversationId: string) => void;
  readonly className?: string;
  readonly variant: ConversationVariant;
  readonly inputAvailability?: ChatInputAvailability;
}): ReactElement {
  const { t } = useChatTranslation();
  const panel = useChatPanel();
  const extensions = useContext(ChatExtensionsContext);
  const actions = useConversationActions();
  const agents = useChatAgents(panel.open);
  const catalog = useChatModels(panel.open && !conversation);
  const [chosenModel, setChosenModel] = useState<ModelRef | null>(null);
  const run = conversation?.run ?? null;
  const running = chatIsRunning(conversation);
  const chatController = useChatController();
  const stream = useChatStream(conversation?.execution ? conversationId : null);
  const messages = useConversationMessages(
    conversationId,
    running,
    Boolean(conversation?.execution),
  );
  const [refreshError, setRefreshError] = useState<unknown>(null);
  const refreshHistory = () => {
    messages.fetchNewer();
    if (conversationId)
      void chatController
        .refresh(conversationId)
        .then(() => setRefreshError(null), setRefreshError);
  };
  const creationObserverRef = useRef<(() => void) | null>(null);
  useEffect(() => () => creationObserverRef.current?.(), []);
  const useTimelineItems = extensions.useTimelineItems ?? noTimelineItems;
  const revision = messages.lastSeq * 10 + (running ? 1 : 0);
  const timeline: readonly ChatTimelineItem[] = useTimelineItems(
    conversationId ?? '',
    revision,
  );
  const target = conversation
    ? null
    : newConversationAgent(agents.data, panel.newAgentId);

  // Leave default resolution on the server until a model is explicitly chosen.
  const model = chosenModel;
  const hasChatModels = Boolean(
    catalog.data?.some((service) =>
      service.models.some((item) => item.kind === 'chat'),
    ),
  );
  // A removed explicit selection must not silently fall back to another model.
  const modelOffered = Boolean(
    model &&
    catalog.data?.some(
      (service) =>
        service.name === model.modelService &&
        service.models.some(
          (item) => item.kind === 'chat' && item.value === model.model,
        ),
    ),
  );
  const nativeReady =
    catalog.isSuccess &&
    !catalog.isFetching &&
    (model ? modelOffered : hasChatModels);

  const selectedId = conversation?.agent.id ?? target?.id ?? 'online';
  const sendAvailability =
    selectedId === 'online'
      ? {
          ...inputAvailability,
          canSend:
            (inputAvailability?.canSend ?? true) &&
            (conversation !== null || nativeReady),
        }
      : {
          canSend:
            conversation?.availability.online ??
            target?.availability.online ??
            false,
        };

  const { selectConversation, resetSource, source, focusComposer } = panel;
  const created = useCallback(
    (detail: ConversationDetail) => {
      onCreated(detail.id);
      selectConversation(detail.id);
      resetSource();
    },
    [onCreated, selectConversation, resetSource],
  );
  const send = useSendMessage({
    conversationId,
    agentId: conversation ? conversation.agent.id : (target?.id ?? null),
    source,
    dispatch: messages.dispatch,
    onCreated: created,
    ...(target?.id === 'online' && model ? { selectedModel: model } : {}),
  });

  // Viewed: tell the server the agent's latest replies were read.
  const { markRead } = actions;
  const unread = conversation !== null && !conversation.read;
  useEffect(() => {
    if (panel.open && unread && conversationId) markRead(conversationId);
  }, [panel.open, unread, conversationId, markRead]);

  const text = useAgentText();
  const names = useMemo(() => {
    const byId = new Map<string, string>();
    for (const agent of agents.data ?? []) byId.set(agent.id, text.name(agent));
    for (const agent of [conversation?.agent, conversation?.fallbackFrom]) {
      const name = agent ? text.name(agent) : null;
      if (agent && name) byId.set(agent.id, name);
    }
    return byId;
  }, [agents.data, conversation?.agent, conversation?.fallbackFrom, text]);
  const ownName = conversation ? text.name(conversation.agent) : null;
  const agentName = (agentId: string | undefined): string =>
    (agentId ? names.get(agentId) : undefined) ??
    ownName ??
    t('chat.agentGone');
  // A new conversation with no agent to go to yet (none chosen, no default) is not a deleted agent.
  const currentName =
    ownName ??
    (target ? text.name(target) : null) ??
    (conversation ? t('chat.agentGone') : t('chat.anyAgent'));

  const entries: Entry[] = timelineOrder([
    ...messages.items.map((message: ConversationMessage): Entry => ({
      key: `m-${message.id}`,
      at: message.createdAt,
      rank: 0,
      node: (
        <MessageItem
          key={`m-${message.id}`}
          message={message}
          agentName={agentName}
          extra={extensions.renderMessageExtra?.(message)}
        />
      ),
    })),
    ...timeline.map((item): Entry => ({
      key: `x-${item.key}`,
      at: item.at,
      rank: 1,
      node: (
        <li key={`x-${item.key}`} data-chat-item={item.key}>
          {item.node}
        </li>
      ),
    })),
  ]);

  // Follow the end of the log as messages arrive; keep the place when older ones are loaded above.
  const listRef = useChatScroll(messages.items[0]?.seq);
  const stopping =
    conversationId !== null &&
    chatController.isStopping(conversationId) &&
    running;
  const afterUser =
    messages.items.filter((item) => item.role === 'user').at(-1)?.seq ??
    Infinity;
  const feedback = chatFeedback({
    execution: conversation?.execution,
    lastSeq: messages.lastSeq,
    running,
    stopping,
    submission: chatController.submissions
      .snapshot()
      .filter(
        (record) =>
          record.conversationId === conversationId &&
          (conversationId !== null ||
            record.editorKey === `registry:${source}:new`),
      )
      .at(-1),
    stream,
    hasOutput: messages.items.some(
      (item) =>
        item.seq > afterUser &&
        item.role !== 'user' &&
        item.content.content.trim().length > 0,
    ),
  });
  const busyFeedback =
    feedback === 'sending' ||
    feedback === 'waiting' ||
    feedback === 'thinking' ||
    feedback === 'stopping';
  const feedbackNotice = feedback ? (
    <div
      role='status'
      aria-live='polite'
      className='flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground'
      data-chat-feedback={feedback}
    >
      {busyFeedback ? (
        <Spinner aria-hidden='true' className='shrink-0' />
      ) : null}
      {t(`chat.feedback.${feedback}`)}
    </div>
  ) : null;

  const empty =
    entries.length === 0 &&
    messages.pending.length === 0 &&
    !busyFeedback &&
    !running &&
    !messages.error &&
    (conversationId === null || messages.loaded);
  const page = variant === 'page';

  // Files dropped anywhere on the conversation go to the composer, which uploads them.
  const addFilesRef = useRef<((files: readonly File[]) => void) | null>(null);
  const registerAddFiles = useCallback(
    (add: (files: readonly File[]) => void) => {
      addFilesRef.current = add;
      return () => {
        if (addFilesRef.current === add) addFilesRef.current = null;
      };
    },
    [],
  );
  const [dragging, setDragging] = useState(false);
  const dragDepthRef = useRef(0);
  const carriesFiles = (event: DragEvent<HTMLElement>): boolean =>
    addFilesRef.current !== null && event.dataTransfer.types.includes('Files');

  return (
    <section
      className={cn(
        'relative flex h-full min-h-0 flex-col',
        page ? 'gap-0' : 'gap-3',
        className,
      )}
      aria-label={conversation?.title ?? t('chat.newConversation')}
      data-testid='chat-conversation'
      onDragEnter={(event) => {
        if (!carriesFiles(event)) return;
        dragDepthRef.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={(event) => {
        if (!carriesFiles(event)) return;
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setDragging(false);
      }}
      onDrop={(event) => {
        dragDepthRef.current = 0;
        setDragging(false);
        if (!carriesFiles(event)) return;
        event.preventDefault();
        addFilesRef.current?.(Array.from(event.dataTransfer.files));
      }}
    >
      {dragging ? (
        <div
          className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary/50 bg-background/80'
          data-testid='chat-drop-zone'
        >
          <p className='flex items-center gap-2 text-sm font-medium'>
            <PaperclipIcon className='size-4' aria-hidden='true' />
            {t('chat.attachments.drop')}
          </p>
        </div>
      ) : null}
      {/* Positioned so absolutely placed content (sr-only text, live regions) stays inside the scroller instead of growing the page. */}
      <div
        ref={listRef}
        role='log'
        aria-label={t('chat.messages')}
        tabIndex={0}
        className='relative min-h-0 flex-1 overflow-y-auto'
      >
        <div
          className={cn(
            'flex min-h-full flex-col',
            page && cn(PAGE_COLUMN, 'py-6'),
          )}
        >
          {messages.error ? (
            <LoadError
              title={t('chat.loadFailed')}
              error={messages.error}
              onRetry={messages.fetchNewer}
            />
          ) : conversationId && !messages.loaded ? (
            <div role='status' aria-label={t('chat.loading')}>
              <Skeleton className='h-16' />
            </div>
          ) : null}
          {empty ? (
            <div className='flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center'>
              <BotMessageSquareIcon
                className='size-8 text-muted-foreground'
                aria-hidden='true'
              />
              <p className='text-sm font-medium'>
                {t('chat.emptyTitle', { name: currentName })}
              </p>
              <p className='text-sm text-muted-foreground'>
                {t('chat.emptyDescription')}
              </p>
            </div>
          ) : (
            <>
              {messages.hasMore ? (
                <div className='flex justify-center pb-2'>
                  <Button
                    variant='ghost'
                    size='xs'
                    disabled={messages.loadingOlder}
                    onClick={messages.loadOlder}
                  >
                    {t('chat.olderMessages')}
                  </Button>
                </div>
              ) : null}
              <ol
                aria-label={t('chat.messages')}
                className='flex flex-col gap-4 py-1'
              >
                {entries.map((entry) => entry.node)}
                {messages.pending.map((message) => (
                  <PendingItem
                    key={message.clientId}
                    message={message}
                    onContinue={
                      chatController.submissions
                        .snapshot()
                        .some(
                          (record) =>
                            record.clientId === message.clientId &&
                            record.status === 'unknown' &&
                            !record.released,
                        )
                        ? () => {
                            chatController.submissions.releaseUnknown(
                              message.clientId,
                            );
                            focusComposer();
                          }
                        : undefined
                    }
                    onCheck={conversationId ? refreshHistory : undefined}
                    onDiscard={() => {
                      messages.dispatch({
                        type: 'discard',
                        clientId: message.clientId,
                      });
                    }}
                    retryDisabled={
                      sendAvailability?.canSend === false || running
                    }
                    onRecoverCreation={
                      chatController.submissions
                        .snapshot()
                        .some(
                          (record) =>
                            record.clientId === message.clientId &&
                            record.status === 'creationUnknown',
                        )
                        ? () => {
                            if (sendAvailability?.canSend === false || running)
                              return;
                            creationObserverRef.current?.();
                            const off = chatController.submissions.onUpdated(
                              (detail, record, wasCreated) => {
                                if (
                                  record.clientId !== message.clientId ||
                                  !wasCreated
                                )
                                  return;
                                created(detail);
                                off();
                              },
                            );
                            creationObserverRef.current = off;
                            chatController.submissions.resumeCreation(
                              message.clientId,
                              null,
                            );
                          }
                        : undefined
                    }
                    onRetry={() => {
                      if (sendAvailability?.canSend === false || running)
                        return;
                      send({
                        content: message.content,
                        context: message.context,
                        ...(message.attachments
                          ? { attachments: message.attachments }
                          : {}),
                        clientId: message.clientId,
                      });
                    }}
                  />
                ))}
                {run && !conversation?.execution ? (
                  <li>
                    <LiveSteps
                      key={run.id}
                      run={run}
                      agentName={currentName}
                      mode={conversation?.mode ?? 'runner'}
                    />
                  </li>
                ) : null}
                {/* Waiting belongs where the next reply will appear, not beside the composer. */}
                {busyFeedback ? <li>{feedbackNotice}</li> : null}
              </ol>
            </>
          )}
        </div>
      </div>
      {refreshError ? (
        <LoadError
          title={t('chat.loadFailed')}
          error={refreshError}
          onRetry={refreshHistory}
        />
      ) : null}
      {stream?.phase === 'interrupted' ? (
        <div role='alert' className='px-3 py-2 text-sm text-muted-foreground'>
          {t('chat.connectionUnknown')}{' '}
          <Button variant='outline' size='sm' onClick={refreshHistory}>
            {t('chat.refreshHistory')}
          </Button>
        </div>
      ) : null}
      {busyFeedback ? null : feedbackNotice}
      <TurnAnnouncer running={running} />
      <div className={page ? cn(PAGE_COLUMN, 'pt-2 pb-4') : undefined}>
        {sendAvailability?.notice}
        <Composer
          variant={variant}
          disabled={
            sendAvailability?.canSend === false ||
            running ||
            Boolean(conversation && !conversation.availability.online) ||
            chatController.submissions.blocked(
              conversationId,
              `registry:${source}:${conversationId ?? 'new'}`,
            ) ||
            Boolean(conversation && !conversation.execution)
          }
          running={running}
          stopping={stopping}
          onStop={() => {
            if (conversationId) actions.stop.mutate(conversationId);
          }}
          onSend={(content, context, attachments) => {
            if (sendAvailability?.canSend === false) return false;
            const accepted = send({ content, context, attachments });
            if (accepted) focusComposer();
            return accepted;
          }}
          registerAddFiles={registerAddFiles}
          toolbar={
            conversation ? null : (
              // Before the first message: who the conversation goes to.
              <NewChatChoice
                agents={agents.data ?? []}
                agent={target}
                services={catalog.data ?? []}
                model={model}
                modelsDisabled={
                  catalog.isFetching || !catalog.isSuccess || !hasChatModels
                }
                onModelChange={(selected) => {
                  setChosenModel(selected);
                  selectConversation(null, 'online');
                  focusComposer();
                }}
                onAgentChange={(agentId) => {
                  selectConversation(null, agentId);
                  focusComposer();
                }}
              />
            )
          }
          notice={
            conversation ? (
              <AgentNotice conversation={conversation} />
            ) : target === null && agents.isSuccess ? (
              (agents.data?.length ?? 0) > 0 ? (
                <p
                  className='text-xs text-muted-foreground'
                  data-testid='chat-choose-agent'
                >
                  {t('chat.chooseAgent')}
                </p>
              ) : (
                <p
                  className='text-xs text-destructive'
                  data-testid='chat-no-agent'
                >
                  {t('chat.noAgent')}
                </p>
              )
            ) : null
          }
        />
      </div>
    </section>
  );
}
