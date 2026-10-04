# Dashboard: `project-dashboard/index.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [status badge](../i18n.md#dynamic-keys), [session alert](session-expired-alert.md), [types](types.md), [copy](copy.md); `projectDetailRoutes` in [section 1 of `page.md`](../page.md#1-declare-the-route), and the route in ["The same drawer over another page" in `overlay.md`](../overlay.md#the-same-drawer-over-another-page).

**Add first**: `yes n | pnpm exec shadcn add alert card chart empty skeleton @nocobase/data-table`, then format the files it creates, move the `recharts` and `@tanstack/react-table` it installs to `devDependencies` and put back the `^` range of `@nocobase/i18n` ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

**Links to**: the [detail drawer](detail-drawer.md) and its [edit dialog](edit-dialog.md), declared under this page, and the projects list ("View all").

Rules: guidelines T5 and I9; ["The same drawer over another page" in `overlay.md`](../overlay.md#the-same-drawer-over-another-page); "Table in a card" in ["Common layouts" of `styling.md`](../styling.md#common-layouts); ["Charts" in `styling.md`](../styling.md#charts).

The endpoint contract this assumes: `GET /api/projects/dashboard` returns `{ data: ProjectDashboard }`: the counts the metric cards show, the number of projects in each status, and the five most recently updated projects, newest first.

```tsx
// client/pages/project-dashboard/index.tsx
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircleIcon, FolderKanbanIcon, RefreshCwIcon } from 'lucide-react';
import {
  type ReactElement,
  type RefObject,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { DataTable } from '@/components/data-table';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import { ProjectStatusBadge } from '../projects/status-badge.js';
import {
  PROJECT_STATUSES,
  type Project,
  type ProjectStatus,
  type ProjectsOutletContext,
} from '../projects/types.js';

/** What `GET /api/projects/dashboard` returns. */
interface ProjectDashboard {
  readonly total: number;
  readonly active: number;
  /** Projects finished in the last 30 days. */
  readonly doneRecently: number;
  /** Projects nobody owns yet. */
  readonly unassigned: number;
  readonly byStatus: readonly {
    readonly status: ProjectStatus;
    readonly count: number;
  }[];
  /** The five most recently updated projects, newest first. */
  readonly recent: Project[];
}

/**
 * Route `/project-dashboard`: where the projects stand. A project opens in its drawer over this page, at
 * `/project-dashboard/:projectId`, rather than on the list (guideline I9).
 */
export default function ProjectDashboardPage(): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const refreshRef = useRef<HTMLButtonElement>(null);
  const viewAllRef = useRef<HTMLAnchorElement>(null);

  // The same loading pattern as the list: the result carries the request it answers, and "loading" is derived from it.
  const [reloadCount, reload] = useReducer((count: number) => count + 1, 0);
  const [result, setResult] = useState<{
    readonly key: number;
    readonly dashboard?: ProjectDashboard;
    readonly error?: unknown;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    api
      .request<{ data: ProjectDashboard }>({
        path: 'projects/dashboard',
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) {
            setResult({ key: reloadCount, dashboard: data });
          }
        },
        (error: unknown) => {
          // Keep the previous numbers on failure, as the list keeps its rows.
          if (!controller.signal.aborted) {
            setResult((previous) => ({ ...previous, key: reloadCount, error }));
          }
        },
      );
    return () => controller.abort();
  }, [api, reloadCount]);

  const loading = result?.key !== reloadCount;
  const error = loading ? undefined : result?.error;
  // While reloading, this is still the previous result.
  const dashboard = result?.dashboard;

  // A project deleted in the drawer disappears from the recent list, together with the link that opened the drawer:
  // once the page has reloaded, move focus to "View all" in the same card (guideline A6).
  const focusAfterReloadRef = useRef(false);
  useEffect(() => {
    if (loading || !focusAfterReloadRef.current) return;
    focusAfterReloadRef.current = false;
    viewAllRef.current?.focus();
  }, [loading]);

  // The drawer reads the same context over every page that opens it; keep it stable, as the list does.
  const outletContext = useMemo<ProjectsOutletContext>(
    () => ({
      reload,
      afterDelete: () => {
        focusAfterReloadRef.current = true;
        reload();
      },
    }),
    [reload],
  );

  let content: ReactElement;
  if (error instanceof ApiClientError && error.status === 401) {
    content = <SessionExpiredAlert />;
  } else if (error) {
    // Retrying cannot succeed without permission, so offer no "Retry" (guideline S4).
    const forbidden = error instanceof ApiClientError && error.status === 403;
    content = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertTitle>{t('projectDashboard.error.title')}</AlertTitle>
        <AlertDescription>
          {forbidden
            ? t('projects.error.forbidden')
            : t('projects.error.requestFailed')}
        </AlertDescription>
        {forbidden ? null : (
          <AlertAction>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                reload();
                // This button disappears after a retry; move focus to "Refresh" (guideline A6).
                refreshRef.current?.focus();
              }}
            >
              {t('status.retry')}
            </Button>
          </AlertAction>
        )}
      </Alert>
    );
  } else if (dashboard === undefined) {
    content = <DashboardSkeleton label={t('status.loading')} />;
  } else {
    content = <DashboardBody dashboard={dashboard} viewAllRef={viewAllRef} />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('projectDashboard.title')}
        description={t('projectDashboard.description')}
        actions={
          // A page-level action. A reload keeps the numbers on screen and shows its progress here (guideline I4).
          <Button ref={refreshRef} variant='outline' onClick={() => reload()}>
            {loading && dashboard !== undefined ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <RefreshCwIcon data-icon='inline-start' />
            )}
            {t('projectDashboard.refresh')}
          </Button>
        }
      />
      {content}
      {/* The project drawer and its edit dialog render here, over the dashboard. */}
      <Outlet context={outletContext} />
    </PageContainer>
  );
}

function DashboardBody({
  dashboard,
  viewAllRef,
}: {
  readonly dashboard: ProjectDashboard;
  readonly viewAllRef: RefObject<HTMLAnchorElement | null>;
}): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const metrics = [
    {
      key: 'total',
      label: t('projectDashboard.metrics.total'),
      value: dashboard.total,
    },
    {
      key: 'active',
      label: t('projectDashboard.metrics.active'),
      value: dashboard.active,
    },
    {
      key: 'doneRecently',
      label: t('projectDashboard.metrics.doneRecently'),
      value: dashboard.doneRecently,
    },
    {
      key: 'unassigned',
      label: t('projectDashboard.metrics.unassigned'),
      value: dashboard.unassigned,
    },
  ];

  return (
    <>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {metrics.map((metric) => (
          <Card key={metric.key}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className='text-3xl tabular-nums'>
                {numberFormat.format(metric.value)}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <StatusChart byStatus={dashboard.byStatus} />
      <RecentProjects projects={dashboard.recent} viewAllRef={viewAllRef} />
    </>
  );
}

function StatusChart({
  byStatus,
}: {
  readonly byStatus: ProjectDashboard['byStatus'];
}): ReactElement {
  const { t } = useTranslation();
  // The key matches the bar's dataKey; ChartContainer writes its color to --color-count (styling.md, "Charts").
  const config = {
    count: {
      label: t('projectDashboard.byStatus.count'),
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;
  // One bar per status, in the statuses' own order, including a status with no projects.
  const data = PROJECT_STATUSES.map((status) => ({
    status: t(`projects.status.${status}`),
    count: byStatus.find((entry) => entry.status === status)?.count ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projectDashboard.byStatus.title')}</CardTitle>
        <CardDescription>
          {t('projectDashboard.byStatus.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.every((entry) => entry.count === 0) ? (
          // No projects yet: say so inside the card instead of drawing an empty chart (guideline T5.4).
          <NoProjects />
        ) : (
          <ChartContainer config={config} className='aspect-auto h-64 w-full'>
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='status'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey='count' fill='var(--color-count)' radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RecentProjects({
  projects,
  viewAllRef,
}: {
  readonly projects: Project[];
  readonly viewAllRef: RefObject<HTMLAnchorElement | null>;
}): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const location = useLocation();
  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );
  // A short list in a card: plain headers, no sorting or pagination (guideline T5.3).
  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('projects.fields.name'),
        cell: ({ row }) => (
          // Relative, so /project-dashboard/12 opens the drawer over this page, not over the list.
          <Link
            className='font-medium hover:underline'
            to={{
              pathname: row.original.id,
              search: location.search,
            }}
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'status',
        header: t('projects.fields.status'),
        cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'updatedAt',
        header: t('projects.fields.updatedAt'),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {dateFormat.format(new Date(row.original.updatedAt))}
          </span>
        ),
      },
    ],
    [dateFormat, location.search, t],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projectDashboard.recent.title')}</CardTitle>
        <CardDescription>
          {t('projectDashboard.recent.description')}
        </CardDescription>
        <CardAction>
          {/* Going to the list is navigation, so this is a link with the button's styles. */}
          <Link
            ref={viewAllRef}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            to='/projects'
          >
            {t('projectDashboard.recent.viewAll')}
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <NoProjects />
        ) : (
          // In a card's content the table reaches the card's edges and its text lines up with the title (F3).
          <DataTable
            columns={columns}
            data={projects}
            getRowId={(project) => project.id}
            pagination={false}
            showSelectedCount={false}
          />
        )}
      </CardContent>
    </Card>
  );
}

function NoProjects(): ReactElement {
  const { t } = useTranslation();
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <FolderKanbanIcon />
        </EmptyMedia>
        <EmptyTitle>{t('projectDashboard.empty.title')}</EmptyTitle>
        <EmptyDescription>
          {t('projectDashboard.empty.description')}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function DashboardSkeleton({
  label,
}: {
  readonly label: string;
}): ReactElement {
  // Shaped like the page: the metric cards, the chart and the recent list (guideline S1).
  return (
    <div role='status' aria-label={label} className='flex flex-col gap-6'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-8 w-16' />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-48' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-64 w-full' />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-48' />
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className='h-4 w-full' />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

- **The drawer opens over the dashboard** (guideline I9): a recent project links to `project.id`, relative to this page, and `projectDetailRoutes('project-dashboard')` declares the drawer and its edit dialog under it. The page passes the drawer `ProjectsOutletContext`, so an edit or a delete there refreshes the numbers and the list here. The same drawer on the list is declared by `projectDetailRoutes('project')`.
- **A short list in a card** (guideline T5.3): the endpoint returns the five most recently updated projects, so the table has plain headers and `pagination={false}`; "View all" leads to the list. `DataTable` sits in an ordinary `CardContent`: there it drops its frame, reaches the card's edges and pads its outer cells with the card's spacing, so the names line up with "Recently updated".
- **Metrics** (guideline T5.1): the label is `CardDescription`, the value `CardTitle` at `text-3xl` with `tabular-nums`, formatted with `Intl.NumberFormat` for the current language.
- **The chart** (guideline T5.2): its one series takes `--chart-1` through the `ChartConfig`, the status names and the tooltip label go through `t`, and the container has the fixed height styling.md describes.
- **States** (guideline T5.4): the skeleton has the page's shape; a failure shows an `Alert`, with "Retry" unless the request was denied; with no projects yet, the chart and the list each say so in their card. A reload, from "Refresh" or after the drawer changed a project, keeps the numbers on screen and shows a `Spinner` in the button.
- **Focus** (guideline A6): after "Retry", focus moves to "Refresh"; after a delete in the drawer, to "View all", once the page has reloaded.
