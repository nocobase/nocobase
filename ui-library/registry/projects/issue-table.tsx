/**
 * The issues list as a table: identifier, title with labels, status, priority, owner, executor and when it was last
 * updated. Purely presentational: the consumer gives the rows (mapped from the projects plugin's issues, for
 * instance), the order and the selection, and hears about clicks, order changes and selection changes. Every word it
 * shows comes from `labels`, English by default.
 */
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  BotIcon,
  SignalHighIcon,
  SignalLowIcon,
  SignalMediumIcon,
  SignalZeroIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import type { MouseEvent, ReactElement, ReactNode } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '#components/ui/avatar';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { Checkbox } from '#components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import { cn } from 'cn';

/** The colours statuses and labels take, as the projects plugin names them. */
export type IssueTableColor =
  'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export type IssueTablePriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export interface IssueTablePerson {
  readonly name: string;
  readonly avatar?: string | null;
  /** `agent` draws a bot; a person shows their picture, or the name alone without one. */
  readonly kind?: string;
}

export interface IssueTableRow {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly labels: readonly {
    readonly id: string;
    readonly name: string;
    readonly color: IssueTableColor;
  }[];
  readonly status: {
    readonly name: string;
    readonly color: IssueTableColor;
  } | null;
  readonly priority: IssueTablePriority;
  readonly owner: IssueTablePerson | null;
  readonly executor: IssueTablePerson | null;
  /** ISO time. */
  readonly updatedAt: string;
}

export type IssueTableSortColumn = 'identifier' | 'priority' | 'updated';

export interface IssueTableSort {
  readonly column: IssueTableSortColumn;
  readonly direction: 'asc' | 'desc';
}

export interface IssueTableLabels {
  readonly identifier: string;
  readonly title: string;
  readonly status: string;
  readonly priority: string;
  readonly owner: string;
  readonly executor: string;
  readonly updated: string;
  readonly selectAll: string;
  readonly selectRow: string;
  readonly unassigned: string;
  readonly empty: string;
  readonly priorities: Readonly<Record<IssueTablePriority, string>>;
}

const defaultIssueTableLabels: IssueTableLabels = {
  identifier: 'ID',
  title: 'Title',
  status: 'Status',
  priority: 'Priority',
  owner: 'Owner',
  executor: 'Executor',
  updated: 'Updated',
  selectAll: 'Select all',
  selectRow: 'Select {identifier}',
  unassigned: '—',
  empty: 'No issues',
  priorities: {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    none: 'No priority',
  },
};

/** A pale tint behind a darker ink of the same hue; a dim wash behind a lighter ink in dark mode. */
const issueColorClass: Readonly<Record<IssueTableColor, string>> = {
  gray: 'bg-muted text-muted-foreground',
  red: 'bg-red-500/10 text-red-700 dark:bg-red-400/15 dark:text-red-300',
  orange:
    'bg-orange-500/10 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300',
  yellow:
    'bg-amber-500/12 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  green:
    'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  blue: 'bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  purple:
    'bg-violet-500/10 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
};

/** The ink alone, for dots. */
const issueColorDotClass: Readonly<Record<IssueTableColor, string>> = {
  gray: 'bg-muted-foreground/60',
  red: 'bg-red-500 dark:bg-red-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
  yellow: 'bg-amber-500 dark:bg-amber-400',
  green: 'bg-emerald-500 dark:bg-emerald-400',
  blue: 'bg-blue-500 dark:bg-blue-400',
  purple: 'bg-violet-500 dark:bg-violet-400',
};

const PRIORITY_ICON: Readonly<
  Record<IssueTablePriority, (props: { className?: string }) => ReactNode>
> = {
  urgent: (props) => <TriangleAlertIcon {...props} />,
  high: (props) => <SignalHighIcon {...props} />,
  medium: (props) => <SignalMediumIcon {...props} />,
  low: (props) => <SignalLowIcon {...props} />,
  none: (props) => <SignalZeroIcon {...props} />,
};

export function IssueStatusBadge({
  status,
  className,
}: {
  readonly status: NonNullable<IssueTableRow['status']>;
  readonly className?: string;
}): ReactElement {
  return (
    <Badge
      variant='secondary'
      className={cn(issueColorClass[status.color], className)}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          issueColorDotClass[status.color],
        )}
      />
      {status.name}
    </Badge>
  );
}

export function IssuePriority({
  priority,
  label,
  className,
}: {
  readonly priority: IssueTablePriority;
  readonly label: string;
  readonly className?: string;
}): ReactElement {
  const Icon = PRIORITY_ICON[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm',
        priority === 'none' && 'text-muted-foreground',
        className,
      )}
    >
      <Icon
        className={cn(
          'size-3.5 shrink-0',
          priority === 'urgent'
            ? 'text-red-600 dark:text-red-400'
            : 'text-muted-foreground',
        )}
      />
      {label}
    </span>
  );
}

export function IssuePerson({
  person,
  fallback,
}: {
  readonly person: IssueTablePerson | null;
  readonly fallback: string;
}): ReactElement {
  if (!person) return <span className='text-muted-foreground'>{fallback}</span>;
  const agent = person.kind === 'agent';
  // Initials beside the name say nothing more, so a person without a picture shows the name alone.
  if (!agent && !person.avatar)
    return <span className='truncate text-sm'>{person.name}</span>;
  return (
    <span className='flex min-w-0 items-center gap-2 text-sm'>
      <Avatar
        size='sm'
        aria-hidden
        className={cn(agent && 'rounded-md after:rounded-md')}
      >
        {person.avatar ? (
          <AvatarImage
            src={person.avatar}
            alt=''
            className={cn(agent && 'rounded-md')}
          />
        ) : null}
        <AvatarFallback className={cn(agent && 'rounded-md')}>
          {agent ? <BotIcon className='size-3.5' /> : null}
        </AvatarFallback>
      </Avatar>
      <span className='truncate'>{person.name}</span>
    </span>
  );
}

function SortButton({
  column,
  title,
  sort,
  onSortChange,
}: {
  readonly column: IssueTableSortColumn;
  readonly title: string;
  readonly sort: IssueTableSort | undefined;
  readonly onSortChange: ((sort: IssueTableSort) => void) | undefined;
}): ReactElement {
  if (!onSortChange) return <>{title}</>;
  const active = sort?.column === column;
  const Icon = !active
    ? ArrowUpDownIcon
    : sort.direction === 'asc'
      ? ArrowUpIcon
      : ArrowDownIcon;
  return (
    <Button
      variant='ghost'
      size='sm'
      className='-ml-2 h-7 border-transparent px-2 font-medium text-foreground shadow-none'
      data-active={active || undefined}
      onClick={() =>
        onSortChange({
          column,
          direction: active && sort.direction === 'desc' ? 'asc' : 'desc',
        })
      }
    >
      {title}
      <Icon data-icon='inline-end' className={cn(!active && 'opacity-50')} />
    </Button>
  );
}

export interface IssueTableProps {
  readonly rows: readonly IssueTableRow[];
  /** The order the rows are in, shown on the column headers. */
  readonly sort?: IssueTableSort;
  /** Makes the identifier, priority and updated headers sortable; the consumer reorders (usually on the server). */
  readonly onSortChange?: (sort: IssueTableSort) => void;
  /** Checkboxes when given, with the ids that are checked. */
  readonly selectedIds?: ReadonlySet<string>;
  readonly onSelectedIdsChange?: (ids: ReadonlySet<string>) => void;
  /** Where a row leads: the identifier becomes a link, so rows are keyboard-reachable. */
  readonly rowHref?: (row: IssueTableRow) => string;
  /** A plain click on a row or its link (modifier clicks keep the browser's behaviour for links). */
  readonly onRowClick?: (row: IssueTableRow, event: MouseEvent) => void;
  /** Something at the end of a row, such as a "Restore" button. */
  readonly rowAction?: (row: IssueTableRow) => ReactNode;
  /** Small marks after a row's title and labels, such as where the issue is deployed. */
  readonly rowMarks?: (row: IssueTableRow) => ReactNode;
  /** What shows when there are no rows; `labels.empty` by default. */
  readonly empty?: ReactNode;
  /** The language dates are written in. */
  readonly locale?: string;
  readonly labels?: IssueTableLabels;
  readonly className?: string;
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

export function IssueTable({
  rows,
  sort,
  onSortChange,
  selectedIds,
  onSelectedIdsChange,
  rowHref,
  onRowClick,
  rowAction,
  rowMarks,
  empty,
  locale,
  labels = defaultIssueTableLabels,
  className,
}: IssueTableProps): ReactElement {
  const selectable = selectedIds !== undefined && onSelectedIdsChange;
  const allChecked =
    selectable &&
    rows.length > 0 &&
    rows.every((row) => selectedIds.has(row.id));
  const someChecked =
    selectable && !allChecked && rows.some((row) => selectedIds.has(row.id));
  const date = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  });
  const columns = 7 + (selectable ? 1 : 0) + (rowAction ? 1 : 0);

  function toggle(id: string, checked: boolean): void {
    if (!selectable) return;
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectedIdsChange(next);
  }

  return (
    // `isolate` keeps the sticky header's z-index inside the table, so a page laid over the list (a covering child
    // route) is not painted under it.
    <Table className={cn('isolate', className)}>
      <TableHeader className='sticky top-0 z-10 bg-background'>
        <TableRow className='hover:bg-transparent'>
          {selectable ? (
            <TableHead className='w-8'>
              <Checkbox
                aria-label={labels.selectAll}
                checked={allChecked}
                indeterminate={someChecked}
                onCheckedChange={(checked) =>
                  onSelectedIdsChange(
                    checked ? new Set(rows.map((row) => row.id)) : new Set(),
                  )
                }
              />
            </TableHead>
          ) : null}
          <TableHead className='w-24'>
            <SortButton
              column='identifier'
              title={labels.identifier}
              sort={sort}
              onSortChange={onSortChange}
            />
          </TableHead>
          <TableHead className='w-full min-w-48'>{labels.title}</TableHead>
          <TableHead className='w-32'>{labels.status}</TableHead>
          <TableHead className='w-28'>
            <SortButton
              column='priority'
              title={labels.priority}
              sort={sort}
              onSortChange={onSortChange}
            />
          </TableHead>
          <TableHead className='w-40 max-md:hidden'>{labels.owner}</TableHead>
          <TableHead className='w-44 max-md:hidden'>
            {labels.executor}
          </TableHead>
          <TableHead className='w-24'>
            <SortButton
              column='updated'
              title={labels.updated}
              sort={sort}
              onSortChange={onSortChange}
            />
          </TableHead>
          {rowAction ? <TableHead className='w-24' /> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className='hover:bg-transparent'>
            <TableCell
              colSpan={columns}
              className='h-32 text-center text-muted-foreground'
            >
              {empty ?? labels.empty}
            </TableCell>
          </TableRow>
        ) : null}
        {rows.map((row) => {
          const href = rowHref?.(row);
          const checked = selectedIds?.has(row.id) ?? false;
          return (
            <TableRow
              key={row.id}
              data-state={checked ? 'selected' : undefined}
              className={cn(onRowClick && 'cursor-pointer')}
              onClick={(event) => {
                if (onRowClick && plainClick(event)) onRowClick(row, event);
              }}
            >
              {selectable ? (
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    aria-label={labels.selectRow.replace(
                      '{identifier}',
                      row.identifier,
                    )}
                    checked={checked}
                    onCheckedChange={(next) => toggle(row.id, next)}
                  />
                </TableCell>
              ) : null}
              <TableCell>
                {href ? (
                  <a
                    href={href}
                    className='font-mono text-xs text-muted-foreground hover:text-foreground hover:underline'
                    onClick={(event) => {
                      event.stopPropagation();
                      if (onRowClick && plainClick(event)) {
                        event.preventDefault();
                        onRowClick(row, event);
                      }
                    }}
                  >
                    {row.identifier}
                  </a>
                ) : (
                  <span className='font-mono text-xs text-muted-foreground'>
                    {row.identifier}
                  </span>
                )}
              </TableCell>
              <TableCell className='max-w-0'>
                <div className='flex min-w-0 items-center gap-2'>
                  <span className='truncate font-medium' title={row.title}>
                    {row.title}
                  </span>
                  {row.labels.length > 0 ? (
                    <span className='flex shrink-0 gap-1 max-md:hidden'>
                      {row.labels.slice(0, 3).map((label) => (
                        <Badge
                          key={label.id}
                          variant='secondary'
                          className={issueColorClass[label.color]}
                        >
                          {label.name}
                        </Badge>
                      ))}
                      {row.labels.length > 3 ? (
                        <span className='text-xs text-muted-foreground'>
                          +{row.labels.length - 3}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  {rowMarks ? (
                    <span className='flex shrink-0 items-center gap-1 empty:hidden'>
                      {rowMarks(row)}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                {row.status ? (
                  <IssueStatusBadge status={row.status} />
                ) : (
                  <span className='text-muted-foreground'>
                    {labels.unassigned}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <IssuePriority
                  priority={row.priority}
                  label={labels.priorities[row.priority]}
                />
              </TableCell>
              <TableCell className='max-w-40 max-md:hidden'>
                <IssuePerson person={row.owner} fallback={labels.unassigned} />
              </TableCell>
              <TableCell className='max-w-44 max-md:hidden'>
                <IssuePerson
                  person={row.executor}
                  fallback={labels.unassigned}
                />
              </TableCell>
              <TableCell
                className='text-sm whitespace-nowrap text-muted-foreground tabular-nums'
                title={new Date(row.updatedAt).toLocaleString(locale)}
              >
                {date.format(new Date(row.updatedAt))}
              </TableCell>
              {rowAction ? (
                <TableCell
                  className='text-right'
                  onClick={(event) => event.stopPropagation()}
                >
                  {rowAction(row)}
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
