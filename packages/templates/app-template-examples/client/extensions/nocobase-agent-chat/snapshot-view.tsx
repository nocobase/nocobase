import { type ReactElement } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { resolveAppUrl } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ChatExtensionsContext,
  agentsQueryClient,
  useChatApi,
  useAgentText,
  chatMessageSegments,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationDetail } from '@nocobase/app-plugin-agents/shared/conversations';
import { Button } from '#components/ui/button';
import { useChatTranslation } from './chat-i18n.js';
import { MessageItem } from './message-item.js';
import { LoadError } from './chat-ui.js';

/** Historical HTTP reads only: no controller history, live stream, usage, timeline hooks or composer. */
export function SnapshotView({
  conversation,
}: {
  readonly conversation: ConversationDetail;
}): ReactElement {
  const api = useChatApi();
  const { t } = useChatTranslation();
  const { i18n } = useTranslation();
  const agent = useAgentText();
  const snapshot = conversation.snapshot!;
  const history = useInfiniteQuery(
    {
      queryKey: [
        'agents',
        'snapshotHistory',
        conversation.id,
        conversation.updatedAt,
      ],
      queryFn: ({ pageParam }) =>
        api.messages(
          conversation.id,
          pageParam ? { pageToken: pageParam } : {},
        ),
      initialPageParam: null as string | null,
      getNextPageParam: (page) => page.nextCursor ?? undefined,
      retry: false,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
    },
    agentsQueryClient(),
  );
  const links = useQuery(
    {
      queryKey: [
        'agents',
        'snapshotLinks',
        conversation.id,
        conversation.updatedAt,
      ],
      queryFn: () => api.conversationLinks(conversation.id),
      retry: false,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
    },
    agentsQueryClient(),
  );
  const messages = [...(history.data?.pages ?? [])]
    .reverse()
    .flatMap((page) => page.items);
  return (
    <ChatExtensionsContext.Provider value={{}}>
      <div
        className='flex min-h-0 flex-1 flex-col'
        data-testid='conversation-snapshot'
      >
        <p className='border-b px-4 py-2 text-sm text-muted-foreground'>
          {t('chat.sharing.asOf', {
            time: new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(snapshot.snapshotAt)),
          })}
        </p>
        <div
          className='min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain p-4'
          role='log'
        >
          {history.isError || links.isError ? (
            <LoadError
              title={t('chat.notFound')}
              error={history.error ?? links.error}
              onRetry={() => {
                void history.refetch();
                void links.refetch();
              }}
            />
          ) : (
            <>
              {links.data?.some((link) => link.view) && (
                <section className='space-y-2 border-b pb-3'>
                  <h2 className='text-sm font-medium'>
                    {t('chat.sharing.related')}
                  </h2>
                  <ul className='space-y-2 text-sm'>
                    {links.data
                      .filter((link) => link.view)
                      .map((link) => (
                        <li key={link.id}>
                          <a
                            className='text-primary underline-offset-4 hover:underline'
                            href={
                              link.view!.url
                                ? resolveAppUrl(link.view!.url)
                                : undefined
                            }
                          >
                            {link.view!.key} {link.view!.title}
                          </a>
                        </li>
                      ))}
                  </ul>
                </section>
              )}
              {history.hasNextPage && (
                <Button
                  variant='outline'
                  disabled={history.isFetchingNextPage}
                  onClick={() => void history.fetchNextPage()}
                >
                  {t('chat.sharing.older')}
                </Button>
              )}
              {history.isPending ? (
                <p role='status'>{t('chat.loading')}</p>
              ) : messages.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  {t('chat.sharing.empty')}
                </p>
              ) : null}
              {chatMessageSegments(messages).map((segment) => {
                const message = segment.message;
                return (
                  <MessageItem
                    key={segment.key}
                    message={message}
                    segment={segment}
                    agentName={() =>
                      agent.name(conversation.agent) ?? t('chat.agentGone')
                    }
                    readOnly
                  />
                );
              })}
            </>
          )}
        </div>
      </div>
    </ChatExtensionsContext.Provider>
  );
}
