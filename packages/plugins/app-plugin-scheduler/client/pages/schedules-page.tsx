import { EmptyState } from '../components/empty-state.js';
import { PageSection } from '../components/page-section.js';
import { StatusBadge } from '../components/status-badge.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '../components/ui/select.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { apiClientToken, useService } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { CircleAlert, Search } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import { DateTimeValue } from './date-time-value.js';
import { formatClientRelativeTime } from './date-time.js';
import { formatCronDescription } from './cron-description.js';
import { ScheduleSwitch } from './schedule-switch.js';

const SCHEDULER_NS = '@nocobase/app-plugin-scheduler';

/** Rows per page. The pager stays hidden while every row fits on one page. */
const PAGE_SIZE = 10;
/** Rows per request. Search and filters run in the browser over every schedule, so the list is read in full. */
const FETCH_PAGE_SIZE = 100;
type TargetState = 'ready' | 'disabled' | 'missing' | 'invalid';
type ViewStatus = 'active' | 'paused' | 'inactive' | 'targetIssue';

interface ScheduleItem {
  readonly id: string;
  readonly title: string;
  readonly cron: string;
  readonly timezone: string;
  readonly enabled: boolean;
  readonly lifecycleState: 'active' | 'inactive';
  readonly inactiveReason?: string;
  readonly scheduleStatus: 'active' | 'paused';
  readonly targetState: TargetState;
  readonly runCount: number;
  readonly lastRunAt?: string;
  readonly nextRunAt?: string;
  readonly targetType: string;
  readonly targetSummary: {
    readonly targetLabel: string;
    readonly description?: string;
    readonly state?: TargetState;
  };
}

function viewStatus(item: ScheduleItem): ViewStatus {
  if (!item.enabled) return 'paused';
  if (item.lifecycleState === 'inactive') return 'inactive';
  if (item.targetState !== 'ready') return 'targetIssue';
  return 'active';
}

/** The list names an execution target by kind; its own name belongs on the detail page. */
function TypeTag({ label }: { readonly label: string }): ReactElement {
  return (
    <Badge className='max-w-full truncate border border-border text-muted-foreground'>
      {label}
    </Badge>
  );
}

export default function SchedulesPage(): ReactElement {
  const api = useService(apiClientToken);
  const { i18n, t } = useTranslation(SCHEDULER_NS);
  const [items, setItems] = useState<readonly ScheduleItem[]>([]);
  const [listError, setListError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ViewStatus>('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const setScheduleEnabled = (item: ScheduleItem, enabled: boolean): void => {
    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, enabled } : candidate,
      ),
    );
    setUpdating((current) => new Set(current).add(item.id));
    void api
      .request<{ data: ScheduleItem }>({
        method: 'POST',
        path: `scheduler/schedules/${encodeURIComponent(item.id)}/${enabled ? 'enable' : 'disable'}`,
      })
      .then(({ data }) =>
        setItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id ? data : candidate,
          ),
        ),
      )
      .catch(() =>
        setItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? { ...candidate, enabled: item.enabled }
              : candidate,
          ),
        ),
      )
      .finally(() =>
        setUpdating((current) => {
          const next = new Set(current);
          next.delete(item.id);
          return next;
        }),
      );
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadAll = async (): Promise<readonly ScheduleItem[]> => {
      const loaded: ScheduleItem[] = [];
      for (let next = 1; ; next += 1) {
        const response = await api.request<{
          data: readonly ScheduleItem[];
          meta: { total: number };
        }>({
          path: 'scheduler/schedules',
          query: { page: next, pageSize: FETCH_PAGE_SIZE },
          signal: controller.signal,
        });
        loaded.push(...response.data);
        if (response.data.length === 0 || loaded.length >= response.meta.total)
          return loaded;
      }
    };
    void loadAll()
      .then((loaded) => setItems(loaded))
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setListError(
            cause instanceof Error ? cause.message : t('errors.loadSchedules'),
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, t]);

  const targetTypes = useMemo(
    () => [...new Set(items.map(({ targetType }) => targetType))].sort(),
    [items],
  );
  const visibleItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const scheduleDescription = formatCronDescription(
        item.cron,
        i18n.resolvedLanguage ?? i18n.language,
      );
      const matchesText =
        !term ||
        [item.title, item.cron, scheduleDescription, item.targetType].some(
          (value) => value?.toLocaleLowerCase().includes(term),
        );
      return (
        matchesText &&
        (statusFilter === 'all' || viewStatus(item) === statusFilter) &&
        (targetFilter === 'all' || item.targetType === targetFilter)
      );
    });
  }, [
    i18n.language,
    i18n.resolvedLanguage,
    items,
    search,
    statusFilter,
    targetFilter,
  ]);

  const pageCount = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  // Narrowing a filter restarts from the first page, and the stored page is
  // clamped because the list can shrink under it between renders.
  const currentPage = Math.min(page, pageCount);
  const pagedItems = visibleItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const statusLabel = (status: ViewStatus): string =>
    t(`page.statuses.${status}`);
  const targetTypeLabel = (type: string): string =>
    t(`page.targets.${type}`, { defaultValue: type });
  const targetStateLabel = (state: TargetState): string =>
    t(`page.targetStates.${state}`);
  return (
    <PageContainer>
      <PageHeader title={t('page.title')} />
      {listError ? (
        <div className='flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
          <CircleAlert className='size-5 shrink-0' />
          {listError}
        </div>
      ) : null}

      <PageSection className='overflow-hidden'>
        <div className='flex flex-col gap-3 border-b border-border p-4 md:flex-row'>
          <label className='relative flex-1'>
            <span className='sr-only'>{t('page.filters.searchLabel')}</span>
            <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              aria-label={t('page.filters.searchLabel')}
              className='pl-9'
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t('page.filters.searchPlaceholder')}
              type='search'
              value={search}
            />
          </label>
          <Select
            items={[
              { value: 'all', label: t('page.filters.allStatuses') },
              ...(['active', 'paused', 'inactive', 'targetIssue'] as const).map(
                (status) => ({ value: status, label: statusLabel(status) }),
              ),
            ]}
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter((value ?? 'all') as 'all' | ViewStatus);
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label={t('page.filters.statusLabel')}
              className='w-full md:w-44'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectGroup>
                <SelectItem value='all'>
                  {t('page.filters.allStatuses')}
                </SelectItem>
                {(['active', 'paused', 'inactive', 'targetIssue'] as const).map(
                  (status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabel(status)}
                    </SelectItem>
                  ),
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            items={[
              { value: 'all', label: t('page.filters.allTargets') },
              ...targetTypes.map((value) => ({
                value,
                label: targetTypeLabel(value),
              })),
            ]}
            value={targetFilter}
            onValueChange={(value) => {
              setTargetFilter(value ?? 'all');
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label={t('page.filters.targetLabel')}
              className='w-full md:w-48'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectGroup>
                <SelectItem value='all'>
                  {t('page.filters.allTargets')}
                </SelectItem>
                {targetTypes.map((targetType) => (
                  <SelectItem key={targetType} value={targetType}>
                    {targetTypeLabel(targetType)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <EmptyState>{t('page.loading')}</EmptyState>
        ) : visibleItems.length === 0 ? (
          <EmptyState>
            {items.length === 0 ? t('page.empty') : t('page.noMatches')}
          </EmptyState>
        ) : (
          <>
            <Table className='table-fixed text-left'>
              <colgroup>
                <col className='w-[31%]' />
                <col className='w-[16%]' />
                <col className='w-[6%]' />
                <col className='w-[16%]' />
                <col className='w-[10%]' />
                <col className='w-[21%]' />
              </colgroup>
              <TableHeader className='bg-muted/30 tracking-wide uppercase'>
                <TableRow>
                  {(
                    [
                      'name',
                      'target',
                      'status',
                      'scheduleTimezone',
                      'triggered',
                      'nextRun',
                    ] as const
                  ).map((column) => (
                    <TableHead key={column}>
                      {t(`page.columns.${column}`)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedItems.map((item) => {
                  const href = `/settings/schedules/${encodeURIComponent(item.id)}`;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className='break-words'>
                        <Link
                          className='block break-words font-medium text-primary underline-offset-4 hover:underline focus-visible:underline'
                          to={href}
                        >
                          {item.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <TypeTag label={targetTypeLabel(item.targetType)} />
                        {item.targetState !== 'ready' ? (
                          <div className='mt-1'>
                            <StatusBadge
                              label={targetStateLabel(item.targetState)}
                              status='targetIssue'
                            />
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <ScheduleSwitch
                          checked={item.enabled}
                          disabled={
                            updating.has(item.id) ||
                            item.lifecycleState === 'inactive'
                          }
                          label={
                            item.enabled
                              ? t('page.actions.disable')
                              : t('page.actions.enable')
                          }
                          onChange={(enabled) =>
                            setScheduleEnabled(item, enabled)
                          }
                        />
                      </TableCell>
                      <TableCell className='break-words'>
                        <span className='font-medium break-words'>
                          {formatCronDescription(
                            item.cron,
                            i18n.resolvedLanguage ?? i18n.language,
                          ) ?? t('page.invalidSchedule')}
                        </span>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {item.timezone}
                        </p>
                      </TableCell>
                      <TableCell className='break-words'>
                        <span className='tabular-nums'>{item.runCount}</span>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {item.lastRunAt
                            ? (formatClientRelativeTime(item.lastRunAt) ??
                              t('page.unavailable'))
                            : t('page.unavailable')}
                        </p>
                      </TableCell>
                      <TableCell className='break-words'>
                        {item.nextRunAt ? (
                          <DateTimeValue value={item.nextRunAt} />
                        ) : (
                          t('page.unavailable')
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {visibleItems.length > PAGE_SIZE ? (
              <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm'>
                <p className='text-muted-foreground'>
                  {t('page.pagination.summary', {
                    page: currentPage,
                    total: pageCount,
                  })}
                </p>
                <div className='flex gap-2'>
                  <Button
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                    size='sm'
                  >
                    {t('page.pagination.previous')}
                  </Button>
                  <Button
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage(currentPage + 1)}
                    size='sm'
                  >
                    {t('page.pagination.next')}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </PageSection>
    </PageContainer>
  );
}
