import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router';
import { useAIEmployeeClient } from '../ai-employee-client.js';
import { AIEmployeeAvatar } from '../avatar.js';
import { useCatalogDisplay } from '../catalog-display.js';
import type {
  ConversationCenterPage,
  ConversationEmployee,
  ManagedConversation,
} from '../conversation-center-service.js';
import { DelayedLoading } from '../components/delayed-loading.js';
import { Alert, AlertDescription } from '../components/ui/alert.js';
import { Button } from '../components/ui/button.js';
import { Empty, EmptyDescription } from '../components/ui/empty.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import { useT } from '../locales/index.js';
import { SettingsShell } from '../settings-shell.js';
import {
  conversationEmployeeLabel,
  conversationUserLabel,
  formatConversationTime,
} from './conversations/display.js';
import {
  ConversationEmployeeFilter,
  ConversationTitleFilter,
  ConversationUserFilter,
} from './conversations/filters.js';

/** The search parameters the conversation center keeps its filters and page in. */
const CONVERSATION_SEARCH_PARAMS = {
  user: 'userId',
  employee: 'aiEmployee',
  title: 'title',
  page: 'page',
} as const;

// The server rejects pages past this, so a hand-edited URL starts over instead.
const MAX_PAGE = 10000;

type ListState =
  | { status: 'loading'; previous?: ConversationCenterPage }
  | { status: 'error' }
  | { status: 'ready'; result: ConversationCenterPage };

function pageParam(value: string | null): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return page > MAX_PAGE ? 1 : page;
}

export default function ConversationsSettingsPage(): ReactElement {
  return (
    <SettingsShell
      title='Conversations'
      description='conversations.pageDescription'
    >
      <ConversationCenter />
    </SettingsShell>
  );
}

function ConversationCenter(): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get(CONVERSATION_SEARCH_PARAMS.user) || undefined;
  const aiEmployee =
    searchParams.get(CONVERSATION_SEARCH_PARAMS.employee) || undefined;
  const title = searchParams.get(CONVERSATION_SEARCH_PARAMS.title) ?? '';
  const page = pageParam(searchParams.get(CONVERSATION_SEARCH_PARAMS.page));
  const [state, setState] = useState<ListState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [employees, setEmployees] = useState<ConversationEmployee[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void ai.listConversationEmployees(controller.signal).then(
      (rows) => {
        if (!controller.signal.aborted) setEmployees(rows);
      },
      // The filter still offers the employee a restored URL names.
      () => undefined,
    );
    return () => controller.abort();
  }, [ai]);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({
      status: 'loading',
      previous:
        current.status === 'ready'
          ? current.result
          : current.status === 'loading'
            ? current.previous
            : undefined,
    }));
    void ai
      .listManagedConversations({
        keyword: title,
        userId,
        aiEmployeeUsername: aiEmployee,
        page,
        signal: controller.signal,
      })
      .then(
        (result) => {
          if (!controller.signal.aborted) setState({ status: 'ready', result });
        },
        () => {
          if (!controller.signal.aborted) setState({ status: 'error' });
        },
      );
    return () => controller.abort();
  }, [ai, userId, aiEmployee, title, page, attempt]);

  const result =
    state.status === 'ready'
      ? state.result
      : state.status === 'loading'
        ? state.previous
        : undefined;

  // A filter can leave fewer pages than a restored URL asks for.
  const lastPage = state.status === 'ready' ? state.result.totalPages : 0;
  useEffect(() => {
    if (lastPage > 0 && page > lastPage) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set(CONVERSATION_SEARCH_PARAMS.page, String(lastPage));
          return next;
        },
        { replace: true },
      );
    }
  }, [lastPage, page, setSearchParams]);

  function updateSearch(
    changes: Readonly<Record<string, string | undefined>>,
    options: { replace?: boolean } = {},
  ): void {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [name, value] of Object.entries(changes)) {
          if (value) next.set(name, value);
          else next.delete(name);
        }
        // Any filter change starts from the first page.
        if (!(CONVERSATION_SEARCH_PARAMS.page in changes))
          next.delete(CONVERSATION_SEARCH_PARAMS.page);
        return next;
      },
      { replace: options.replace ?? false },
    );
  }

  function openConversation(
    conversation: ManagedConversation,
    trigger: HTMLElement | null,
  ): void {
    trigger?.focus();
    void navigate({
      pathname: encodeURIComponent(conversation.sessionId),
      search: location.search,
    });
  }

  const filtered = Boolean(userId || aiEmployee || title);
  return (
    <section
      aria-label={t('Conversations')}
      className='flex min-w-0 flex-col gap-4'
    >
      <div
        role='search'
        aria-label={t('conversations.filters')}
        className='flex flex-wrap items-end gap-3'
      >
        <ConversationUserFilter
          userId={userId}
          onChange={(value) =>
            updateSearch({ [CONVERSATION_SEARCH_PARAMS.user]: value })
          }
        />
        <ConversationEmployeeFilter
          employees={employees}
          username={aiEmployee}
          onChange={(value) =>
            updateSearch({ [CONVERSATION_SEARCH_PARAMS.employee]: value })
          }
        />
        <ConversationTitleFilter
          title={title}
          onChange={(value) =>
            updateSearch(
              { [CONVERSATION_SEARCH_PARAMS.title]: value },
              { replace: true },
            )
          }
        />
        {result ? (
          <p
            aria-live='polite'
            className='ml-auto pb-2 text-sm text-muted-foreground'
          >
            {t('conversations.count', { count: result.count })}
          </p>
        ) : null}
      </div>
      {state.status === 'error' ? (
        <Alert variant='destructive'>
          <AlertDescription className='flex flex-col items-start gap-3'>
            <p>{t('conversations.error')}</p>
            <Button
              variant='outline'
              onClick={() => {
                setState({ status: 'loading' });
                setAttempt((value) => value + 1);
              }}
            >
              {t('Retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : !result ? (
        <DelayedLoading label={t('conversations.loading')} />
      ) : !result.rows.length ? (
        <Empty role='status' className='border'>
          <EmptyDescription>
            {t(filtered ? 'conversations.noMatches' : 'conversations.empty')}
          </EmptyDescription>
        </Empty>
      ) : (
        <>
          <div
            aria-busy={state.status === 'loading'}
            className='overflow-hidden rounded-xl border bg-card'
          >
            <ConversationTable rows={result.rows} onOpen={openConversation} />
          </div>
          <ConversationPagination
            page={result.page}
            totalPages={result.totalPages}
            disabled={state.status === 'loading'}
            onChange={(next) =>
              updateSearch({
                [CONVERSATION_SEARCH_PARAMS.page]:
                  next > 1 ? String(next) : undefined,
              })
            }
          />
        </>
      )}
      <Outlet context={result?.rows ?? []} />
    </section>
  );
}

function ConversationTable({
  rows,
  onOpen,
}: {
  rows: readonly ManagedConversation[];
  onOpen: (
    conversation: ManagedConversation,
    trigger: HTMLElement | null,
  ) => void;
}): ReactElement {
  const t = useT();
  const { locale } = useCatalogDisplay();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('conversations.titleLabel')}</TableHead>
          <TableHead>{t('conversations.user')}</TableHead>
          <TableHead>{t('conversations.aiEmployee')}</TableHead>
          <TableHead className='whitespace-nowrap'>
            {t('conversations.updatedAt')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((conversation) => {
          const title =
            conversation.title?.trim() || t('conversations.untitled');
          return (
            <TableRow
              key={conversation.sessionId}
              className='cursor-pointer'
              onClick={(event) =>
                onOpen(
                  conversation,
                  event.currentTarget.querySelector('button'),
                )
              }
            >
              <TableCell className='max-w-sm'>
                <Button
                  variant='link'
                  aria-haspopup='dialog'
                  title={title}
                  className='h-auto min-w-0 max-w-full justify-start px-0 text-left'
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(conversation, event.currentTarget);
                  }}
                >
                  <span className='truncate'>{title}</span>
                </Button>
              </TableCell>
              <TableCell className='max-w-56'>
                {conversation.user ? (
                  <div className='min-w-0'>
                    <div className='truncate'>
                      {conversationUserLabel(conversation.user)}
                    </div>
                    {conversation.user.username &&
                    conversation.user.username !== conversation.user.name ? (
                      <div className='truncate text-xs text-muted-foreground'>
                        {conversation.user.username}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <span className='text-muted-foreground'>
                    {conversation.userId ?? t('conversations.unknownUser')}
                  </span>
                )}
              </TableCell>
              <TableCell className='max-w-56'>
                {conversation.aiEmployee ? (
                  <div className='flex min-w-0 items-center gap-2'>
                    <AIEmployeeAvatar
                      src={conversation.aiEmployee.avatar ?? undefined}
                      name={conversationEmployeeLabel(conversation.aiEmployee)}
                      className='size-6'
                    />
                    <span className='truncate'>
                      {conversationEmployeeLabel(conversation.aiEmployee)}
                    </span>
                  </div>
                ) : (
                  <span className='text-muted-foreground'>
                    {conversation.aiEmployeeUsername ?? '—'}
                  </span>
                )}
              </TableCell>
              <TableCell className='whitespace-nowrap text-muted-foreground'>
                {formatConversationTime(conversation.updatedAt, locale)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ConversationPagination({
  page,
  totalPages,
  disabled,
  onChange,
}: {
  page: number;
  totalPages: number;
  disabled: boolean;
  onChange: (page: number) => void;
}): ReactElement | null {
  const t = useT();
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label={t('conversations.pagination')}
      className='flex items-center justify-end gap-2'
    >
      <Button
        variant='outline'
        size='sm'
        disabled={disabled || page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft data-icon='inline-start' />
        {t('conversations.previousPage')}
      </Button>
      <span className='text-sm text-muted-foreground'>
        {t('conversations.pageOf', { page, pages: totalPages })}
      </span>
      <Button
        variant='outline'
        size='sm'
        disabled={disabled || page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        {t('conversations.nextPage')}
        <ChevronRight data-icon='inline-end' />
      </Button>
    </nav>
  );
}
