import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useSearchParams } from 'react-router';
import { AIConversationList } from '../../registry/nocobase-ai/components/chat/conversation-list.js';
import { AIChatMessageList } from '../../registry/nocobase-ai/components/chat/chat-messages.js';
import { Button } from '../../registry/nocobase-ai/shared/ui/button.js';
import { Badge } from '../../registry/nocobase-ai/shared/ui/badge.js';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../registry/nocobase-ai/shared/ui/alert.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../registry/nocobase-ai/shared/ui/collapsible.js';
import { cn } from '../../registry/nocobase-ai/shared/utils.js';
import {
  type ConversationCenterPage,
  type ConversationHistoryPage,
  type ManagedConversation,
} from '../conversation-center-service.js';
import { useT } from '../locales/index.js';
import { useAIEmployeeClient } from '../ai-employee-client.js';

function asError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause));
}

function formatDate(value: string | undefined, language: string): string {
  if (!value || !Number.isFinite(Date.parse(value))) return '—';
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function ConversationCenterPageComponent(): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'en';
  const [params, setParams] = useSearchParams();
  const keyword = (params.get('keyword') ?? '').slice(0, 200);
  const rawPage = Number(params.get('page') ?? 1);
  const page =
    Number.isSafeInteger(rawPage) && rawPage >= 1 && rawPage <= 10000
      ? rawPage
      : 1;
  const selectedId = params.get('session') || undefined;
  const [searchValue, setSearchValue] = useState(keyword);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    value: ConversationCenterPage;
  }>();
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<Error>();
  const [selectedRecord, setSelectedRecord] = useState<ManagedConversation>();
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const queryKey = `${page}:${keyword}`;
  const currentResult = result?.key === queryKey ? result.value : undefined;
  const selected =
    currentResult?.rows.find((item) => item.sessionId === selectedId) ??
    (selectedRecord?.sessionId === selectedId ? selectedRecord : undefined);

  useEffect(() => setSearchValue(keyword), [keyword]);
  useEffect(() => {
    if (selectedId && window.matchMedia?.('(max-width: 767px)').matches)
      headingRef.current?.focus();
  }, [selectedId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError(undefined);
    void ai
      .listManagedConversations({
        keyword,
        page,
        signal: controller.signal,
      })
      .then((value) => {
        if (controller.signal.aborted) return;
        setResult({ key: queryKey, value });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setListError(asError(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [ai, keyword, page, queryKey, revision]);

  const navigate = (values: Record<string, string | undefined>): void => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };
  const conversations = (currentResult?.rows ?? []).map((conversation) => ({
    ...conversation,
    id: conversation.sessionId,
    title: conversation.title || t('Untitled conversation'),
  }));
  const pageCount = Math.max(
    1,
    Math.ceil((currentResult?.count ?? 0) / (currentResult?.pageSize ?? 30)),
  );
  useEffect(() => {
    if (currentResult && page > pageCount && !loading) {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (pageCount > 1) next.set('page', String(pageCount));
          else next.delete('page');
          return next;
        },
        { replace: true },
      );
    }
  }, [currentResult, page, pageCount, loading, setParams]);

  return (
    <section
      className='flex min-w-0 flex-col gap-4 lg:min-h-0 lg:flex-1'
      aria-label={t('Conversations')}
    >
      {/* Below lg the viewport constraint keeps history scrollable without expanding the page; from lg the settings
        shell passes its height down, so the panes fill what is left instead of guessing it from the viewport. */}
      <div className='flex h-[clamp(24rem,68dvh,56rem)] min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm lg:h-auto lg:min-h-0 lg:flex-1'>
        <aside
          aria-label={t('Conversations')}
          className={cn(
            'min-h-0 w-full shrink-0 md:block md:w-80 md:border-r lg:w-96',
            selectedId ? 'hidden' : 'block',
          )}
        >
          <AIConversationList
            conversations={conversations}
            heading={
              <span className='flex items-center gap-2'>
                {t('All conversations')}
                {currentResult ? (
                  <Badge variant='secondary'>
                    {new Intl.NumberFormat(language).format(
                      currentResult.count,
                    )}
                  </Badge>
                ) : null}
              </span>
            }
            activeConversationId={selectedId}
            onSelect={(id) => {
              returnFocusRef.current =
                document.activeElement instanceof HTMLElement
                  ? document.activeElement
                  : null;
              setSelectedRecord(
                currentResult?.rows.find((item) => item.sessionId === id),
              );
              navigate({ session: id });
            }}
            searchValue={searchValue}
            submittedSearchValue={keyword}
            onSearchChange={setSearchValue}
            onSearch={(value) => {
              setSearchValue(value.slice(0, 200));
              navigate({
                keyword: value.trim().slice(0, 200) || undefined,
                page: undefined,
                session: undefined,
              });
            }}
            loading={loading && !currentResult}
            error={listError}
            onRetry={() => setRevision((value) => value + 1)}
            renderLeading={() => (
              <span className='flex size-9 shrink-0 items-center justify-center rounded-lg border bg-transparent text-muted-foreground'>
                <MessageSquare className='size-4' aria-hidden='true' />
              </span>
            )}
            renderMetadata={(conversation) => (
              <span className='mt-1 flex min-w-0 flex-col gap-1 text-xs font-normal text-muted-foreground'>
                <span className='truncate'>
                  {t('User')}: {conversation.userId ?? '—'} ·{' '}
                  {conversation.aiEmployeeUsername || t('AI Employee')}
                </span>
                <time
                  dateTime={conversation.updatedAt}
                  className='truncate tabular-nums'
                >
                  {formatDate(conversation.updatedAt, language)}
                </time>
              </span>
            )}
            footer={
              <nav
                aria-label={t('Conversation pagination')}
                className='flex items-center justify-between gap-2 border-t px-3 py-2'
              >
                <Button
                  size='icon-sm'
                  className='size-11 md:size-8'
                  variant='ghost'
                  aria-label={t('Previous page')}
                  disabled={loading || page <= 1}
                  onClick={() =>
                    navigate({ page: page > 2 ? String(page - 1) : undefined })
                  }
                >
                  <ChevronLeft aria-hidden='true' />
                </Button>
                <span
                  role='status'
                  className='text-xs tabular-nums text-muted-foreground'
                >
                  {loading
                    ? t('Loading conversations…')
                    : listError && !currentResult
                      ? '—'
                      : t('Page {{page}} of {{pages}}', {
                          page,
                          pages: pageCount,
                        })}
                </span>
                <Button
                  size='icon-sm'
                  className='size-11 md:size-8'
                  variant='ghost'
                  aria-label={t('Next page')}
                  disabled={loading || page >= pageCount}
                  onClick={() => navigate({ page: String(page + 1) })}
                >
                  <ChevronRight aria-hidden='true' />
                </Button>
              </nav>
            }
          />
        </aside>
        <div
          className={cn(
            'min-h-0 min-w-0 flex-1 flex-col',
            selectedId ? 'flex' : 'hidden md:flex',
          )}
        >
          {selectedId ? (
            <>
              <header className='shrink-0 border-b bg-card'>
                <div className='flex items-center gap-3 p-4'>
                  <Button
                    className='size-11 shrink-0 md:hidden'
                    size='icon'
                    variant='ghost'
                    aria-label={t('Back to conversations')}
                    onClick={() => {
                      navigate({ session: undefined });
                      requestAnimationFrame(() =>
                        returnFocusRef.current?.focus(),
                      );
                    }}
                  >
                    <ArrowLeft aria-hidden='true' />
                  </Button>
                  <div className='min-w-0 flex-1'>
                    <h3
                      ref={headingRef}
                      tabIndex={-1}
                      className='truncate rounded-sm text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring'
                      title={selected?.title || selectedId}
                    >
                      {selected?.title || t('Conversation details')}
                    </h3>
                    <p className='mt-1 truncate text-xs text-muted-foreground'>
                      {selected?.aiEmployeeUsername || t('AI Employee')}
                      {selected?.userId
                        ? ` · ${t('User')}: ${selected.userId}`
                        : ''}
                    </p>
                  </div>
                </div>
                <Collapsible className='border-t'>
                  <CollapsibleTrigger className='group/details flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'>
                    <Info className='size-3.5' aria-hidden='true' />
                    {t('Conversation details')}
                    <ChevronDown
                      className='ml-auto size-3.5 transition-transform group-data-panel-open/details:rotate-180 motion-reduce:transition-none'
                      aria-hidden='true'
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <dl className='grid max-h-48 grid-cols-1 gap-x-6 gap-y-3 overflow-y-auto px-4 pb-4 text-xs sm:grid-cols-2'>
                      {[
                        [t('Title'), selected?.title],
                        [t('Session ID'), selectedId],
                        [t('User'), selected?.userId],
                        [t('Scope'), selected?.scope],
                        [t('Category'), selected?.category],
                        [
                          t('Updated at'),
                          formatDate(selected?.updatedAt, language),
                        ],
                      ].map(([label, value]) => (
                        <div key={label} className='min-w-0'>
                          <dt className='text-muted-foreground'>{label}</dt>
                          <dd className='mt-1 select-text break-all font-medium'>
                            {value || '—'}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </CollapsibleContent>
                </Collapsible>
              </header>
              <ConversationTranscript key={selectedId} sessionId={selectedId} />
            </>
          ) : (
            <div className='flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center'>
              <span className='flex size-12 items-center justify-center rounded-xl border bg-muted/30 text-muted-foreground'>
                <MessageSquare className='size-5' aria-hidden='true' />
              </span>
              <h3 className='text-sm font-medium'>
                {t('Select a conversation')}
              </h3>
              <p className='max-w-xs text-sm leading-6 text-muted-foreground'>
                {t(
                  'Choose a conversation on the left to review messages, tool results, and reasoning.',
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ConversationTranscript({
  sessionId,
}: {
  sessionId: string;
}): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const [history, setHistory] = useState<ConversationHistoryPage>({
    messages: [],
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<{
    cause: Error;
    operation: 'initial' | 'earlier';
  }>();
  const [revision, setRevision] = useState(0);
  const requestRef = useRef<AbortController | undefined>(undefined);
  const earlierPendingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(undefined);
    void ai
      .getManagedConversationMessages(sessionId, {
        signal: controller.signal,
      })
      .then((value) => {
        if (!controller.signal.aborted) setHistory(value);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError({ cause: asError(cause), operation: 'initial' });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [ai, sessionId, revision]);

  const loadEarlier = async (): Promise<void> => {
    const controller = requestRef.current;
    if (
      loading ||
      !history.cursor ||
      !controller ||
      controller.signal.aborted ||
      earlierPendingRef.current
    )
      return;
    earlierPendingRef.current = true;
    setLoadingMore(true);
    setError(undefined);
    try {
      const value = await ai.getManagedConversationMessages(sessionId, {
        cursor: history.cursor,
        signal: controller.signal,
      });
      if (!controller.signal.aborted)
        setHistory((current) => {
          const ids = new Set(current.messages.map((message) => message.id));
          return {
            ...value,
            messages: [
              ...value.messages.filter((message) => !ids.has(message.id)),
              ...current.messages,
            ],
          };
        });
    } catch (cause) {
      if (!controller.signal.aborted)
        setError({ cause: asError(cause), operation: 'earlier' });
    } finally {
      earlierPendingRef.current = false;
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  };

  return (
    <>
      {error ? (
        <Alert variant='destructive' className='m-3 w-auto shrink-0'>
          <AlertTitle>{t('Unable to load conversation messages.')}</AlertTitle>
          <AlertDescription>
            <p className='break-words'>{error.cause.message}</p>
            <Button
              variant='outline'
              size='sm'
              className='mt-2 min-h-11 md:min-h-0'
              onClick={() =>
                error.operation === 'earlier'
                  ? void loadEarlier()
                  : setRevision((value) => value + 1)
              }
            >
              {t('Retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <AIChatMessageList
        messages={history.messages}
        loading={loading}
        readOnly
        showMessageActions={false}
        historyHeader={
          history.hasMore && history.cursor ? (
            <div className='flex justify-center px-4 py-3'>
              <Button
                size='sm'
                variant='outline'
                className='min-h-11 md:min-h-0'
                disabled={loadingMore}
                onClick={() => void loadEarlier()}
              >
                {loadingMore ? (
                  <LoaderCircle
                    aria-hidden='true'
                    className='animate-spin motion-reduce:animate-none'
                  />
                ) : null}
                {t(loadingMore ? 'Loading…' : 'Load earlier messages')}
              </Button>
            </div>
          ) : undefined
        }
        emptyState={
          error ? (
            <></>
          ) : (
            <div className='flex h-full flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground'>
              <MessageSquare className='size-6' aria-hidden='true' />
              {t('No messages in this conversation.')}
            </div>
          )
        }
      />
      <div
        role='status'
        className='flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground'
      >
        <span>{t('Read only · Viewing does not mark messages as read.')}</span>
        <div className='flex items-center gap-2'>
          <span className='tabular-nums'>
            {loading
              ? t('Loading messages…')
              : t('{{count}} messages loaded', {
                  count: history.messages.length,
                })}
          </span>
          <Button
            variant='ghost'
            size='icon-sm'
            className='size-11 md:size-8'
            aria-label={t('Refresh messages')}
            disabled={loading || loadingMore}
            onClick={() => setRevision((value) => value + 1)}
          >
            <RefreshCw aria-hidden='true' />
          </Button>
        </div>
      </div>
    </>
  );
}
