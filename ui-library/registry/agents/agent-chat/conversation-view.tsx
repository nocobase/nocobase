/**
 * One conversation, the panel's main view: the messages as a log (older pages on demand), what an application adds
 * among them (plan cards), the agent at work, notices about who answers, and the composer. Without a conversation
 * (`conversationId` null) it is a new one: an empty log whose first message creates it on the server, and the
 * composer's toolbar chooses its agent (`NewChatChoice`) among the agents of the panel's mode (`useChatMode`), starting
 * with the one last used.
 */
import {
  ChatExtensionsContext,
  getAIToolSourceMessage,
  appUIMessageText,
  chatMessageSegments,
  chatFeedback,
  chatIsRunning,
  useChatScroll,
  newConversationAgent,
  timelineOrder,
  useAgentText,
  useChatAgents,
  useChatModels,
  useConversationModel,
  useChatPanel,
  useConversation,
  useConversationActions,
  useConversationMessages,
  useChatStream,
  useChatController,
  useSendMessage,
  type ChatTimelineItem,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationDetail } from '@nocobase/app-plugin-agents/shared/conversations';
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

import { NewChatChoice, ConversationModelChoice } from './agent-choice.js';
import { AgentNotice } from './agent-status.js';
import { errorStatus, useChatTranslation } from './chat-i18n.js';
import { useChatMode } from './chat-mode.js';
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
}: {
  readonly conversationId: string | null;
  readonly className?: string;
  /** `page`: the full-page view, its messages and composer centred at a readable width. */
  readonly variant?: ConversationVariant;
}): ReactElement {
  const { t } = useChatTranslation();
  const panel = useChatPanel();
  const detail = useConversation(conversationId);
  // A conversation its first message just created keeps the same body (no skeleton, no remount), so the composer
  // keeps its focus and the message stays where it is.
  const [created, setCreated] = useState<string | null>(null);
  const continuing = conversationId !== null && created === conversationId;
  // An explicit fresh blank chat also drops its optimistic timeline and pending creation observer.
  // Existing conversations keep their message/stream owner; only their composer follows the revision.
  const [freshKey, setFreshKey] = useState(0);
  const [seenId, setSeenId] = useState(conversationId);
  const [seenRevision, setSeenRevision] = useState(panel.composerRevision);
  if (seenId !== conversationId || seenRevision !== panel.composerRevision) {
    setSeenId(conversationId);
    setSeenRevision(panel.composerRevision);
    if (conversationId === null) {
      setFreshKey((value) => value + 1);
      setCreated(null);
    }
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
    />
  );
}

interface Entry {
  readonly key: string;
  readonly at: string;
  /** Messages before other items at the same time. */
  readonly rank: number;
  readonly seq?: number;
  readonly node: ReactNode;
}

function ConversationBody({
  conversationId,
  conversation,
  onCreated,
  className,
  variant,
}: {
  readonly conversationId: string | null;
  readonly conversation: ConversationDetail | null;
  readonly onCreated: (conversationId: string) => void;
  readonly className?: string;
  readonly variant: ConversationVariant;
}): ReactElement {
  const { t } = useChatTranslation();
  const panel = useChatPanel();
  const extensions = useContext(ChatExtensionsContext);
  const actions = useConversationActions();
  const agents = useChatAgents(panel.open);
  const nativeConversation =
    conversation?.agent.id === 'online' && Boolean(conversation.execution);
  const catalog = useChatModels(
    panel.open && (!conversation || nativeConversation),
  );
  const {
    configuration,
    select: selectModel,
    changing: changingModel,
  } = useConversationModel(
    nativeConversation ? conversation.id : null,
    panel.open,
  );
  const [chosenModel, setChosenModel] = useState<ModelRef | null>(null);
  const modelChangeBlocked =
    changingModel ||
    (nativeConversation &&
      (selectModel.isError ||
        configuration.isFetching ||
        !configuration.isSuccess));
  const run = conversation?.run ?? null;
  const stream = useChatStream(conversation?.execution ? conversationId : null);
  const receiving =
    stream?.status === 'submitted' || stream?.status === 'streaming';
  const running = chatIsRunning(conversation) || receiving;
  const chatController = useChatController();
  const [saveError, setSaveError] = useState<unknown>(null);
  const messages = useConversationMessages(conversationId);
  const useTimelineItems = extensions.useTimelineItems ?? noTimelineItems;
  const revision =
    messages.items.reduce(
      (sum, message) => sum + (message.metadata?.revision ?? 0),
      messages.lastSeq,
    ) + (running ? 1 : 0);
  const timeline: readonly ChatTimelineItem[] = useTimelineItems(
    conversationId ?? '',
    revision,
  );
  const chatMode = useChatMode();
  // A new conversation goes to an agent of the panel's mode; the online agent is the only one of its mode.
  const offered = agents.data ? chatMode.agents : undefined;
  const target = conversation
    ? null
    : (newConversationAgent(
        offered,
        panel.newAgentId,
        panel.lastAgentId ?? null,
      ) ?? (chatMode.mode === 'online' ? (offered?.[0] ?? null) : null));

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

  const { selectConversation, resetSource, source, focusComposer } = panel;
  const created = useCallback(
    (detail: ConversationDetail) => {
      onCreated(detail.id);
      selectConversation(detail.id, undefined, { preserveComposer: true });
      resetSource();
    },
    [onCreated, selectConversation, resetSource],
  );
  const send = useSendMessage({
    conversationId,
    agentId: conversation ? conversation.agent.id : (target?.id ?? null),
    source,
    editorRevision: panel.composerRevision,
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

  const segments = chatMessageSegments(messages.items);
  const segmented = new Set(segments.map((segment) => segment.message));
  const extraEntries: Entry[] = extensions.renderMessageExtra
    ? messages.items.flatMap((message): Entry[] => {
        if (segmented.has(message)) return [];
        const extra = extensions.renderMessageExtra?.(message);
        if (extra == null) return [];
        const source = message.metadata?.sourceRecords?.at(-1);
        return [
          {
            key: `extra-${message.id}`,
            at: source?.createdAt ?? message.metadata?.createdAt ?? '',
            seq: source?.seq ?? message.metadata?.seq,
            rank: 0,
            node: (
              <li
                key={`extra-${message.id}`}
                className='min-w-0 max-w-full overflow-x-auto wrap-anywhere'
                data-message-id={message.id}
              >
                {extra}
              </li>
            ),
          },
        ];
      })
    : [];
  const entries: Entry[] = timelineOrder([
    ...extraEntries,
    ...segments.map((segment): Entry => ({
      key: `m-${segment.key}`,
      at: segment.at,
      seq: segment.seq,
      rank: 0,
      node: (
        <MessageItem
          key={`m-${segment.key}`}
          message={segment.message}
          sourceMessage={getAIToolSourceMessage(
            segment.message,
            messages.items,
          )}
          readOnly={!conversationId || Boolean(conversation?.archivedAt)}
          segment={segment}
          streaming={
            receiving && segment.message.id === messages.items.at(-1)?.id
          }
          agentName={agentName}
          extra={
            segment.last
              ? extensions.renderMessageExtra?.(segment.message)
              : null
          }
          approvalDisabled={receiving}
          onApproval={
            conversationId
              ? (input) => chatController.approve(conversationId, input)
              : undefined
          }
        />
      ),
    })),
    ...timeline.map((item): Entry => ({
      key: `x-${item.key}`,
      at: item.at,
      rank: 1,
      node: (
        <li
          key={`x-${item.key}`}
          data-chat-item={item.key}
          className='min-w-0 max-w-full overflow-x-auto wrap-anywhere'
        >
          {item.node}
        </li>
      ),
    })),
  ]);

  // Follow the end of the log as messages arrive; keep the place when older ones are loaded above.
  const listRef = useChatScroll(segments[0]?.seq);
  const stopping =
    conversationId !== null &&
    chatController.isStopping(conversationId) &&
    running;
  const afterUser =
    messages.items.filter((item) => item.role === 'user').at(-1)?.metadata
      ?.seq ?? Infinity;
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
        (item.metadata?.seq ?? Infinity) > afterUser &&
        item.role === 'assistant' &&
        (appUIMessageText(item).trim().length > 0 ||
          item.parts.some(
            (part) =>
              (part.type === 'reasoning' && part.text.trim().length > 0) ||
              part.type === 'dynamic-tool' ||
              part.type.startsWith('tool-') ||
              part.type === 'file',
          )),
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
    !running;
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
        'relative flex h-full min-h-0 min-w-0 flex-col',
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
        className='relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto'
        data-testid='chat-message-scroll'
      >
        <div
          className={cn(
            'flex min-h-full min-w-0 flex-col',
            page && cn(PAGE_COLUMN, 'py-6'),
          )}
        >
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
                role='log'
                aria-label={t('chat.messages')}
                className='flex min-w-0 flex-col gap-4 py-1'
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
                    onCheck={() => {
                      if (conversationId)
                        void chatController.resume(conversationId);
                    }}
                    onDiscard={() =>
                      messages.dispatch({
                        type: 'discard',
                        clientId: message.clientId,
                      })
                    }
                    onRetry={() =>
                      void send({
                        content: message.content,
                        context: message.context,
                        ...(message.attachments
                          ? { attachments: message.attachments }
                          : {}),
                        clientId: message.clientId,
                      })
                    }
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
      {stream?.error ? (
        <div role='alert' className='px-3 py-2 text-sm text-muted-foreground'>
          {t('chat.connectionUnknown')}{' '}
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              messages.fetchNewer();
              if (conversationId) void chatController.resume(conversationId);
            }}
          >
            {t('chat.refreshHistory')}
          </Button>
          {conversationId ? (
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                void chatController
                  .finalize(conversationId)
                  .then(() => setSaveError(null), setSaveError)
              }
            >
              {t('chat.retrySaving')}
            </Button>
          ) : null}
        </div>
      ) : null}
      {busyFeedback ? null : feedbackNotice}
      <TurnAnnouncer running={running} />
      <div className={page ? cn(PAGE_COLUMN, 'pt-2 pb-4') : undefined}>
        {nativeConversation && (configuration.error || selectModel.error) ? (
          <LoadError
            title={t(
              selectModel.error
                ? 'chat.agents.modelChangeFailed'
                : 'chat.agents.modelLoadFailed',
            )}
            error={selectModel.error ?? configuration.error}
            onRetry={() => {
              selectModel.reset();
              void configuration.refetch();
            }}
          />
        ) : null}
        {saveError ? (
          <LoadError
            title={t('chat.loadFailed')}
            error={saveError}
            onRetry={() => {
              if (conversationId)
                void chatController
                  .finalize(conversationId)
                  .then(() => setSaveError(null), setSaveError);
            }}
          />
        ) : null}
        <Composer
          variant={variant}
          disabled={
            modelChangeBlocked ||
            (!conversation && target?.id === 'online' && !nativeReady) ||
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
            if (modelChangeBlocked) return false;
            if (!conversation && target?.id === 'online' && !nativeReady)
              return false;
            const accepted = send({ content, context, attachments });
            if (accepted) {
              // The next new conversation starts with the agent this one went to.
              if (target) panel.rememberAgent?.(target.id);
              focusComposer();
            }
            return accepted;
          }}
          registerAddFiles={registerAddFiles}
          toolbar={
            conversation ? (
              nativeConversation ? (
                <ConversationModelChoice
                  services={catalog.data ?? []}
                  model={configuration.data?.selectedModel ?? null}
                  allowedModels={configuration.data?.model}
                  disabled={
                    running ||
                    stopping ||
                    modelChangeBlocked ||
                    catalog.isFetching ||
                    !catalog.isSuccess ||
                    chatController.submissions.blocked(
                      conversationId,
                      `registry:${source}:${conversationId ?? 'new'}`,
                    )
                  }
                  onModelChange={(selected) => {
                    const current = configuration.data?.selectedModel;
                    if (
                      current?.modelService === selected.modelService &&
                      current.model === selected.model
                    )
                      return;
                    selectModel.mutate(selected);
                  }}
                />
              ) : null
            ) : (
              // Before the first message: who the conversation goes to.
              <NewChatChoice
                agents={offered ?? []}
                agent={target}
                services={catalog.data ?? []}
                model={model}
                modelsDisabled={
                  catalog.isFetching || !catalog.isSuccess || !hasChatModels
                }
                onModelChange={(selected) => {
                  setChosenModel(selected);
                  selectConversation(null, 'online', {
                    preserveComposer: true,
                  });
                  focusComposer();
                }}
                onAgentChange={(agentId) => {
                  selectConversation(null, agentId, { preserveComposer: true });
                  focusComposer();
                }}
              />
            )
          }
          notice={
            conversation ? (
              <AgentNotice conversation={conversation} />
            ) : target === null && agents.isSuccess ? (
              (offered?.length ?? 0) > 0 ? (
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
