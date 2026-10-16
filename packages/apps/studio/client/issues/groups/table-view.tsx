/**
 * The table of the issue lists (`?view=list`), grouped as the split view groups (`GET /api/taskGroups?mode=table`):
 * each group starts with a full-width heading row like the split view's card heading ("Waiting for you" warm), then a
 * row per task tree's root. A root with sub-tasks has its own expand button, its finished-over-all count and a small
 * bar; expanded, its children follow, indented and joined to it by a line, each with its own status, priority, owner,
 * executor and time, and expanding further. A tree that holds a task waiting for the viewer opens down to it; the
 * person's own choice to expand or fold a task wins and is remembered. A task outside the filter that only places the
 * others shows quiet, tagged "Context", and counts nowhere. A plain click on a row opens the task's page; the expand
 * button does not.
 */
import {
  findStatus,
  statusTone,
  useStatusName,
  withIssueSort,
  type IssueFilters,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  PmEmpty,
  PmListSkeleton,
  PmLoadError,
  pmKeys,
  usePmApi,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon, ChevronRightIcon, ListTodoIcon } from 'lucide-react';
import {
  useContext,
  useLayoutEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  IssueTable,
  type IssueTableLabels,
  type IssueTableProps,
  type IssueTableRow,
  type IssueTableSortColumn,
} from '@/components/issue-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from 'cn';

import type {
  TaskChildrenPage,
  TaskGroupId,
  TaskGroupItem,
} from '../../../shared/task-groups.js';
import { IssueMarks } from '../issue-marks.js';
import { issueTableRow } from '../rows.js';
import { TableCreateStateContext } from '../table-create-state.js';
import { useIssueAgentWork } from '../use-agent-work.js';
import type { IssuesPage } from '../use-issues-page.js';
import {
  childrenKey,
  isChanged,
  isRecoverable,
  useTaskChildren,
  useTaskGroups,
} from './api.js';
import { useExpandedTasks, useFoldedGroups } from './prefs.js';
import { GroupIcon, WaitChip } from './task-list.js';

const SORTS = {
  identifier: 'number',
  priority: 'priority',
  updated: 'updated',
} as const;
const COLUMNS = {
  number: 'identifier',
  priority: 'priority',
  updated: 'updated',
  created: null,
} as const;

/** How many child pages of 50 each expanded task shows. */
type ChildPages = Readonly<Record<string, number>>;

export function GroupedTableView({
  page,
  pageKey,
  follow,
  issueHref,
  onOpen,
  empty,
}: {
  readonly page: IssuesPage;
  readonly pageKey: string;
  readonly follow: 'all' | 'scope';
  readonly issueHref: (id: string) => string;
  /** Opens a task's page, with the rows in their order for its previous and next. */
  readonly onOpen: (id: string, order?: readonly string[]) => void;
  readonly empty: { title: string; description: string; action?: ReactNode };
}): ReactElement {
  const { t, i18n } = useTranslation();
  const reportCreate = useContext(TableCreateStateContext);
  const pm = usePmApi();
  const statusName = useStatusName();
  const filters: IssueFilters = page.filters;
  const [pages, setPages] = useState<Partial<Record<TaskGroupId, number>>>({});
  const roots = useTaskGroups({ filters, mode: 'table', follow, pages });
  const folded = useFoldedGroups(`${pageKey}:table`);
  const expansion = useExpandedTasks();
  const [childPages, setChildPages] = useState<ChildPages>({});
  const statuses = useQuery({
    queryKey: pmKeys.statuses,
    queryFn: () => pm.statuses(),
  });
  const data = roots.data;

  // The tasks to open by default: down to every task waiting for the viewer.
  const opened = new Set<string>();
  for (const group of data?.groups ?? [])
    for (const item of group.data) for (const id of item.expand) opened.add(id);
  const isOpen = (id: string) => expansion.isExpanded(id, opened.has(id));

  // The expanded tasks whose children are read: the expanded roots, then, breadth first, the expanded children among
  // those already read (the cache); each child page arriving renders again and reaches one level further.
  const client = useQueryClient();
  const parents: { id: string; pages: number }[] = [];
  const queue: string[] = [];
  for (const group of data?.groups ?? [])
    if (!folded.isFolded(group.group))
      for (const item of group.data)
        if (item.hasChildren && isOpen(item.issue.id))
          queue.push(item.issue.id);
  const seen = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const count = childPages[id] ?? 1;
    parents.push({ id, pages: count });
    const cached = client.getQueryData<TaskChildrenPage>(
      childrenKey(filters, follow, id, count),
    );
    for (const child of cached?.data ?? [])
      if (child.hasChildren && isOpen(child.issue.id))
        queue.push(child.issue.id);
  }
  const childQueries = useTaskChildren(
    filters,
    follow,
    data?.generation,
    parents,
  );

  const all: TaskGroupItem[] = [];
  for (const group of data?.groups ?? []) all.push(...group.data);
  for (const [, query] of childQueries) all.push(...(query.data?.data ?? []));
  const items = new Map(all.map((item) => [item.issue.id, item]));
  const work = useIssueAgentWork(
    [...items.values()].map((item) => item.issue),
    JSON.stringify(filters),
  );

  const total = (data?.groups ?? []).reduce(
    (sum, group) => sum + group.count,
    0,
  );
  useLayoutEffect(() => {
    reportCreate?.(Boolean(data) && (page.filtered || total > 0));
  }, [reportCreate, data, page.filtered, total]);

  if (!data) {
    if (roots.isError)
      return (
        <PmLoadError
          title={t('taskGroups.loadFailed')}
          error={roots.error}
          {...(isRecoverable(roots.error)
            ? { onRetry: () => void roots.refetch() }
            : {})}
        />
      );
    return <PmListSkeleton />;
  }
  if (
    total === 0 &&
    !page.filtered &&
    data.groups.every((g) => g.data.length === 0)
  )
    return (
      <PmEmpty
        icon={<ListTodoIcon />}
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );

  type Entry = NonNullable<IssueTableProps['entries']>[number];
  const entries: Entry[] = [];
  const depths = new Map<string, number>();
  const rowFor = (item: TaskGroupItem): IssueTableRow =>
    issueTableRow(
      item.issue,
      findStatus(statuses.data, item.issue.statusKey)
        ? statuses.data
        : undefined,
      { statusName, statusTone },
    );
  const keyed = new Map<string, TaskGroupItem>();

  function addTree(item: TaskGroupItem, depth: number, path: string) {
    const key = `${path}/${item.issue.id}`;
    depths.set(key, depth);
    keyed.set(key, item);
    entries.push({ ...rowFor(item), rowKey: key });
    if (!item.hasChildren || !isOpen(item.issue.id)) return;
    const query = childQueries.get(item.issue.id);
    if (!query) return;
    if (query.data)
      for (const child of query.data.data) addTree(child, depth + 1, key);
    if (query.isError && !isChanged(query.error))
      entries.push({
        key: `error:${key}`,
        content: (
          <Indented depth={depth + 1}>
            <PmLoadError
              title={t('taskGroups.table.childrenFailed')}
              error={query.error}
              {...(isRecoverable(query.error)
                ? { onRetry: () => void query.refetch() }
                : {})}
            />
          </Indented>
        ),
      });
    else if (query.isPending || (query.isError && isChanged(query.error)))
      entries.push({
        key: `loading:${key}`,
        content: (
          <Indented depth={depth + 1}>
            <span
              role='status'
              className='flex items-center gap-2 text-xs text-muted-foreground'
            >
              <Spinner />
              {t('taskGroups.table.loadingChildren')}
            </span>
          </Indented>
        ),
      });
    else if (query.data?.nextCursor) {
      const shown = query.data.data.length;
      entries.push({
        key: `more:${key}`,
        content: (
          <Indented depth={depth + 1}>
            <Button
              variant='ghost'
              size='xs'
              disabled={query.isFetching}
              onClick={() =>
                setChildPages((current) => ({
                  ...current,
                  [item.issue.id]: (current[item.issue.id] ?? 1) + 1,
                }))
              }
            >
              {t('taskGroups.table.moreChildren', {
                count: Math.max(0, item.progress.total - shown),
              })}
            </Button>
          </Indented>
        ),
      });
    }
  }

  for (const group of data.groups) {
    const isFolded = folded.isFolded(group.group);
    const title = t(`taskGroups.groups.${group.group}`);
    const warm = group.group === 'wait';
    entries.push({
      key: `group:${group.group}`,
      className: cn(
        'bg-muted/60 p-0',
        warm && 'bg-amber-50 dark:bg-amber-950/40',
      ),
      content: (
        <button
          type='button'
          data-group-heading={group.group}
          aria-expanded={!isFolded}
          aria-label={t(isFolded ? 'taskGroups.unfold' : 'taskGroups.fold', {
            group: title,
          })}
          onClick={() => folded.toggle(group.group)}
          className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
        >
          <GroupIcon group={group.group} />
          <span>{title}</span>
          <span
            className={cn(
              'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums',
              warm
                ? 'bg-amber-500/20 font-semibold text-amber-800 dark:text-amber-300'
                : 'bg-background font-medium text-muted-foreground',
            )}
          >
            {group.count}
          </span>
          <ChevronDownIcon
            aria-hidden
            className={cn(
              'ml-auto size-4 text-muted-foreground transition-transform',
              isFolded && '-rotate-90',
            )}
          />
        </button>
      ),
    });
    if (isFolded) continue;
    for (const item of group.data) addTree(item, 0, group.group);
    if (group.nextCursor)
      entries.push({
        key: `group-more:${group.group}`,
        content: (
          <Button
            variant='ghost'
            size='sm'
            disabled={roots.isFetching}
            onClick={() =>
              setPages((current) => ({
                ...current,
                [group.group]: (current[group.group] ?? 1) + 1,
              }))
            }
          >
            {t('taskGroups.loadMore')}
          </Button>
        ),
      });
  }
  if (total === 0 && data.groups.every((group) => group.data.length === 0))
    entries.push({
      key: 'empty',
      content: (
        <div className='flex flex-col items-center gap-2 py-6'>
          <span>{t('issuesPage.noResults')}</span>
          <Button variant='outline' size='sm' onClick={page.clearFilters}>
            {t('issuesPage.clearFilters')}
          </Button>
        </div>
      ),
    });

  const sortColumn: IssueTableSortColumn | null =
    COLUMNS[page.filters.sort ?? 'updated'];
  const itemOf = (row: IssueTableRow) =>
    keyed.get(row.rowKey ?? '') ?? items.get(row.id);
  const depthOf = (row: IssueTableRow) => depths.get(row.rowKey ?? '') ?? 0;
  return (
    <div
      className='flex h-full min-h-0 flex-col gap-3'
      data-testid='grouped-table'
    >
      {roots.isError ? (
        <PmLoadError
          title={t('taskGroups.refreshFailed')}
          error={roots.error}
          {...(isRecoverable(roots.error)
            ? { onRetry: () => void roots.refetch() }
            : {})}
        />
      ) : null}
      <div className='min-h-0 flex-1 overflow-auto overscroll-y-contain'>
        <IssueTable
          rows={entries.filter(
            (entry): entry is IssueTableRow => 'id' in entry,
          )}
          entries={entries}
          labels={
            t('issuesPage.table', {
              returnObjects: true,
            }) as unknown as IssueTableLabels
          }
          locale={i18n.language}
          {...(sortColumn
            ? {
                sort: {
                  column: sortColumn,
                  direction: page.filters.direction ?? 'desc',
                },
              }
            : {})}
          onSortChange={(sort) =>
            page.updateParams((current) =>
              withIssueSort(current, SORTS[sort.column], sort.direction),
            )
          }
          rowHref={(row) => issueHref(row.id)}
          onRowClick={(row) =>
            onOpen(
              row.id,
              // The rows as shown, without the tasks drawn only to place others.
              [...keyed.values()]
                .filter((item) => !item.context)
                .map((item) => item.issue.id),
            )
          }
          rowClassName={(row) =>
            itemOf(row)?.context
              ? 'text-muted-foreground [&_.font-medium]:font-normal'
              : undefined
          }
          rowLeading={(row) => {
            const item = itemOf(row);
            const depth = depthOf(row);
            if (!item) return null;
            const open = isOpen(item.issue.id);
            const label = t(
              open ? 'taskGroups.table.collapse' : 'taskGroups.table.expand',
              {
                identifier: item.issue.identifier,
              },
            );
            return (
              <span
                className='relative inline-flex shrink-0 items-center'
                style={{
                  paddingInlineStart: `calc(var(--spacing) * ${5 * depth})`,
                }}
              >
                {depth > 0 ? (
                  <span
                    aria-hidden
                    className='absolute top-[-0.9rem] h-[1.4rem] w-2.5 rounded-bl-sm border-b border-l border-border'
                    style={{
                      insetInlineStart: `calc(var(--spacing) * ${5 * depth - 3})`,
                    }}
                  />
                ) : null}
                {item.hasChildren ? (
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    aria-expanded={open}
                    aria-label={label}
                    title={label}
                    data-task-toggle={item.issue.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      expansion.toggle(
                        item.issue.id,
                        opened.has(item.issue.id),
                      );
                    }}
                  >
                    {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </Button>
                ) : (
                  <span className='size-6' />
                )}
              </span>
            );
          }}
          rowMarks={(row) => {
            const item = itemOf(row);
            if (!item) return null;
            return (
              <>
                {item.progress.total > 0 ? (
                  <SubtaskProgress
                    finished={item.progress.finished}
                    total={item.progress.total}
                  />
                ) : null}
                {item.context ? (
                  <Badge
                    data-size='sm'
                    variant='outline'
                    title={t('taskGroups.table.contextHint')}
                  >
                    {t('taskGroups.table.context')}
                  </Badge>
                ) : null}
                {item.waits[0] ? (
                  <WaitChip reason={item.waits[0]} quiet />
                ) : null}
                <IssueMarks
                  issue={item.issue}
                  placement='row'
                  className='flex-nowrap'
                  {...(work.has(item.issue.id)
                    ? {
                        workingAgentName:
                          item.issue.executorName ?? work.get(item.issue.id)!,
                      }
                    : {})}
                />
              </>
            );
          }}
        />
      </div>
    </div>
  );
}

function Indented({
  depth,
  children,
}: {
  readonly depth: number;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div
      style={{ paddingInlineStart: `calc(var(--spacing) * ${5 * depth + 8})` }}
    >
      {children}
    </div>
  );
}

/** "2/3" and a short bar of the finished share. */
export function SubtaskProgress({
  finished,
  total,
}: {
  readonly finished: number;
  readonly total: number;
}): ReactElement {
  const { t } = useTranslation();
  const label = t('taskGroups.table.progress', { finished, total });
  return (
    <span
      className='inline-flex shrink-0 items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums'
      title={label}
      aria-label={label}
    >
      <span
        aria-hidden
        className='h-1 w-6 overflow-hidden rounded-full bg-muted'
      >
        <span
          className='block h-full rounded-full bg-emerald-500 dark:bg-emerald-400'
          style={{ width: `${total > 0 ? (finished / total) * 100 : 0}%` }}
        />
      </span>
      {finished}/{total}
    </span>
  );
}
