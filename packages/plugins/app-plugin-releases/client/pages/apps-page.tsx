/**
 * Apps and deployments: the Apps the caller may see, an App with a pending deployment request marked "Pending approval"
 * beside its state; the request itself is decided on the App's page, at its top. Create App opens over the list at
 * `new` (`new-app-page.tsx`), a deployment request at `requests/:requestId` (`request-page.tsx`, kept for links to
 * it); an App opens at `:appId` in place of the list.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { BoxesIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useOutlet,
  useParams,
} from 'react-router';

import type {
  AppSummary,
  DeploymentRequestView,
} from '../../shared/releases.js';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { DataTable } from '../components/data-table.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { RefreshButton } from '../components/refresh-button.js';
import {
  AppLabels,
  AppStateBadge,
  EnvironmentName,
} from '../components/release-badges.js';
import { EmptyState, ListSkeleton, LoadError } from '../components/states.js';
import { buttonVariants } from '../components/ui/button.js';
import { Tag } from '../components/tag.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '../components/ui/input-group.js';
import { useLoad, useMe, useReleasesApi } from '../hooks/use-releases.js';
import { pendingByApp, type PendingApps } from '../lib/pending-requests.js';
import type { AppsOutletContext } from './new-app-page.js';

export default function AppsPage(): ReactElement {
  const outlet = useOutlet();
  // An App replaces the list; Create App (`new`, no `appId`) opens over it.
  const { appId } = useParams();
  if (outlet && appId !== undefined) return <>{outlet}</>;
  return <AppsCatalog />;
}

export function AppsCatalog(): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const me = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const apps = useLoad(
    () =>
      api.list<AppSummary>('apps', {
        q: search.trim() || undefined,
        pageSize: 100,
      }),
    `apps:${search}`,
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

  const createButton = canCreate ? (
    <Link
      to={{ pathname: 'new', search: location.search }}
      className={buttonVariants()}
    >
      <PlusIcon data-icon='inline-start' />
      {t('ui.apps.create')}
    </Link>
  ) : null;

  const items = apps.data?.items ?? [];
  // The header offers "create" only once there is a list; the empty state offers it before.
  const listed =
    apps.data !== undefined && (items.length > 0 || search.trim() !== '');
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
  else if (items.length === 0 && !search.trim())
    content = (
      <EmptyState
        icon={<BoxesIcon />}
        title={t('ui.apps.emptyTitle')}
        description={
          canCreate ? t('ui.apps.emptyDescription') : t('ui.apps.emptyNoAccess')
        }
        action={createButton}
      />
    );
  else
    content = (
      <div className='space-y-4'>
        <InputGroup className='max-w-sm'>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            placeholder={t('ui.apps.search')}
            aria-label={t('ui.apps.search')}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        <DataTable
          columns={columns}
          data={items}
          getRowId={(item) => item.app.id}
          onRowClick={(row) =>
            void navigate(encodeURIComponent(row.original.app.id))
          }
          emptyMessage={t('ui.apps.noResults')}
        />
      </div>
    );

  return (
    <PageContainer>
      <PageHeader
        title={t('ui.apps.title')}
        description={t('ui.apps.description')}
        actions={
          <>
            {listed ? createButton : null}
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
        meta: { className: 'w-44' },
        cell: ({ row }) => {
          const pending = pendingApps.get(row.original.app.id);
          return (
            <span className='inline-flex flex-wrap items-center gap-1.5'>
              <AppStateBadge summary={row.original} />
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
