// Generated from packages/plugins/app-plugin-notification-in-app/client/inbox-page/inbox-rail.tsx: edit it there, then run `node scripts/sync-ui-library-inbox.mjs`.
import { InboxIcon, ListTodoIcon, MailIcon, TagIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { cn } from 'cn';

import type { InboxCategoryOption } from './categories.js';
import { useInboxFrameText } from './frame.js';
import type { InboxFilter, InboxView } from './model.js';

export interface InboxRailProps {
  readonly filter: InboxFilter;
  /** Every unread item, the count on Unread. */
  readonly unread: number;
  /** What waits on the viewer, the count on Pending and the header badge's. */
  readonly pending: number;
  readonly categories: readonly InboxCategoryOption[];
  readonly onFilter: (filter: InboxFilter) => void;
  readonly idPrefix?: string;
}

/**
 * The inbox's left rail: All, Unread and Pending, then the notification categories with their unread counts. On a
 * narrow screen the same choices form one scrolling row above the list.
 */
export function InboxRail({
  filter,
  unread,
  pending,
  categories,
  onFilter,
  idPrefix = 'nocobase-inbox',
}: InboxRailProps): ReactElement {
  const { t } = useInboxFrameText();
  const views: readonly {
    readonly view: InboxView;
    readonly label: string;
    readonly icon: ReactNode;
    readonly count: number;
    readonly countLabel?: string;
    readonly attention?: boolean;
  }[] = [
    {
      view: 'all',
      label: t('inbox.views.all', { defaultValue: 'All' }),
      icon: <InboxIcon aria-hidden='true' />,
      count: 0,
    },
    {
      view: 'unread',
      label: t('inbox.views.unread', { defaultValue: 'Unread' }),
      icon: <MailIcon aria-hidden='true' />,
      count: unread,
      countLabel: t('inbox.unreadCount', {
        count: unread,
        defaultValue: '{{count}} unread',
      }),
    },
    {
      view: 'todo',
      label: t('inbox.views.todo', { defaultValue: 'Pending' }),
      icon: <ListTodoIcon aria-hidden='true' />,
      count: pending,
      countLabel: t('inbox.pendingDecisions', {
        count: pending,
        defaultValue: '{{count}} waiting',
      }),
      attention: true,
    },
  ];
  const heading = `${idPrefix}-categories`;
  return (
    <nav
      aria-label={t('inbox.filters', { defaultValue: 'Inbox filters' })}
      className='flex shrink-0 gap-1 overflow-x-auto border-b px-3 py-2 lg:h-full lg:w-52 lg:flex-col lg:gap-0.5 lg:overflow-x-visible lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-2 lg:py-3'
      data-testid={`${idPrefix}-rail`}
    >
      {views.map((item) => (
        <RailButton
          key={item.view}
          active={filter.view === item.view && !filter.category}
          onClick={() =>
            onFilter({ view: item.view, kind: filter.kind, category: null })
          }
          icon={item.icon}
          label={item.label}
          count={item.count}
          countLabel={item.countLabel}
          attention={item.attention}
        />
      ))}
      {categories.length ? (
        <>
          <h2
            id={heading}
            className='hidden px-2 pt-4 pb-1 text-xs font-medium text-muted-foreground lg:block'
          >
            {t('inbox.categories', { defaultValue: 'Categories' })}
          </h2>
          <span
            aria-hidden='true'
            className='mx-1 w-px shrink-0 self-stretch bg-border lg:hidden'
          />
          {categories.map((category) => (
            <RailButton
              key={category.key}
              active={filter.category === category.key}
              onClick={() =>
                onFilter({
                  view: 'all',
                  kind: filter.kind,
                  category: category.key,
                })
              }
              icon={<TagIcon aria-hidden='true' className='lg:hidden' />}
              label={category.label}
              count={category.unread}
              countLabel={t('inbox.unreadCount', {
                count: category.unread,
                defaultValue: '{{count}} unread',
              })}
            />
          ))}
        </>
      ) : null}
    </nav>
  );
}

function RailButton({
  active,
  onClick,
  icon,
  label,
  count,
  countLabel,
  attention,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly icon: ReactNode;
  readonly label: string;
  readonly count: number;
  readonly countLabel?: string;
  readonly attention?: boolean;
}): ReactElement {
  return (
    <button
      type='button'
      aria-current={active ? 'true' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-full [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground',
        active
          ? 'bg-accent font-medium text-accent-foreground'
          : 'text-foreground hover:bg-muted',
      )}
    >
      {icon}
      <span className='min-w-0 truncate'>{label}</span>
      {count > 0 ? (
        <span
          aria-label={countLabel}
          className={cn(
            'ml-auto rounded-full px-1.5 text-xs tabular-nums',
            attention
              ? 'bg-amber-500/15 font-medium text-amber-700 dark:text-amber-300'
              : 'text-muted-foreground',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
