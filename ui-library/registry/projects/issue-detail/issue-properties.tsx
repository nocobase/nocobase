/**
 * An issue's side column, presented: recolouring its labels, who follows the issue, when it was created and changed,
 * and "Start now?" before a change hands the issue to an agent. The card and its fields are `property-fields`. Purely
 * presentational: values in, changes out.
 */
import {
  BellIcon,
  BellOffIcon,
  BotIcon,
  CheckIcon,
  Loader2Icon,
  PaletteIcon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';
import { cn } from 'cn';

import {
  PeopleAvatars,
  PropertyRow,
} from '../../components/property-fields.js';
import {
  dateTime,
  defaultIssueDetailLabels,
  fill,
  relativeTime,
  type IssueDetailLabels,
} from './labels.js';

const CARD = 'space-y-3 rounded-lg border bg-card p-4 text-card-foreground';

export interface PaletteColor {
  readonly value: string;
  /** Its name, for the swatch's accessible name. */
  readonly label: string;
  /** The swatch's background, such as `bg-blue-500`. */
  readonly className: string;
}

/** Recolours items in place, such as an issue's labels: each item with the palette as swatches. */
export function PropertyColorPicker({
  items,
  palette,
  disabled,
  onChange,
  labels = defaultIssueDetailLabels,
}: {
  readonly items: readonly {
    readonly value: string;
    readonly name: string;
    readonly color: string;
  }[];
  readonly palette: readonly PaletteColor[];
  readonly disabled?: boolean;
  readonly onChange: (value: string, color: string) => void;
  readonly labels?: IssueDetailLabels;
}): ReactElement {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant='ghost'
            size='icon-xs'
            disabled={disabled || items.length === 0}
            aria-label={labels.labelColors.open}
          />
        }
      >
        <PaletteIcon />
      </PopoverTrigger>
      <PopoverContent align='end' className='w-64 gap-2 p-2'>
        <p className='px-1 text-xs font-medium text-muted-foreground'>
          {labels.labelColors.title}
        </p>
        <ul className='space-y-1.5'>
          {items.map((item) => (
            <li key={item.value} className='flex items-center gap-2 px-1'>
              <span className='min-w-0 flex-1 truncate text-sm'>
                {item.name}
              </span>
              <div
                role='radiogroup'
                aria-label={fill(labels.labelColors.for, { name: item.name })}
                className='flex gap-1'
              >
                {palette.map((color) => (
                  <button
                    key={color.value}
                    type='button'
                    role='radio'
                    disabled={disabled}
                    aria-checked={item.color === color.value}
                    aria-label={color.label}
                    title={color.label}
                    onClick={() => {
                      if (item.color !== color.value)
                        onChange(item.value, color.value);
                    }}
                    className={cn(
                      'flex size-4 items-center justify-center rounded-full ring-offset-1 ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
                      color.className,
                      item.color === color.value && 'ring-2 ring-foreground/60',
                    )}
                  >
                    {item.color === color.value ? (
                      <CheckIcon
                        className='size-3 text-background'
                        aria-hidden='true'
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export interface Follower {
  readonly id: string;
  readonly name: string;
  /** Why they follow it, in words. */
  readonly reason: string;
}

/** Who follows the issue, and the reader's follow button. */
export function IssueFollowers({
  followers,
  following,
  onToggle,
  labels = defaultIssueDetailLabels,
}: {
  readonly followers: readonly Follower[];
  readonly following: boolean;
  /** Without it, there is no button. */
  readonly onToggle?: (follow: boolean) => Promise<void>;
  readonly labels?: IssueDetailLabels;
}): ReactElement {
  const [busy, setBusy] = useState(false);
  return (
    <section className={CARD} aria-label={labels.followers.title}>
      <h2 className='text-sm font-semibold'>{labels.followers.title}</h2>
      <div className='flex items-center justify-between gap-2'>
        {followers.length > 0 ? (
          <PeopleAvatars
            people={followers.map((follower) => ({
              id: follower.id,
              name: follower.name,
              detail: follower.reason,
            }))}
            label={fill(labels.followers.label, { count: followers.length })}
          />
        ) : (
          <span className='text-sm text-muted-foreground'>
            {labels.followers.none}
          </span>
        )}
        {onToggle ? (
          <Button
            variant='outline'
            size='sm'
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void onToggle(!following)
                .catch(() => undefined)
                .finally(() => setBusy(false));
            }}
          >
            {busy ? (
              <Loader2Icon data-icon='inline-start' className='animate-spin' />
            ) : following ? (
              <BellOffIcon data-icon='inline-start' />
            ) : (
              <BellIcon data-icon='inline-start' />
            )}
            {following ? labels.followers.unfollow : labels.followers.follow}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/** When the issue was created and last changed. */
export function IssueDates({
  createdAt,
  updatedAt,
  locale,
  labels = defaultIssueDetailLabels,
}: {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly locale?: string;
  readonly labels?: IssueDetailLabels;
}): ReactElement {
  return (
    <section className={CARD} aria-label={labels.dates.title}>
      <h2 className='text-sm font-semibold'>{labels.dates.title}</h2>
      <PropertyRow label={labels.dates.created}>
        {dateTime(createdAt, locale)}
      </PropertyRow>
      <PropertyRow label={labels.dates.updated}>
        <span title={dateTime(updatedAt, locale)}>
          {relativeTime(updatedAt, locale)}
        </span>
      </PropertyRow>
    </section>
  );
}

/**
 * "Start now?", before a change hands the issue to someone who starts working on their own (an agent). "Start" and
 * "Don't start now" both apply the change; closing the dialog drops it.
 */
export function IssueStartDialog({
  open,
  description,
  workersTitle,
  workers,
  onDecide,
  onCancel,
  labels = defaultIssueDetailLabels,
}: {
  readonly open: boolean;
  readonly description: string;
  readonly workersTitle: string;
  readonly workers: readonly string[];
  readonly onDecide: (start: boolean) => void;
  readonly onCancel: () => void;
  readonly labels?: IssueDetailLabels;
}): ReactElement {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{labels.start.title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <p className='text-sm font-medium'>{workersTitle}</p>
          <ul className='space-y-1'>
            {workers.map((name) => (
              <li key={name} className='flex items-center gap-2 text-sm'>
                <BotIcon
                  className='size-4 text-muted-foreground'
                  aria-hidden='true'
                />
                {name}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onDecide(false)}>
            {labels.start.later}
          </Button>
          <Button onClick={() => onDecide(true)}>{labels.start.start}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
