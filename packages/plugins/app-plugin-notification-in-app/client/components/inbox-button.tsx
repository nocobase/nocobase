import { useTranslation } from '@nocobase/i18n/client';
import { Inbox } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router';

import type { InboxItem } from '../api.js';
import {
  useInboxActions,
  useInboxItems,
  useInboxUnreadCount,
} from '../inbox/index.js';
import { relativeTime } from '../inbox-page/model.js';
import { usePendingTotal } from './inbox-badge.js';
import { Button } from './ui/button.js';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.js';
import { cn } from 'cn';

/** How many recent messages the header popover lists. */
const RECENT_COUNT = 6;

/** Where the button and its popover send the viewer: the inbox page, at `path`. */
export interface InboxButtonOptions {
  readonly path: string;
}

/** The header's inbox button: a popover with the latest messages, "Mark all read" and a link to the inbox page. */
export function InboxButton({ path }: InboxButtonOptions): ReactElement {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pending = usePendingTotal();
  const unread = useInboxUnreadCount().data ?? 0;
  const label =
    pending > 0
      ? t('inboxButton.pending', { count: pending })
      : unread > 0
        ? t('inboxButton.unread', { count: unread })
        : t('inboxButton.title');
  const pageUrl = (params?: Record<string, string>): string =>
    params ? `${path}?${new URLSearchParams(params).toString()}` : path;
  const openItem = (item: InboxItem): void => {
    setOpen(false);
    void navigate(pageUrl({ item: item.id }));
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant='outline'
            size='icon'
            className='size-10 rounded-xl border-border bg-background/60 text-foreground'
            aria-label={label}
            title={label}
            data-testid='inbox-header-button'
          />
        }
      >
        <Inbox />
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-[min(22rem,calc(100vw-1rem))] gap-0 p-0'
        aria-label={t('inboxButton.title')}
      >
        {open ? (
          <InboxPopoverBody
            pending={pending}
            unread={unread}
            locale={i18n.language}
            onOpenItem={openItem}
            pendingUrl={pageUrl({ view: 'todo' })}
            pageUrl={pageUrl()}
            onLeave={() => setOpen(false)}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function InboxPopoverBody({
  pending,
  unread,
  locale,
  onOpenItem,
  pendingUrl,
  pageUrl,
  onLeave,
}: {
  readonly pending: number;
  readonly unread: number;
  readonly locale: string;
  readonly onOpenItem: (item: InboxItem) => void;
  readonly pendingUrl: string;
  readonly pageUrl: string;
  readonly onLeave: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const items = useInboxItems(RECENT_COUNT);
  const actions = useInboxActions();
  const recent = items.data?.pages[0]?.data ?? [];
  return (
    <div className='flex flex-col' data-testid='inbox-header-popover'>
      <div className='flex items-center justify-between gap-2 border-b px-3 py-2'>
        <span className='font-medium'>{t('inboxButton.title')}</span>
        <Button
          variant='ghost'
          size='sm'
          disabled={unread === 0 || actions.pending}
          onClick={() => void actions.readAll().catch(() => undefined)}
        >
          {t('inbox.readAll')}
        </Button>
      </div>
      {pending > 0 ? (
        <Link
          to={pendingUrl}
          onClick={onLeave}
          className='flex items-center justify-between gap-2 border-b bg-amber-50 px-3 py-2 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200'
        >
          <span>{t('inbox.views.todo')}</span>
          <span className='rounded-full bg-amber-500 px-1.5 text-xs font-medium text-white tabular-nums'>
            {pending}
          </span>
        </Link>
      ) : null}
      <div
        className='max-h-80 overflow-y-auto'
        aria-label={t('inboxButton.recent')}
      >
        {items.isPending ? (
          <p className='px-3 py-6 text-center text-muted-foreground'>
            {t('common.loading')}
          </p>
        ) : recent.length === 0 ? (
          <p className='px-3 py-6 text-center text-muted-foreground'>
            {t('inboxButton.empty')}
          </p>
        ) : (
          <ul className='divide-y'>
            {recent.map((item) => (
              <li key={item.id}>
                <button
                  type='button'
                  className='flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none'
                  onClick={() => onOpenItem(item)}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      item.readAt ? 'bg-transparent' : 'bg-primary',
                    )}
                  />
                  <span className='min-w-0 flex-1'>
                    <span
                      className={cn(
                        'block truncate',
                        item.readAt ? 'text-muted-foreground' : 'font-medium',
                      )}
                    >
                      {item.title}
                    </span>
                    <span className='block text-xs text-muted-foreground'>
                      {relativeTime(item.createdAt, locale)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link
        to={pageUrl}
        onClick={onLeave}
        className='border-t px-3 py-2 text-center text-primary hover:bg-muted/60'
      >
        {t('inboxButton.viewAll')}
      </Link>
    </div>
  );
}
