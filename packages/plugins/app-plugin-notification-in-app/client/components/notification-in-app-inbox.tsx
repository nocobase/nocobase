import { isNotificationTarget } from '@nocobase/app-plugin-notification/client';
import { PageHeader } from './page-header.js';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { NavLink } from 'react-router';

import {
  fetchInbox,
  markInboxRead,
  mutateInboxItem,
  type InboxItem,
  type InboxMutationAction,
} from '../api.js';
import { IN_APP_NOTIFICATION_CLIENT_NAMESPACE } from '../i18n.js';
import { useNotificationInAppRuntime } from '../notification-in-app-runtime.js';
import { Alert, AlertDescription, AlertTitle } from './ui/alert.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card.js';

export function NotificationInAppInbox(): ReactElement {
  const appClient = useApiClient();
  const { t } = useTranslation(IN_APP_NOTIFICATION_CLIENT_NAMESPACE);
  const inboxRuntime = useNotificationInAppRuntime();
  const { revision, unreadCount } = inboxRuntime;
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState<readonly InboxItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();

  const sentinelRef = useRef<HTMLDivElement>(null);
  const nextPageRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    nextPageRequestRef.current?.abort();
    nextPageRequestRef.current = null;
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return;
        setLoadingMore(false);
        setLoading(true);
        setNextCursor(undefined);
        return fetchInbox(appClient, { unreadOnly }, controller.signal);
      })
      .then((response) => {
        if (!response || controller.signal.aborted) return;
        setError(undefined);
        setItems(response.data);
        setNextCursor(response.nextPageToken);
      })
      .catch((reason: Error) => {
        if (!controller.signal.aborted) setError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      nextPageRequestRef.current?.abort();
    };
  }, [appClient, revision, unreadOnly]);

  const mutate = async (
    item: InboxItem,
    action: InboxMutationAction,
  ): Promise<void> => {
    setItems((current) =>
      action === 'delete'
        ? current.filter((candidate) => candidate.id !== item.id)
        : current.map((candidate) =>
            candidate.id === item.id
              ? {
                  ...candidate,
                  readAt:
                    action === 'read' ? new Date().toISOString() : undefined,
                }
              : candidate,
          ),
    );
    try {
      await mutateInboxItem(appClient, item.id, action);
      inboxRuntime.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t('inbox.errors.update', {
              defaultValue: 'Inbox update failed.',
            }),
      );
      inboxRuntime.refresh();
    }
  };

  const loadMore = useCallback(async (): Promise<void> => {
    if (!nextCursor || loading || error || nextPageRequestRef.current) return;
    const controller = new AbortController();
    nextPageRequestRef.current = controller;
    setLoadingMore(true);
    try {
      const response = await fetchInbox(
        appClient,
        {
          unreadOnly,
          pageToken: nextCursor,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setItems((current) => {
        const ids = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...response.data.filter((item) => !ids.has(item.id)),
        ];
      });
      setNextCursor(response.nextPageToken);
    } catch (reason) {
      if (controller.signal.aborted) return;
      setError(
        reason instanceof Error
          ? reason.message
          : t('inbox.errors.loadMore', {
              defaultValue: 'Could not load more notifications.',
            }),
      );
    } finally {
      if (nextPageRequestRef.current === controller) {
        nextPageRequestRef.current = null;
        setLoadingMore(false);
      }
    }
  }, [appClient, error, loading, nextCursor, t, unreadOnly]);

  useEffect(() => {
    if (
      !sentinelRef.current ||
      !nextCursor ||
      loading ||
      loadingMore ||
      error ||
      typeof IntersectionObserver === 'undefined'
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [error, loading, loadingMore, loadMore, nextCursor]);

  const readAll = async (): Promise<void> => {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
    try {
      await markInboxRead(appClient);
      inboxRuntime.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t('inbox.errors.markAllRead', {
              defaultValue: 'Could not mark notifications as read.',
            }),
      );
      inboxRuntime.refresh();
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title={
          <span className='inline-flex flex-wrap items-center gap-2'>
            {t('inbox.title', { defaultValue: 'Message center' })}
            {unreadCount > 0 ? (
              <Badge variant='secondary'>
                {t('inbox.unreadCount', {
                  count: unreadCount,
                  defaultValue: '{{count}} unread',
                })}
              </Badge>
            ) : null}
          </span>
        }
        description={t('inbox.description', {
          defaultValue: 'Updates from the applications and workflows you use.',
        })}
        actions={
          <Button
            variant='outline'
            onClick={() => void readAll()}
            disabled={items.every((item) => item.readAt)}
          >
            <CheckCheck />{' '}
            {t('inbox.markAllRead', { defaultValue: 'Mark all read' })}
          </Button>
        }
      />

      <Card className='gap-0 overflow-hidden py-0'>
        <CardHeader className='border-b bg-muted/20 py-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle>
                {t('inbox.messagesTitle', { defaultValue: 'Messages' })}
              </CardTitle>
              <CardDescription>
                {t('inbox.messagesDescription', {
                  defaultValue:
                    'In-app messages keep an independent read state for the current user.',
                })}
              </CardDescription>
            </div>
            <Button
              variant={unreadOnly ? 'default' : 'outline'}
              onClick={() => setUnreadOnly((value) => !value)}
            >
              {t('inbox.unreadFilter', { defaultValue: 'Unread' })}
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          {error ? (
            <Alert variant='destructive' className='m-4 w-auto'>
              <AlertTitle>
                {t('inbox.unavailable', {
                  defaultValue: 'Inbox unavailable',
                })}
              </AlertTitle>
              <AlertDescription className='flex items-center justify-between gap-3'>
                {error}
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => inboxRuntime.refresh()}
                >
                  <RefreshCw /> {t('inbox.retry', { defaultValue: 'Retry' })}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          {loading ? (
            <div className='p-10 text-center text-sm text-muted-foreground'>
              {t('inbox.loading', {
                defaultValue: 'Loading notifications…',
              })}
            </div>
          ) : items.length === 0 ? (
            <div className='grid place-items-center gap-2 p-12 text-center'>
              <div className='grid size-12 place-items-center rounded-full bg-muted'>
                <Bell className='size-5 text-muted-foreground' />
              </div>
              <p className='font-medium'>
                {t('inbox.emptyTitle', {
                  defaultValue: 'You’re all caught up',
                })}
              </p>
              <p className='text-sm text-muted-foreground'>
                {t('inbox.emptyDescription', {
                  defaultValue: 'New notifications will appear here.',
                })}
              </p>
            </div>
          ) : (
            <div className='divide-y'>
              {items.map((item) => (
                <InboxRow key={item.id} item={item} onMutate={mutate} />
              ))}
            </div>
          )}
        </CardContent>
        {(!loading && !error && items.length > 0) || nextCursor ? (
          <div
            ref={sentinelRef}
            className='border-t bg-card px-4 py-3 text-center'
          >
            {nextCursor && typeof IntersectionObserver !== 'undefined' ? (
              <p role='status' className='text-sm text-muted-foreground'>
                {loadingMore
                  ? t('inbox.loadingMore', { defaultValue: 'Loading…' })
                  : error
                    ? t('inbox.errors.loadMore', {
                        defaultValue: 'Could not load more notifications.',
                      })
                    : t('inbox.scrollMore', {
                        defaultValue: 'Scroll down to load more',
                      })}
              </p>
            ) : nextCursor ? (
              <Button
                className='self-center'
                variant='outline'
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore
                  ? t('inbox.loadingMore', { defaultValue: 'Loading…' })
                  : t('inbox.loadMore', { defaultValue: 'Load more' })}
              </Button>
            ) : items.length > 0 && !loading && !error ? (
              <p
                className='text-center text-sm text-muted-foreground'
                role='status'
              >
                {t('inbox.noMore', { defaultValue: 'No more messages' })}
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

interface InboxRowProps {
  readonly item: InboxItem;
  readonly onMutate: (
    item: InboxItem,
    action: InboxMutationAction,
  ) => Promise<void>;
}

function InboxRow({ item, onMutate }: InboxRowProps): ReactElement {
  const { t } = useTranslation(IN_APP_NOTIFICATION_CLIENT_NAMESPACE);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const bodyId = useId();

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(body).lineHeight);
      setOverflowing(body.scrollHeight > lineHeight * 3 + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, [item.body]);
  return (
    <article
      className={`flex gap-3 p-4 sm:p-5 ${item.readAt ? 'bg-card' : 'bg-primary/[0.035]'}`}
    >
      <div className='mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground'>
        <Bell className='size-4' />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-2'>
            <h2 className='truncate font-medium' title={item.title}>
              {item.title}
            </h2>
            {!item.readAt ? (
              <span
                className='size-2 shrink-0 rounded-full bg-primary'
                aria-label={t('inbox.unreadFilter', { defaultValue: 'Unread' })}
              />
            ) : null}
          </div>
          <Badge variant='outline' className='shrink-0'>
            {t('inbox.channel', { defaultValue: 'In-app' })}
          </Badge>
        </div>
        <p
          ref={bodyRef}
          id={bodyId}
          className={`mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere] ${expanded ? '' : 'line-clamp-3'}`}
        >
          {item.body}
        </p>
        {overflowing ? (
          <Button
            variant='link'
            size='sm'
            className='h-auto px-0 py-1'
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? t('inbox.collapse', { defaultValue: 'Show less' })
              : t('inbox.expand', { defaultValue: 'Show more' })}
          </Button>
        ) : null}
        <div className='mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
          <time dateTime={item.createdAt}>
            {new Date(item.createdAt).toLocaleString()}
          </time>
          {isNotificationTarget(item.target) ? (
            <Button
              nativeButton={false}
              role='link'
              render={
                item.target.type === 'route' ? (
                  <NavLink to={item.target.path} />
                ) : (
                  <a href={item.target.url} />
                )
              }
              variant='link'
              size='sm'
              className='h-auto px-1 text-xs'
            >
              {t('inbox.open', { defaultValue: 'Open' })} <ExternalLink />
            </Button>
          ) : null}
          <Button
            variant='ghost'
            size='sm'
            className='ml-auto'
            onClick={() => void onMutate(item, item.readAt ? 'unread' : 'read')}
          >
            {item.readAt
              ? t('inbox.markUnread', { defaultValue: 'Mark unread' })
              : t('inbox.markRead', { defaultValue: 'Mark read' })}
          </Button>
          <Button
            aria-label={t('inbox.delete', {
              defaultValue: 'Delete notification',
            })}
            variant='ghost'
            size='icon-sm'
            onClick={() => void onMutate(item, 'delete')}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </article>
  );
}
