import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useInboxActions,
  useInboxItems,
  useInboxRefresh,
} from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { useBusinessTask } from './use-business-task.js';
import { Button } from '../../components/ui/button.js';
import { Badge } from '../../components/ui/badge.js';
import { Card, CardHeader, CardContent } from '../../components/ui/card.js';
import { LongText } from '../../components/long-text.js';
import {
  BusinessShell,
  BusinessEmpty,
  BusinessFailure,
  BusinessLoading,
  BusinessUpdating,
  TaskLink,
} from './shared.js';

export default function InboxPage(): ReactElement {
  // Inbox hook keys are shared. Keep this view's cache inside the session-keyed route so a new account cannot see
  // cached messages from the previous account, even before its first HTTP request finishes.
  const [cache] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  useEffect(() => () => cache.clear(), [cache]);
  return (
    <QueryClientProvider client={cache}>
      <InboxFeed />
    </QueryClientProvider>
  );
}
function InboxFeed(): ReactElement {
  const { t, i18n } = useTranslation();
  const query = useInboxItems(20);
  const actions = useInboxActions();
  const { refetch } = query;
  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);
  const action = useBusinessTask();
  useInboxRefresh();
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  return (
    <BusinessShell name='inbox'>
      <BusinessFailure error={query.error} retry={() => void query.refetch()} />
      <BusinessUpdating active={Boolean(query.data && query.isFetching)} />
      {query.isPending ? <BusinessLoading /> : null}
      {!query.isPending && !query.error && !items.length ? (
        <BusinessEmpty name='inbox' />
      ) : null}
      <div className='flex flex-col gap-4'>
        {items.map((item) => {
          const taskId =
            item.target?.type === 'route'
              ? /^\/notification-example\/tasks\/([^/]+)$/u.exec(
                  item.target.path,
                )?.[1]
              : undefined;
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 break-words'>
                    {taskId ? (
                      <TaskLink id={taskId} inbox>
                        {item.title}
                      </TaskLink>
                    ) : (
                      <h2 className='text-base font-medium'>{item.title}</h2>
                    )}
                  </div>
                  <Badge variant={item.readAt ? 'outline' : 'secondary'}>
                    {t(item.readAt ? 'business.read' : 'business.unread')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='flex flex-col gap-3'>
                <LongText className='text-sm text-muted-foreground'>
                  {item.body}
                </LongText>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <time className='text-xs text-muted-foreground'>
                    {new Date(item.createdAt).toLocaleString(i18n.language)}
                  </time>
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={actions.pending || action.pending}
                    onClick={() =>
                      void action.run(
                        async () => {
                          await actions.mark(
                            item.id,
                            item.readAt ? 'unread' : 'read',
                          );
                        },
                        item.readAt
                          ? 'business.markedUnread'
                          : 'business.markedRead',
                      )
                    }
                  >
                    {actions.pending
                      ? t('business.saving')
                      : t(
                          item.readAt
                            ? 'business.markUnread'
                            : 'business.markRead',
                        )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {query.hasNextPage ? (
        <Button
          variant='outline'
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? t('loading') : t('business.loadMore')}
        </Button>
      ) : null}
      <Outlet
        context={{
          reload,
          saved: reload,
          denied: reload,
        }}
      />
    </BusinessShell>
  );
}
