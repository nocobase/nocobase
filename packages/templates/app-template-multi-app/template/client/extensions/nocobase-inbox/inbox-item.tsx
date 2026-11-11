import { CheckCircle2Icon, MoreHorizontalIcon } from 'lucide-react';
import { createElement, type KeyboardEvent, type ReactElement } from 'react';

import { Button } from '#components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from '#components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { cn } from 'cn';

import {
  actionLabel,
  useInboxFrameText,
  type InboxFrameText,
} from './frame.js';
import {
  INBOX_ACTION_ICON,
  inboxActionsFor,
  type InboxAction,
} from './inbox-actions.js';
import { isSettled, kindOf, relativeTime, type InboxEntry } from './model.js';
import { ContributorScope } from './registry-scope.js';
import {
  rendererKey,
  useRendererOf,
  type InboxEntryRenderer,
} from './registry.js';

export interface InboxTypeIconProps {
  readonly entry: InboxEntry;
  readonly renderer: InboxEntryRenderer<never>;
}

/**
 * The icon of an item: its contributor's, amber for a decision that still waits, a check once its decision is
 * settled.
 */
export function InboxTypeIcon({
  entry,
  renderer,
}: InboxTypeIconProps): ReactElement {
  if (isSettled(entry))
    return (
      <CheckCircle2Icon
        className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400'
        aria-hidden='true'
      />
    );
  // The contributor's icon component, chosen per item.
  return createElement(renderer.icon(entry), {
    'aria-hidden': true,
    className: cn(
      'size-4 shrink-0',
      kindOf(entry) === 'decision'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground',
    ),
  });
}

export interface InboxItemCardProps {
  readonly entry: InboxEntry;
  readonly selected: boolean;
  readonly busy: boolean;
  /** Arrived by a realtime push after the list first loaded: slides in. */
  readonly fresh?: boolean;
  readonly onSelect: (entry: InboxEntry) => void;
  readonly onOpen: (entry: InboxEntry) => void;
  readonly onAction: (entry: InboxEntry, action: InboxAction) => void;
}

/** A card, worded by the item's contributor in its own namespace (`registry.ts`). */
export function InboxItemCard(props: InboxItemCardProps): ReactElement {
  const renderer = useRendererOf()(props.entry);
  const frame = useInboxFrameText();
  return (
    <ContributorScope
      key={rendererKey(renderer)}
      namespace={renderer.namespace}
      resources={renderer.resources}
    >
      <ItemCard {...props} renderer={renderer} frame={frame} />
    </ContributorScope>
  );
}

/**
 * One compact card of the inbox list. Clicking anywhere on it shows it in the detail pane (and marks it read); Enter on
 * a focused card opens its route. The card reads: its title, ×N and time, then one line of particulars: whether it was
 * handled, its type, what it is about (an issue's identifier) and one sentence, as its contributor words them. A
 * decision that still waits carries an amber bar, an unread card a fainter bar and a bold title, a settled decision is
 * dimmed with a check, and an item that arrived after the list loaded slides in. The menu button, in the time's place
 * while the card is hovered, and a right-click offer read / unread and delete.
 */
function ItemCard({
  entry,
  renderer,
  frame,
  selected,
  busy,
  fresh,
  onSelect,
  onOpen,
  onAction,
}: InboxItemCardProps & {
  readonly renderer: InboxEntryRenderer<never>;
  readonly frame: InboxFrameText;
}): ReactElement {
  const { t, language } = frame;
  const wording = renderer.useWording();
  const { item, notice } = entry;
  const { title, sentence } = wording.text(entry);
  const unread = !item.readAt;
  const settled = isSettled(entry);
  const waiting = kindOf(entry) === 'decision' && !settled;
  const actions = inboxActionsFor(entry);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      onOpen(entry);
    }
  }

  const menuItems = (
    Item: typeof DropdownMenuItem | typeof ContextMenuItem,
  ): ReactElement[] =>
    actions.map((action) => {
      const Icon = INBOX_ACTION_ICON[action];
      return (
        <Item
          key={action}
          disabled={busy}
          onClick={() => onAction(entry, action)}
        >
          <Icon />
          {actionLabel(t, action)}
        </Item>
      );
    });

  return (
    <ContextMenu>
      <ContextMenuTrigger
        data-inbox-item={item.id}
        data-selected={selected ? 'true' : undefined}
        className={cn(
          // Pulled out by its padding and border, so its words start where the tabs' labels do and its bar sits in the
          // list's gutter.
          'group relative -mx-[calc(--spacing(3)+1px)] flex items-start gap-3 rounded-lg border border-transparent p-3 transition-[background-color,border-color,opacity] duration-200',
          selected ? 'bg-hover' : 'hover:bg-hover',
          settled && 'opacity-55',
          fresh &&
            'animate-in duration-200 fade-in slide-in-from-top-1 motion-reduce:animate-none',
        )}
      >
        <span
          aria-hidden='true'
          className={cn(
            'absolute top-3 bottom-3 -left-px w-0.5 rounded-full',
            selected
              ? 'bg-primary'
              : waiting
                ? 'bg-amber-500'
                : unread
                  ? 'bg-primary/70'
                  : 'bg-transparent',
          )}
        />
        <Button
          variant='ghost'
          type='button'
          aria-current={selected ? 'true' : undefined}
          // Stretched over the whole card, so a click anywhere on it selects the item.
          className="grid h-auto min-w-0 flex-1 cursor-pointer grid-cols-[minmax(0,1fr)] gap-1 rounded-none border-0 bg-transparent p-0 text-left font-normal whitespace-normal hover:bg-transparent active:translate-y-0 after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none"
          onClick={() => onSelect(entry)}
          onKeyDown={onKeyDown}
        >
          {/* The title, bold while unread, with the time at the right; the menu button takes the time's place while
              the card is hovered or its menu open. */}
          <span className='flex min-w-0 items-baseline gap-1.5'>
            <span
              className={cn(
                'min-w-0 truncate text-sm group-has-focus-visible:underline',
                unread ? 'font-semibold' : 'font-medium',
              )}
            >
              {title}
              {unread ? (
                <span className='sr-only'>
                  {t('inbox.unread', { defaultValue: 'Unread' })}
                </span>
              ) : null}
            </span>
            {notice && notice.count > 1 ? (
              <span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
                {t('inbox.count', {
                  count: notice.count,
                  defaultValue: '×{{count}}',
                })}
              </span>
            ) : null}
            {/* The latest notice's time: a merged item (×N) is sent anew, replacing the previous one. */}
            <time
              className='ml-auto shrink-0 text-xs text-muted-foreground tabular-nums group-has-focus-visible:invisible group-hover:invisible group-has-data-popup-open:invisible'
              dateTime={item.createdAt}
              title={new Date(item.createdAt).toLocaleString(language)}
            >
              {relativeTime(item.createdAt, language)}
            </time>
          </span>
          {/* Then one line of particulars: whether it was handled, its kind and what it is about, and its sentence. */}
          <span className='line-clamp-1 text-xs text-muted-foreground wrap-anywhere'>
            {settled
              ? `${t('inbox.resolved', { defaultValue: 'Handled' })} · `
              : null}
            {wording.label(entry)}
            {notice?.subject?.label ? (
              <span className='font-mono'> {notice.subject.label}</span>
            ) : null}
            {sentence ? ` · ${sentence}` : null}
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='ghost'
                size='icon-xs'
                disabled={busy}
                className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-has-focus-visible:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100'
                aria-label={t('inbox.actionsFor', {
                  title,
                  defaultValue: 'Actions for {{title}}',
                })}
              />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-auto min-w-40'>
            <DropdownMenuGroup>{menuItems(DropdownMenuItem)}</DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>{menuItems(ContextMenuItem)}</ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
