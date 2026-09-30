import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useAIEmployeeClient } from '../ai-employee-client.js';
import type {
  ConversationHistoryPage,
  ManagedConversation,
} from '../conversation-center-service.js';
import { useCatalogDisplay } from '../catalog-display.js';
import { useT } from '../locales/index.js';
import {
  conversationEmployeeLabel,
  conversationUserLabel,
  formatConversationTime,
} from '../pages/conversations/display.js';
// The transcript is the chat's own read-only history view rather than a second message renderer, so management and
// chat show a stored message the same way. `readOnly` mounts no tool renderer, composer, retry or edit control.
import { AIChatMessageList } from '../../registry/nocobase-ai/components/chat/chat-messages.js';
import type { AIChatMessage } from '../../registry/nocobase-ai/providers/types.js';
import { RouteDrawer } from './route-drawer.js';
import { Alert, AlertDescription } from './ui/alert.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';

type TranscriptState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | {
      status: 'ready';
      messages: AIChatMessage[];
      cursor: string | null;
      hasMore: boolean;
      earlier: 'idle' | 'loading' | 'error';
    };

export interface ConversationDetailsDrawerProps {
  readonly sessionId: string;
  /** The list row, when the conversation is on the page the reader came from. */
  readonly summary?: ManagedConversation;
}

function isMissing(error: unknown): boolean {
  // An id that is not a session id at all is as missing as an unknown one.
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error.status === 404 || error.status === 400)
  );
}

/** Mount at the :sessionId child route. Messages load newest first; older pages are prepended on request. */
export function ConversationDetailsDrawer({
  sessionId,
  summary,
}: ConversationDetailsDrawerProps): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const { locale } = useCatalogDisplay();
  const [state, setState] = useState<TranscriptState>({
    status: sessionId ? 'loading' : 'not-found',
  });
  const [attempt, setAttempt] = useState(0);
  const earlierRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();
    void ai
      .getManagedConversationMessages(sessionId, { signal: controller.signal })
      .then(
        (page) => {
          if (controller.signal.aborted) return;
          setState({
            status: 'ready',
            messages: page.messages,
            cursor: page.cursor ?? null,
            hasMore: page.hasMore,
            earlier: 'idle',
          });
        },
        (error: unknown) => {
          if (!controller.signal.aborted)
            setState({ status: isMissing(error) ? 'not-found' : 'error' });
        },
      );
    return () => {
      controller.abort();
      earlierRef.current?.abort();
    };
  }, [ai, sessionId, attempt]);

  function loadEarlier(): void {
    if (state.status !== 'ready' || !state.cursor || earlierRef.current) return;
    const controller = new AbortController();
    earlierRef.current = controller;
    setState({ ...state, earlier: 'loading' });
    void ai
      .getManagedConversationMessages(sessionId, {
        cursor: state.cursor,
        signal: controller.signal,
      })
      .then(
        (page: ConversationHistoryPage) => {
          if (controller.signal.aborted) return;
          setState((current) => {
            if (current.status !== 'ready') return current;
            const known = new Set(current.messages.map(({ id }) => id));
            return {
              ...current,
              messages: [
                ...page.messages.filter(({ id }) => !known.has(id)),
                ...current.messages,
              ],
              cursor: page.cursor ?? null,
              hasMore: page.hasMore,
              earlier: 'idle',
            };
          });
        },
        () => {
          if (controller.signal.aborted) return;
          setState((current) =>
            current.status === 'ready'
              ? { ...current, earlier: 'error' }
              : current,
          );
        },
      )
      .finally(() => {
        if (earlierRef.current === controller) earlierRef.current = null;
      });
  }

  const title = summary?.title?.trim() || t('conversations.untitled');
  return (
    <RouteDrawer
      title={t('conversations.details')}
      description={t('conversations.readOnlyNotice')}
      className='sm:max-w-3xl motion-reduce:animate-none motion-reduce:transition-none'
    >
      <div className='flex h-full min-h-0 min-w-0 flex-col gap-4'>
        <section
          aria-label={t('conversations.summary')}
          className='flex min-w-0 shrink-0 flex-col gap-3'
        >
          <div className='flex min-w-0 flex-wrap items-center gap-2'>
            <h3 className='min-w-0 font-heading text-xl font-semibold tracking-tight [overflow-wrap:anywhere]'>
              {title}
            </h3>
            <Badge variant='secondary'>{t('conversations.readOnly')}</Badge>
          </div>
          <dl className='grid min-w-0 grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]'>
            {summary ? (
              <>
                <dt className='text-muted-foreground'>
                  {t('conversations.user')}
                </dt>
                <dd className='min-w-0 [overflow-wrap:anywhere]'>
                  {summary.user
                    ? conversationUserLabel(summary.user)
                    : (summary.userId ?? t('conversations.unknownUser'))}
                </dd>
                <dt className='text-muted-foreground'>
                  {t('conversations.aiEmployee')}
                </dt>
                <dd className='min-w-0 [overflow-wrap:anywhere]'>
                  {summary.aiEmployee
                    ? conversationEmployeeLabel(summary.aiEmployee)
                    : (summary.aiEmployeeUsername ?? '—')}
                </dd>
                <dt className='text-muted-foreground'>
                  {t('conversations.updatedAt')}
                </dt>
                <dd>{formatConversationTime(summary.updatedAt, locale)}</dd>
              </>
            ) : null}
            <dt className='text-muted-foreground'>
              {t('conversations.sessionId')}
            </dt>
            <dd
              translate='no'
              className='min-w-0 break-all font-mono text-xs leading-5'
            >
              {sessionId}
            </dd>
          </dl>
        </section>
        {state.status === 'loading' ? (
          <p role='status' className='text-sm text-muted-foreground'>
            {t('conversations.messagesLoading')}
          </p>
        ) : state.status === 'not-found' ? (
          <p role='status' className='text-sm text-muted-foreground'>
            {t('conversations.notFound')}
          </p>
        ) : state.status === 'error' ? (
          <Alert variant='destructive'>
            <AlertDescription className='flex flex-col items-start gap-3'>
              <p>{t('conversations.messagesError')}</p>
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
        ) : (
          <AIChatMessageList
            readOnly
            messages={state.messages}
            className='min-h-80 rounded-lg border'
            emptyState={
              <p
                role='status'
                className='flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground'
              >
                {t('conversations.noMessages')}
              </p>
            }
            historyHeader={
              state.hasMore ? (
                <div className='flex flex-col items-center gap-2 p-3'>
                  {state.earlier === 'error' ? (
                    <p role='alert' className='text-sm text-destructive'>
                      {t('conversations.earlierError')}
                    </p>
                  ) : null}
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={state.earlier === 'loading'}
                    onClick={loadEarlier}
                  >
                    {state.earlier === 'loading'
                      ? t('conversations.loadingEarlier')
                      : t('conversations.loadEarlier')}
                  </Button>
                </div>
              ) : undefined
            }
          />
        )}
      </div>
    </RouteDrawer>
  );
}
