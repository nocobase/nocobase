import { useTranslation } from '@nocobase/i18n/client';
import { InboxIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, useLocation } from 'react-router';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { cn } from 'cn';

import type { InboxBadge } from './inbox-badge.js';

/** Other words for the button, in place of its `inboxButton.*` translations. */
export interface InboxButtonLabels {
  readonly title?: string;
  readonly pending?: (count: number) => string;
  readonly unread?: (count: number) => string;
  readonly pendingHint?: (count: number) => string;
  readonly unreadHint?: (count: number) => string;
}

export interface InboxButtonProps {
  /** Where the inbox is. */
  readonly to?: string;
  /** What the badge shows (`inboxBadge`); none when null. */
  readonly badge: InboxBadge;
  /** Marks the button current; on `to` and below it when left out. */
  readonly active?: boolean;
  readonly labels?: InboxButtonLabels;
  /** The prefix of its test ids: `<prefix>-button` and `<prefix>-badge`. */
  readonly idPrefix?: string;
  readonly className?: string;
}

/**
 * A header button linking to the inbox, with a badge: amber with the count of what waits on the viewer, or in the
 * primary color with the unread count when nothing waits. The label and the tooltip say which count it is.
 */
export function InboxButton({
  to = '/inbox',
  badge,
  active,
  labels,
  idPrefix = 'nocobase-inbox',
  className,
}: InboxButtonProps): ReactElement {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const current = active ?? (pathname === to || pathname.startsWith(`${to}/`));
  const title =
    labels?.title ?? t('inboxButton.title', { defaultValue: 'Inbox' });
  const label = !badge
    ? title
    : badge.kind === 'decisions'
      ? (labels?.pending?.(badge.count) ??
        t('inboxButton.pending', {
          count: badge.count,
          defaultValue: 'Inbox, {{count}} waiting',
        }))
      : (labels?.unread?.(badge.count) ??
        t('inboxButton.unread', {
          count: badge.count,
          defaultValue: 'Inbox, {{count}} unread',
        }));

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={to}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              // On the inbox itself: filled and outlined in the text color, apart from the plain buttons beside it.
              current
                ? 'border-foreground/40 bg-accent text-foreground hover:bg-accent'
                : 'border-border/70 bg-background/60 text-foreground hover:bg-muted',
              className,
            )}
            data-testid={`${idPrefix}-button`}
          />
        }
        aria-label={label}
      >
        <InboxIcon className='size-4.5' aria-hidden='true' />
        {/* Amber means "needs you"; the primary color (the brand's, in a themed application) only that something is
            unread. Ringed in the header's color so it stays apart from the border. */}
        {badge ? (
          <span
            className={cn(
              // Anchored to the corner and pushed a third of its size out, whatever its width.
              'absolute top-0 right-0 flex h-4.5 min-w-4.5 translate-x-1/3 -translate-y-1/3 items-center justify-center rounded-full px-1 leading-none font-semibold tabular-nums ring-2 ring-background',
              // "99+" in smaller type, so the badge stays a pill rather than covering the icon.
              badge.text.length > 2 ? 'text-[9px]' : 'text-[11px]',
              badge.kind === 'decisions'
                ? 'bg-amber-500 text-white'
                : 'bg-primary text-primary-foreground',
            )}
            data-testid={`${idPrefix}-badge`}
            data-kind={badge.kind}
            aria-hidden='true'
          >
            {badge.text}
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent side='bottom' className='max-w-64 flex-col items-start'>
        <span>{title}</span>
        {badge ? (
          <span className='opacity-80'>
            {badge.kind === 'decisions'
              ? (labels?.pendingHint?.(badge.count) ??
                t('inboxButton.pendingHint', {
                  count: badge.count,
                  defaultValue:
                    '{{count}} waiting for you; it goes down once they are handled.',
                }))
              : (labels?.unreadHint?.(badge.count) ??
                t('inboxButton.unreadHint', {
                  count: badge.count,
                  defaultValue:
                    '{{count}} unread; it goes down as you read them.',
                }))}
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
