/**
 * One issue, compact: identifier and title, then whatever the consumer gives of its status, priority, owner and
 * executor, due date and labels. A `row` is one line for lists; a `card` stacks the same parts for a board. The whole
 * card is one link (`href`) or one button (`onSelect`), named by its identifier and title; `trailing` and `marks` sit
 * above it, so actions placed there stay clickable. Purely presentational: map the projects plugin's issues to
 * `IssueCardIssue`, as for `issue-table`, whose status badge, priority and person it reuses.
 */
import { CalendarIcon } from 'lucide-react';
import type {
  AnchorHTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
} from 'react';

import { useTranslation } from '@nocobase/i18n/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from 'cn';

import {
  IssuePerson,
  IssuePriority,
  IssueStatusBadge,
  type IssueTableColor,
  type IssueTablePerson,
  type IssueTablePriority,
} from '@/components/issue-table';

export interface IssueCardIssue {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  /** The status in its workflow's colour; left out, no status shows (a board's column already says it). */
  readonly status?: {
    readonly name: string;
    readonly color: IssueTableColor;
  } | null;
  /** `none` shows nothing. */
  readonly priority?: IssueTablePriority;
  readonly owner?: IssueTablePerson | null;
  readonly executor?: IssueTablePerson | null;
  /** A calendar date (`YYYY-MM-DD`); one before today shows as overdue, so leave it out for a finished issue. */
  readonly dueDate?: string | null;
  readonly labels?: readonly {
    readonly id: string;
    readonly name: string;
    readonly color: IssueTableColor;
  }[];
}

/** `row`: one line, for lists. `card`: stacked, for boards and grids. */
export type IssueCardSize = 'row' | 'card';

/** `framed` draws its own border and background; `plain` leaves them to the list or board it sits in. */
export type IssueCardAppearance = 'framed' | 'plain';

export type IssueCardLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  readonly href: string;
};

/** Draws the link; a plain anchor by default, a router link in an application. */
export type IssueCardLink = (props: IssueCardLinkProps) => ReactElement;

export interface IssueCardLabels {
  /** No priority shows nothing, so it has no word. */
  readonly priorities: Readonly<
    Record<Exclude<IssueTablePriority, 'none'>, string>
  >;
  /** `{{date}}` is the due date. */
  readonly due: string;
  /** `{{date}}` is the due date. */
  readonly overdue: string;
  readonly owner: string;
  readonly executor: string;
  readonly loading: string;
}

export interface IssueCardProps {
  readonly issue: IssueCardIssue;
  readonly size?: IssueCardSize;
  readonly appearance?: IssueCardAppearance;
  /** Where the issue leads: the card becomes a link. */
  readonly href?: string;
  /** A plain click: with `href`, instead of following it (modifier clicks still open it); without, the card is a button. */
  readonly onSelect?: (issue: IssueCardIssue, event: MouseEvent) => void;
  readonly link?: IssueCardLink;
  /** Before the identifier, such as an icon. */
  readonly leading?: ReactNode;
  /** Small marks after the title (a row) or under the labels (a card), such as where the issue is deployed. */
  readonly marks?: ReactNode;
  /** At the end, such as a "Remove" button. */
  readonly trailing?: ReactNode;
  /** The language the due date is written in. */
  readonly locale?: string;
  /** Replaces the translated words. */
  readonly labels?: Partial<IssueCardLabels>;
  readonly className?: string;
}

const PlainLink: IssueCardLink = (props) => <a {...props} />;

const LABEL_DOT: Readonly<Record<IssueTableColor, string>> = {
  gray: 'bg-muted-foreground/50',
  red: 'bg-red-500 dark:bg-red-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
  yellow: 'bg-amber-500 dark:bg-amber-400',
  green: 'bg-emerald-500 dark:bg-emerald-400',
  blue: 'bg-blue-500 dark:bg-blue-400',
  purple: 'bg-violet-500 dark:bg-violet-400',
};

function useIssueCardLabels(
  override: Partial<IssueCardLabels> | undefined,
): IssueCardLabels {
  const { t } = useTranslation();
  return {
    priorities: override?.priorities ?? {
      urgent: t('issueCard.priority.urgent', { defaultValue: 'Urgent' }),
      high: t('issueCard.priority.high', { defaultValue: 'High' }),
      medium: t('issueCard.priority.medium', { defaultValue: 'Medium' }),
      low: t('issueCard.priority.low', { defaultValue: 'Low' }),
    },
    // `{{date}}` stays a placeholder here, filled the same way for a translation and an override.
    due:
      override?.due ??
      t('issueCard.due', { defaultValue: 'Due {{date}}', date: '{{date}}' }),
    overdue:
      override?.overdue ??
      t('issueCard.overdue', {
        defaultValue: 'Overdue since {{date}}',
        date: '{{date}}',
      }),
    owner: override?.owner ?? t('issueCard.owner', { defaultValue: 'Owner' }),
    executor:
      override?.executor ??
      t('issueCard.executor', { defaultValue: 'Executor' }),
    loading:
      override?.loading ??
      t('issueCard.loading', { defaultValue: 'Loading issue' }),
  };
}

function plainClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/** Today in the viewer's time zone, as `YYYY-MM-DD`. */
function today(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function DueDate({
  value,
  locale,
  labels,
}: {
  readonly value: string;
  readonly locale: string | undefined;
  readonly labels: IssueCardLabels;
}): ReactElement {
  const day = value.slice(0, 10);
  const [year, month, date] = day.split('-').map(Number);
  const text = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(year ?? 0, (month ?? 1) - 1, date ?? 1));
  const overdue = day < today();
  const description = (overdue ? labels.overdue : labels.due).replace(
    '{{date}}',
    text,
  );
  return (
    <span
      data-overdue={overdue || undefined}
      title={description}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 text-xs whitespace-nowrap text-muted-foreground tabular-nums',
        overdue && 'text-destructive',
      )}
    >
      <CalendarIcon aria-hidden className='size-3.5' />
      <span aria-hidden>{text}</span>
      <span className='sr-only'>{description}</span>
    </span>
  );
}

function Person({
  role,
  person,
}: {
  readonly role: string;
  readonly person: IssueTablePerson;
}): ReactElement {
  return (
    <span
      className='flex min-w-0 items-center'
      title={`${role}: ${person.name}`}
    >
      <span className='sr-only'>{role}: </span>
      <IssuePerson person={person} fallback='' />
    </span>
  );
}

function Priority({
  priority,
  labels,
}: {
  readonly priority: IssueTablePriority | undefined;
  readonly labels: IssueCardLabels;
}): ReactElement | null {
  if (!priority || priority === 'none') return null;
  const label = labels.priorities[priority];
  return (
    <span className='inline-flex shrink-0' title={label}>
      <IssuePriority priority={priority} label='' className='gap-0' />
      <span className='sr-only'>{label}</span>
    </span>
  );
}

function Labels({
  labels,
  className,
}: {
  readonly labels: IssueCardIssue['labels'];
  readonly className?: string;
}): ReactElement | null {
  if (!labels || labels.length === 0) return null;
  return (
    <span className={cn('flex min-w-0 flex-wrap gap-1', className)}>
      {labels.slice(0, 3).map((label) => (
        <Badge key={label.id} variant='outline' className='font-normal'>
          <span
            aria-hidden
            className={cn('size-1.5 rounded-full', LABEL_DOT[label.color])}
          />
          {label.name}
        </Badge>
      ))}
      {labels.length > 3 ? (
        <span className='self-center text-xs text-muted-foreground'>
          +{labels.length - 3}
        </span>
      ) : null}
    </span>
  );
}

/** The title, and with `href` or `onSelect` the link or button whose hit area covers the whole card. */
function Title({
  issue,
  href,
  onSelect,
  link: Link,
  className,
}: {
  readonly issue: IssueCardIssue;
  readonly href: string | undefined;
  readonly onSelect: IssueCardProps['onSelect'];
  readonly link: IssueCardLink;
  readonly className: string;
}): ReactElement {
  // Named by its identifier and title, whatever the link renderer forwards; the visible identifier is hidden instead.
  const name = (
    <>
      <span className='sr-only'>{issue.identifier}</span> {issue.title}
    </>
  );
  // The pseudo-element stretches over the card (its `relative` root); `marks` and `trailing` sit above it.
  const cover =
    'outline-none hover:underline after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring';
  if (href)
    return (
      <Link
        href={href}
        title={issue.title}
        // Dragging the card, as on a board, must not drag the link instead.
        draggable={false}
        className={cn(className, cover)}
        onClick={(event) => {
          if (!onSelect || !plainClick(event)) return;
          event.preventDefault();
          onSelect(issue, event);
        }}
      >
        {name}
      </Link>
    );
  if (onSelect)
    return (
      <button
        type='button'
        title={issue.title}
        className={cn('text-left', className, cover)}
        onClick={(event) => onSelect(issue, event)}
      >
        {name}
      </button>
    );
  return (
    <span className={className} title={issue.title}>
      {issue.title}
    </span>
  );
}

export function IssueCard({
  issue,
  size = 'row',
  appearance = 'framed',
  href,
  onSelect,
  link = PlainLink,
  leading,
  marks,
  trailing,
  locale,
  labels: labelOverrides,
  className,
}: IssueCardProps): ReactElement {
  const labels = useIssueCardLabels(labelOverrides);
  const interactive = Boolean(href || onSelect);
  const framed = appearance === 'framed';
  const people = (
    <>
      {issue.owner ? <Person role={labels.owner} person={issue.owner} /> : null}
      {issue.executor ? (
        <Person role={labels.executor} person={issue.executor} />
      ) : null}
    </>
  );
  const identifier = (
    <span
      aria-hidden={interactive || undefined}
      className={cn(
        'shrink-0 font-mono text-muted-foreground',
        size === 'card' ? 'text-[11px]' : 'text-xs',
      )}
    >
      {issue.identifier}
    </span>
  );
  const above = 'relative z-10';
  // Marks that render nothing take no room, so a card keeps no empty gap for them.
  const markSlot = cn(
    above,
    'flex empty:hidden has-[>:empty:only-child]:hidden',
  );

  if (size === 'card')
    return (
      <div
        data-issue={issue.identifier}
        data-size='card'
        className={cn(
          'relative flex flex-col gap-2 p-3',
          framed &&
            'rounded-lg bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10',
          framed && interactive && 'hover:ring-foreground/20',
          className,
        )}
      >
        <div className='flex min-w-0 items-center gap-2'>
          {leading ? (
            <span className='flex shrink-0 text-muted-foreground [&>svg]:size-4'>
              {leading}
            </span>
          ) : null}
          {identifier}
          {issue.status ? <IssueStatusBadge status={issue.status} /> : null}
          <span className='ml-auto flex shrink-0 items-center gap-1.5'>
            <Priority priority={issue.priority} labels={labels} />
            {trailing ? <span className={above}>{trailing}</span> : null}
          </span>
        </div>
        <p className='line-clamp-3 text-sm leading-snug font-medium'>
          <Title
            issue={issue}
            href={href}
            onSelect={onSelect}
            link={link}
            className=''
          />
        </p>
        <Labels labels={issue.labels} />
        {marks ? <div className={markSlot}>{marks}</div> : null}
        {issue.owner || issue.executor || issue.dueDate ? (
          <div className='flex min-w-0 items-center gap-3 text-xs text-muted-foreground'>
            {people}
            {issue.dueDate ? (
              <span className='ml-auto'>
                <DueDate
                  value={issue.dueDate}
                  locale={locale}
                  labels={labels}
                />
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );

  return (
    <div
      data-issue={issue.identifier}
      data-size='row'
      className={cn(
        'relative flex min-w-0 items-center gap-2 text-sm',
        framed && 'min-h-9 rounded-md border bg-background px-2.5 py-1.5',
        framed && interactive && 'hover:bg-muted',
        className,
      )}
    >
      {leading ? (
        <span className='flex shrink-0 text-muted-foreground [&>svg]:size-4'>
          {leading}
        </span>
      ) : null}
      {identifier}
      <Title
        issue={issue}
        href={href}
        onSelect={onSelect}
        link={link}
        className='min-w-0 flex-1 truncate'
      />
      {marks ? (
        <span className={cn(markSlot, 'shrink-0 items-center gap-1')}>
          {marks}
        </span>
      ) : null}
      <Labels
        labels={issue.labels}
        className='shrink-0 flex-nowrap max-md:hidden'
      />
      {issue.status ? (
        <IssueStatusBadge status={issue.status} className='shrink-0' />
      ) : null}
      <Priority priority={issue.priority} labels={labels} />
      {issue.dueDate ? (
        <DueDate value={issue.dueDate} locale={locale} labels={labels} />
      ) : null}
      {issue.owner || issue.executor ? (
        <span className='flex max-w-64 min-w-0 shrink items-center gap-3 max-sm:hidden'>
          {people}
        </span>
      ) : null}
      {trailing ? (
        <span className={cn(above, 'flex shrink-0 items-center gap-1')}>
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

/** The card's place while its issue loads. */
export function IssueCardSkeleton({
  size = 'row',
  appearance = 'framed',
  labels: labelOverrides,
  className,
}: {
  readonly size?: IssueCardSize;
  readonly appearance?: IssueCardAppearance;
  readonly labels?: Partial<IssueCardLabels>;
  readonly className?: string;
}): ReactElement {
  const labels = useIssueCardLabels(labelOverrides);
  const framed = appearance === 'framed';
  return (
    <div
      role='status'
      aria-label={labels.loading}
      data-size={size}
      className={cn(
        size === 'card'
          ? cn(
              'flex flex-col gap-2 p-3',
              framed &&
                'rounded-lg bg-card shadow-xs ring-1 ring-foreground/10',
            )
          : cn(
              'flex items-center gap-2',
              framed && 'min-h-9 rounded-md border bg-background px-2.5 py-1.5',
            ),
        className,
      )}
    >
      <Skeleton className='h-3.5 w-12 shrink-0' />
      <Skeleton className={cn('h-4', size === 'card' ? 'w-4/5' : 'flex-1')} />
      {size === 'card' ? <Skeleton className='h-4 w-1/2' /> : null}
    </div>
  );
}
