/**
 * Apps and deployments: the Apps the caller may see, each with its runtime state (why it is in it on hover or a tap),
 * a deployment in progress and a pending deployment request ("Pending approval") marked beside it; the request itself
 * is decided on the App's page, at its top. The search, the environments, the runtime states and the page are in the
 * address (`?q=`, `?environmentId=` and `?runtimeState=`, repeatable, `?page=`), so a host's capacity card links to the
 * Apps it counts and a reload keeps them; the server filters before it cuts the page. The list only shows Apps: one is
 * created from its environment's page (`environment-page.tsx`), and `new` leads there (`new-app-redirect.tsx`). A
 * deployment request opens over the list at `requests/:requestId` (`request-page.tsx`, kept for links to it); an App
 * opens at `:appId` in place of the list.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import {
  BoxesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListFilterIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { useMemo, type ReactElement } from 'react';
import {
  Link,
  Outlet,
  useNavigate,
  useOutlet,
  useParams,
  useSearchParams,
} from 'react-router';

import {
  RUN_STATES,
  type AppSummary,
  type DeploymentRequestView,
  type EnvironmentListItem,
  type RunState,
} from '../../shared/releases.js';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { DataTable } from '../components/data-table.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { RefreshButton } from '../components/refresh-button.js';
import { AppLabels, EnvironmentName } from '../components/release-badges.js';
import { EmptyState, ListSkeleton, LoadError } from '../components/states.js';
import { RuntimeStateBadge } from '../components/runtime-state.js';
import { Button } from '../components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu.js';
import { Tag } from '../components/tag.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '../components/ui/input-group.js';
import { useLoad, useMe, useReleasesApi } from '../hooks/use-releases.js';
import { pendingByApp, type PendingApps } from '../lib/pending-requests.js';
import type { AppsOutletContext } from './new-app-page.js';

const PAGE_SIZE = 100;

export default function AppsPage(): ReactElement {
  const outlet = useOutlet();
  // An App replaces the list; a deployment request (`requests/:requestId`, no `appId`) opens over it.
  const { appId } = useParams();
  if (outlet && appId !== undefined) return <>{outlet}</>;
  return <AppsCatalog />;
}

export function AppsCatalog(): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const me = useMe();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const environmentIds = params.getAll('environmentId');
  const runStates = params
    .getAll('runtimeState')
    .filter((state): state is RunState =>
      (RUN_STATES as readonly string[]).includes(state),
    );
  const requestedPage = Math.max(1, Number(params.get('page')) || 1);
  const filtered = environmentIds.length > 0 || runStates.length > 0;
  /** Changes the address's filters; any change of what is listed starts again at the first page. */
  const setFilter = (change: (next: URLSearchParams) => void): void =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        change(next);
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  const apps = useLoad(
    () =>
      api.list<AppSummary>('apps', {
        q: search.trim() || undefined,
        environmentId: environmentIds,
        runtimeState: runStates,
        page: requestedPage,
        pageSize: PAGE_SIZE,
      }),
    `apps:${search}|${environmentIds.join(',')}|${runStates.join(',')}|${requestedPage}`,
  );
  // The environments the address names, by name; only read when it names some.
  const environments = useLoad(
    () =>
      environmentIds.length > 0
        ? api
            .list<EnvironmentListItem>('environments')
            .then((page) => page.items)
        : Promise.resolve([]),
    `environments:${environmentIds.join(',')}`,
  );
  // Pending requests on the Apps the caller may see, for the list's "Pending approval" marks.
  const pending = useLoad(
    () =>
      api.list<DeploymentRequestView>('deploymentRequests', {
        status: 'pending',
        pageSize: 100,
      }),
    'pending',
  );
  const canCreate = me.permissions.scopes['rel.apps/create'] === 'all';
  const pendingApps = useMemo(
    () => pendingByApp(pending.data?.items ?? []),
    [pending.data],
  );
  const columns = useAppColumns(pendingApps);

  const reloadApps = apps.reload;
  const reloadPending = pending.reload;
  const outletContext = useMemo<AppsOutletContext>(
    () => ({
      reload: reloadApps,
      reloadRequests: () => {
        reloadPending();
        reloadApps();
      },
    }),
    [reloadApps, reloadPending],
  );

  const items = apps.data?.items ?? [];
  const total = apps.data?.meta.total ?? items.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const narrowed = search.trim() !== '' || filtered;
  const environmentNames = environmentIds.map(
    (id) => environments.data?.find((item) => item.id === id)?.name ?? id,
  );
  const toggleState = (state: RunState, checked: boolean): void =>
    setFilter((next) => {
      const states = new Set(next.getAll('runtimeState'));
      if (checked) states.add(state);
      else states.delete(state);
      next.delete('runtimeState');
      for (const value of RUN_STATES)
        if (states.has(value)) next.append('runtimeState', value);
    });
  const goTo = (target: number): void =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (target > 1) next.set('page', String(target));
        else next.delete('page');
        return next;
      },
      { replace: false },
    );
  let content: ReactElement;
  if (apps.error !== undefined && !apps.data)
    content = (
      <LoadError
        title={t('ui.apps.loadFailed')}
        error={apps.error}
        onRetry={apps.reload}
      />
    );
  else if (!apps.data) content = <ListSkeleton />;
  else if (items.length === 0 && !narrowed)
    content = (
      <EmptyState
        icon={<BoxesIcon />}
        title={t('ui.apps.emptyTitle')}
        description={
          canCreate ? t('ui.apps.emptyDescription') : t('ui.apps.emptyNoAccess')
        }
      />
    );
  else
    content = (
      <div className='space-y-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <InputGroup className='max-w-sm'>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              placeholder={t('ui.apps.search')}
              aria-label={t('ui.apps.search')}
              onChange={(event) =>
                setFilter((next) => {
                  if (event.target.value) next.set('q', event.target.value);
                  else next.delete('q');
                })
              }
            />
          </InputGroup>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant='outline' />}
              data-slot='state-filter'
            >
              <ListFilterIcon data-icon='inline-start' />
              {runStates.length > 0
                ? `${t('ui.apps.stateFilter')}: ${runStates
                    .map((state) => t(`ui.apps.runStates.${state}`))
                    .join(', ')}`
                : t('ui.apps.anyState')}
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              {RUN_STATES.map((state) => (
                <DropdownMenuCheckboxItem
                  key={state}
                  checked={runStates.includes(state)}
                  onCheckedChange={(checked) => toggleState(state, checked)}
                >
                  {t(`ui.apps.runStates.${state}`)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {environmentIds.length > 0 ? (
            <Tag tone='grey'>
              {t('ui.apps.filteredEnvironments', {
                names: environmentNames.join(', '),
              })}
            </Tag>
          ) : null}
          {filtered ? (
            <Button
              variant='ghost'
              onClick={() =>
                setFilter((next) => {
                  next.delete('environmentId');
                  next.delete('runtimeState');
                })
              }
            >
              <XIcon data-icon='inline-start' />
              {t('ui.apps.clearFilters')}
            </Button>
          ) : null}
        </div>
        <DataTable
          columns={columns}
          data={items}
          getRowId={(item) => item.app.id}
          onRowClick={(row) =>
            void navigate({
              pathname: encodeURIComponent(row.original.app.id),
            })
          }
          emptyMessage={
            filtered ? t('ui.apps.noMatches') : t('ui.apps.noResults')
          }
        />
        {pages > 1 ? (
          <nav className='flex items-center justify-end gap-2 text-sm'>
            <span className='text-muted-foreground tabular-nums'>
              {t('ui.apps.page', { page, pages })}
            </span>
            <Button
              variant='outline'
              size='icon'
              aria-label={t('ui.apps.previousPage')}
              disabled={page <= 1}
              onClick={() => goTo(page - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant='outline'
              size='icon'
              aria-label={t('ui.apps.nextPage')}
              disabled={page >= pages}
              onClick={() => goTo(page + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </nav>
        ) : null}
      </div>
    );

  return (
    <PageContainer>
      <PageHeader
        title={t('ui.apps.title')}
        description={t('ui.apps.description')}
        actions={
          <>
            {/* Deployments, runtime states and requests change on their own; nothing announces them. */}
            <RefreshButton
              refreshing={apps.loading || pending.loading}
              onRefresh={() => {
                apps.reload();
                pending.reload();
              }}
            />
          </>
        }
      />
      {content}
      <Outlet context={outletContext} />
    </PageContainer>
  );
}

function useAppColumns(
  pendingApps: PendingApps,
): ColumnDef<AppSummary, unknown>[] {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return useMemo<ColumnDef<AppSummary, unknown>[]>(
    () => [
      {
        id: 'name',
        header: t('ui.apps.name'),
        meta: { className: 'min-w-48' },
        cell: ({ row }) => (
          <div className='min-w-0'>
            <Link
              to={encodeURIComponent(row.original.app.id)}
              onClick={(event) => event.stopPropagation()}
              className='font-medium hover:underline'
            >
              {row.original.app.name}
            </Link>
            <div className='truncate font-mono text-xs text-muted-foreground'>
              {row.original.app.id}
            </div>
          </div>
        ),
      },
      {
        id: 'environment',
        header: t('ui.apps.environment'),
        meta: { className: 'w-56' },
        cell: ({ row }) => (
          <EnvironmentName
            name={row.original.environment.name}
            protected={row.original.environment.protected}
          />
        ),
      },
      {
        id: 'version',
        header: t('ui.apps.version'),
        meta: { className: 'w-32' },
        cell: ({ row }) => (
          <span className='font-mono text-xs tabular-nums'>
            {row.original.currentVersion ?? '—'}
          </span>
        ),
      },
      {
        id: 'state',
        header: t('ui.apps.state'),
        meta: { className: 'w-56' },
        cell: ({ row }) => {
          const pending = pendingApps.get(row.original.app.id);
          const deployment = row.original.hasPendingDeployment
            ? (row.original.pendingDeployment?.status ?? 'deploying')
            : null;
          return (
            <span className='inline-flex flex-wrap items-center gap-1.5'>
              <RuntimeStateBadge runtime={row.original.runtime} />
              {deployment ? (
                <Tag tone={deployment === 'cancelling' ? 'amber' : 'blue'}>
                  {deployment === 'deploying'
                    ? t('ui.state.deploying')
                    : t(`ui.deployments.statuses.${deployment}`)}
                </Tag>
              ) : null}
              {pending ? (
                <span
                  className='inline-flex'
                  data-pending-approval={pending.decidable ? 'mine' : 'other'}
                >
                  <Tag tone='amber'>{t('ui.requests.pendingApproval')}</Tag>
                </span>
              ) : null}
            </span>
          );
        },
      },
      {
        id: 'labels',
        header: t('ui.apps.labels'),
        meta: { className: 'w-56' },
        cell: ({ row }) => (
          <AppLabels
            appId={row.original.app.id}
            labels={row.original.app.labels}
          />
        ),
      },
    ],
    [t, pendingApps],
  );
}
