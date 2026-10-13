import {
  ApiClientError,
  realtimeClientToken,
  useApiClient,
  useService,
} from '@nocobase/app-client';
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
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { RUNNERS_TOPIC } from '@nocobase/app-plugin-agents/shared/realtime';
import { useTranslation } from '@nocobase/i18n/client';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon, ChevronRightIcon, ListTodoIcon } from 'lucide-react';
import {
  useEffect,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  IssueTable,
  type IssueTableLabels,
  type IssueTableProps,
  type IssueTableSortColumn,
} from '../components/issue-table.js';
import { Button } from '../components/ui/button.js';
import { Spinner } from '../components/ui/spinner.js';
import { Badge } from '../components/ui/badge.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../components/ui/tooltip.js';
import { STUDIO_INBOX_TOPIC } from '../../shared/inbox.js';
import {
  type TaskGroup,
  type TaskTreePage,
  type TaskTrees,
  type TaskTreeRow,
} from '../../shared/task-trees.js';
import { issueTableRow } from './rows.js';
import { IssueMarks } from './issue-marks.js';
import { useIssueAgentWork } from './use-agent-work.js';
import type { IssuesPage } from './use-issues-page.js';
import { TableCreateStateContext } from './table-create-state.js';

const KEYS = [...pmKeys.issues, 'studio-task-trees'] as const;
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
function queryOf(filters: IssueFilters): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([key, value]) =>
        key !== 'deleted' && typeof value === 'string' && value !== '',
    ) as [string, string][],
  );
}
function recoverable(error: unknown): boolean {
  return !(
    error instanceof ApiClientError && [401, 403, 404].includes(error.status)
  );
}
function stale(error: unknown): boolean {
  return (error as { reason?: string } | null)?.reason === 'TASK_TREE_CHANGED';
}

/** One complete server generation per refresh; pages/counts are never assembled from different generations. */
export function GroupedIssueListView({
  page,
  issueHref,
  onOpen,
  empty,
}: {
  readonly page: IssuesPage;
  readonly issueHref: (id: string) => string;
  readonly onOpen: (id: string) => void;
  readonly empty: { title: string; description: string; action?: ReactNode };
}) {
  const { t, i18n } = useTranslation();
  const reportCreate = useContext(TableCreateStateContext);
  const api = useApiClient();
  const pm = usePmApi();
  const client = useQueryClient();
  const realtime = useService(realtimeClientToken);
  const statusName = useStatusName();
  const [collapsed, setCollapsed] = useState<ReadonlySet<TaskGroup>>(
    () => new Set(),
  );
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [rootPages, setRootPages] = useState<Record<string, number>>({});
  const [childPages, setChildPages] = useState<Record<string, number>>({});
  const filters = queryOf(page.filters);
  const viewer = useViewer();
  const scope = JSON.stringify([filters, viewer?.userId, viewer?.permissions]);
  const frameRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<{
    element: HTMLElement;
    parentId: string | null;
  } | null>(null);
  useEffect(() => {
    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => void client.invalidateQueries({ queryKey: KEYS }),
        200,
      );
    };
    const stops = [
      realtime.subscribe(PM_REALTIME_TOPIC, refresh),
      realtime.subscribe(STUDIO_INBOX_TOPIC, refresh),
      realtime.subscribe(RUNNERS_TOPIC, refresh),
      realtime.onOpen(refresh),
    ];
    return () => {
      window.clearTimeout(timer);
      for (const stop of stops) stop?.();
    };
  }, [client, realtime]);
  const roots = useQuery({
    queryKey: [...KEYS, scope, rootPages],
    queryFn: async ({ signal }) => {
      const base = (
        await api.request<{ data: TaskTrees }>({
          path: 'taskTrees',
          query: filters,
          signal,
        })
      ).data;
      for (const group of base.groups) {
        let next = group.nextCursor;
        const rows = [...group.data];
        for (let n = 1; next && n < (rootPages[group.group] ?? 1); n++) {
          const part = (
            await api.request<{ data: TaskTrees }>({
              path: 'taskTrees',
              query: {
                ...filters,
                group: group.group,
                cursor: next,
                generation: base.generation,
              },
              signal,
            })
          ).data;
          const chunk = part.groups.find((g) => g.group === group.group)!;
          rows.push(...chunk.data);
          next = chunk.nextCursor;
        }
        // Build only after all continuation checks passed. No intermediate pages enter the cache.
        Object.assign(group, { data: rows, nextCursor: next });
      }
      return base;
    },
    retry: (count, error) => stale(error) && count < 1,
    placeholderData: (previous, query) =>
      query?.queryKey[KEYS.length] === scope ? previous : undefined,
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  });
  const generation = roots.data?.generation;
  useLayoutEffect(() => {
    reportCreate?.(
      !!roots.data &&
        (page.filtered ||
          roots.data.groups.some((group) => group.totals.tasks > 0)),
    );
  }, [reportCreate, roots.data, page.filtered]);
  const parentIds = [...expanded];
  const childQueries = useQueries({
    queries: parentIds.map((parentId) => ({
      queryKey: [
        ...KEYS,
        scope,
        generation,
        'children',
        parentId,
        childPages[parentId] ?? 1,
      ],
      enabled: !!generation,
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        let next: string | null = null;
        const data: TaskTreeRow[] = [];
        let part: TaskTreePage;
        for (let n = 0; n < (childPages[parentId] ?? 1); n++) {
          part = (
            await api.request<{ data: TaskTreePage }>({
              path: 'taskTrees/children',
              query: {
                ...filters,
                parentId,
                generation: generation!,
                ...(next ? { cursor: next } : {}),
              },
              signal,
            })
          ).data;
          data.push(...part.data);
          next = part.nextCursor;
          if (!next) break;
        }
        return { generation: generation!, data, nextCursor: next };
      },
      retry: false,
      refetchOnWindowFocus: false,
    })),
  });
  const children = new Map(
    parentIds.map((id, index) => [id, childQueries[index]]),
  );
  const staleChild = childQueries.some(
    (result) => result.isError && stale(result.error),
  );
  useEffect(() => {
    if (staleChild) void client.invalidateQueries({ queryKey: KEYS });
  }, [staleChild, client]);
  const statuses = useQuery({
    queryKey: pmKeys.statuses,
    queryFn: () => pm.statuses(),
  });
  const allRows: TaskTreeRow[] = [];
  for (const group of roots.data?.groups ?? []) allRows.push(...group.data);
  for (const result of childQueries)
    if (result.data && result.data.generation === generation)
      allRows.push(...result.data.data);
  const metadata = new Map(allRows.map((row) => [row.issue.id, row]));
  const work = useIssueAgentWork(
    [...metadata.values()].map((row) => row.issue),
    scope,
  );
  useLayoutEffect(() => {
    const previous = lastFocusRef.current;
    if (previous && !previous.element.isConnected) {
      const fallback = previous.parentId
        ? document.getElementById(`task-toggle-${previous.parentId}`)
        : null;
      (
        fallback ??
        frameRef.current?.querySelector<HTMLElement>('[data-tree-heading]') ??
        page.searchRef.current
      )?.focus();
      lastFocusRef.current = null;
    }
  });
  if (!roots.data) {
    if (roots.isError)
      return (
        <PmLoadError
          title={t('issuesPage.loadFailed')}
          error={roots.error}
          onRetry={
            recoverable(roots.error) ? () => void roots.refetch() : undefined
          }
        />
      );
    return <PmListSkeleton />;
  }
  const total = roots.data.groups.reduce(
    (sum, group) => sum + group.totals.tasks,
    0,
  );
  const entries: NonNullable<IssueTableProps['entries']>[number][] = [];
  const depths = new Map<string, number>();
  function add(row: TaskTreeRow, depth: number) {
    depths.set(row.issue.id, depth);
    entries.push(
      issueTableRow(
        row.issue,
        findStatus(statuses.data, row.issue.statusKey)
          ? statuses.data
          : undefined,
        { statusName, statusTone },
      ),
    );
    if (!expanded.has(row.issue.id)) return;
    const query = children.get(row.issue.id);
    if (query?.data && query.data.generation === generation)
      for (const child of query.data.data) add(child, depth + 1);
    if (query?.isError && !stale(query.error))
      entries.push({
        key: `error:${row.issue.id}`,
        content: (
          <PmLoadError
            title={t('issuesPage.tree.childError')}
            error={query.error}
            onRetry={
              recoverable(query.error) ? () => void query.refetch() : undefined
            }
          />
        ),
      });
    else if (query?.isPending || stale(query?.error))
      entries.push({
        key: `loading:${row.issue.id}`,
        content: (
          <span role='status' className='flex items-center gap-2'>
            <Spinner />
            {t('issuesPage.tree.loadingChildren')}
          </span>
        ),
      });
    else if (query?.data?.nextCursor)
      entries.push({
        key: `more:${row.issue.id}`,
        content: (
          <Button
            variant='outline'
            size='sm'
            disabled={query.isFetching}
            onClick={() =>
              setChildPages((values) => ({
                ...values,
                [row.issue.id]: (values[row.issue.id] ?? 1) + 1,
              }))
            }
          >
            {t('issuesPage.tree.moreChildren', {
              identifier: row.issue.identifier,
            })}
          </Button>
        ),
      });
  }
  if (total === 0)
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
  for (const group of roots.data.groups) {
    if (group.totals.tasks === 0) continue;
    const open = !collapsed.has(group.group);
    const label = t(`issuesPage.tree.groups.${group.group}`);
    entries.push({
      key: `group:${group.group}`,
      content: (
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            data-tree-heading
            variant='ghost'
            size='sm'
            aria-expanded={open}
            aria-label={t(
              open
                ? 'issuesPage.tree.collapseGroup'
                : 'issuesPage.tree.expandGroup',
              { group: label },
            )}
            title={label}
            onClick={() =>
              setCollapsed((current) => {
                const next = new Set(current);
                if (open) next.add(group.group);
                else next.delete(group.group);
                return next;
              })
            }
          >
            {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
            {label}
          </Button>
          <span className='text-xs text-muted-foreground'>
            {t('issuesPage.tree.counts', { ...group.totals })}
          </span>
          {group.totals.needsHumanAction > 0 ? (
            <Badge variant='secondary'>
              {t('issuesPage.tree.actions', {
                count: group.totals.needsHumanAction,
              })}
            </Badge>
          ) : null}
          {group.totals.waitingForViewer > 0 ? (
            <Badge variant='outline'>
              {t('issuesPage.tree.waiting', {
                count: group.totals.waitingForViewer,
              })}
            </Badge>
          ) : null}
        </div>
      ),
    });
    if (!open) continue;
    for (const row of group.data) add(row, 0);
    if (group.nextCursor)
      entries.push({
        key: `group-more:${group.group}`,
        content: (
          <Button
            variant='outline'
            size='sm'
            disabled={roots.isFetching}
            onClick={() =>
              setRootPages((values) => ({
                ...values,
                [group.group]: (values[group.group] ?? 1) + 1,
              }))
            }
          >
            {t('issuesPage.tree.moreGroup', { group: label })}
          </Button>
        ),
      });
  }
  const sortColumn: IssueTableSortColumn | null =
    COLUMNS[page.filters.sort ?? 'updated'];
  return (
    <div
      ref={frameRef}
      className='flex h-full min-h-0 flex-col gap-3'
      onFocusCapture={(event) => {
        const element = event.target as HTMLElement;
        const id = element
          .closest('[data-task-id]')
          ?.getAttribute('data-task-id');
        lastFocusRef.current = {
          element,
          parentId: id ? (metadata.get(id)?.parentId ?? null) : null,
        };
      }}
    >
      {roots.isError ? (
        <PmLoadError
          title={t('issuesPage.tree.refreshError')}
          error={roots.error}
          onRetry={
            recoverable(roots.error) ? () => void roots.refetch() : undefined
          }
        />
      ) : null}
      {roots.isFetching ? (
        <span role='status' className='text-xs text-muted-foreground'>
          {t('issuesPage.tree.refreshing')}
        </span>
      ) : null}
      {total === 0 && !page.filtered ? (
        <PmEmpty
          icon={<ListTodoIcon />}
          title={empty.title}
          description={empty.description}
          action={empty.action}
        />
      ) : (
        <div className='min-h-0 flex-1 overflow-auto overscroll-y-contain rounded-lg'>
          <IssueTable
            rows={entries.filter((entry) => 'id' in entry)}
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
            onRowClick={(row) => onOpen(row.id)}
            rowLeading={(row) => {
              const node = metadata.get(row.id)!;
              const open = expanded.has(row.id);
              const label = t(
                open
                  ? 'issuesPage.tree.collapseTask'
                  : 'issuesPage.tree.expandTask',
                { identifier: row.identifier },
              );
              return (
                <span
                  data-task-id={row.id}
                  className='inline-flex shrink-0'
                  style={{
                    paddingInlineStart: `calc(var(--spacing) * ${4 * (depths.get(row.id) ?? 0)})`,
                  }}
                >
                  {node.hasChildren ? (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            id={`task-toggle-${row.id}`}
                            variant='ghost'
                            size='icon-sm'
                            aria-expanded={open}
                            aria-label={label}
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpanded((current) => {
                                const next = new Set(current);
                                if (open) next.delete(row.id);
                                else next.add(row.id);
                                return next;
                              });
                            }}
                          />
                        }
                      >
                        {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className='size-8' />
                  )}
                </span>
              );
            }}
            rowDescription={(row) => {
              const node = metadata.get(row.id)!;
              return (
                <div className='flex flex-wrap items-center gap-2 whitespace-normal break-words text-xs text-muted-foreground'>
                  {!node.matchesFilter ? (
                    <Badge variant='outline'>
                      {t('issuesPage.tree.context')}
                    </Badge>
                  ) : null}
                  {node.explanation ? (
                    <span>
                      {t('issuesPage.tree.explanation', {
                        identifier: node.explanation.identifier,
                        reason: t(
                          `issuesPage.tree.reasons.${node.explanation.reason}`,
                        ),
                      })}
                    </span>
                  ) : null}
                  {node.attention.waitingForViewer ? (
                    <span>{t('issuesPage.tree.waitingForYou')}</span>
                  ) : node.attention.needsHumanAction ? (
                    <span>{t('issuesPage.tree.needsAction')}</span>
                  ) : null}
                  {node.progress.total > 0 ? (
                    <span title={t('issuesPage.tree.progressScope')}>
                      {t('issuesPage.tree.progress', node.progress)}
                    </span>
                  ) : null}
                </div>
              );
            }}
            rowMarks={(row) => {
              const node = metadata.get(row.id);
              return node ? (
                <IssueMarks
                  issue={node.issue}
                  placement='row'
                  className='flex-nowrap'
                  {...(work.has(row.id)
                    ? {
                        workingAgentName:
                          node.issue.executorName ?? work.get(row.id)!,
                      }
                    : {})}
                />
              ) : null;
            }}
          />
        </div>
      )}
    </div>
  );
}
