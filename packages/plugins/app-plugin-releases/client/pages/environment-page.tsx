import { usePageBreadcrumb } from '@nocobase/app-client';
/**
 * One environment, in tabs kept in the URL (`?tab=`): Overview (how it runs, who may deploy, the defaults its Apps
 * take, and the Apps deployed to it with their runtime states, filtered by `?runtimeState=`), Variables (what every App here gets), and Settings (the form, and deleting the
 * environment). Those who may only read environments see the same page read-only. Checking it is a header action.
 * Create App opens over it at `apps/new` (`new-app-page.tsx`) for those who may create Apps, the App going to this
 * environment.
 */
import type { ColumnDef } from '@tanstack/react-table';
import { ListFilterIcon, PlugZapIcon, PlusIcon, XIcon } from 'lucide-react';
import { useMemo, useState, type ReactElement, type ReactNode } from 'react';
import {
  Link,
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';

import {
  RUN_STATES,
  type AppSummary,
  type DeploymentRequestView,
  type EnvironmentRecord,
  type RunState,
} from '../../shared/releases.js';
import { ActorName } from '../components/actor-name.js';
import { useConfirmDialog } from '../components/confirm-dialog.js';
import { DataTable } from '../components/data-table.js';
import { EnvironmentForm } from '../components/environment-form.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { RefreshButton } from '../components/refresh-button.js';
import { PageTabs, type PageTab } from '../components/page-tabs.js';
import { EnvironmentBadges } from '../components/release-badges.js';
import { RuntimeStateBadge } from '../components/runtime-state.js';
import { Tag } from '../components/tag.js';
import { Section } from '../components/section.js';
import { ListSkeleton, LoadError } from '../components/states.js';
import { Button, buttonVariants } from '../components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { Spinner } from '../components/ui/spinner.js';
import { EnvironmentVariables } from '../components/variables-table.js';
import { useDriverNames } from '../hooks/use-driver-names.js';
import { useEnvironmentCheck } from '../hooks/use-environment-check.js';
import { useNotify } from '../hooks/use-notify.js';
import { useRegistries } from '../hooks/use-registries.js';
import { useLoad, useMe, useReleasesApi } from '../hooks/use-releases.js';
import { useTabParam } from '../hooks/use-tab-param.js';
import { pendingByApp } from '../lib/pending-requests.js';
import { useReleasesLinks, useReleasesPaths } from '../lib/paths.js';
import type { AppsOutletContext } from './new-app-page.js';

type EnvironmentTab = 'overview' | 'variables' | 'settings';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export default function EnvironmentPage(): ReactElement {
  const { environmentId = '' } = useParams();
  const api = useReleasesApi();
  const me = useMe();
  const notify = useNotify();
  const navigate = useNavigate();
  const canManage = me.permissions.settings['rel.environments/manage'];
  const { drivers, driverName, t } = useDriverNames();
  const [tab, setTab] = useTabParam<EnvironmentTab>([
    'overview',
    'variables',
    'settings',
  ]);
  const [busy, setBusy] = useState<string | null>(null);
  // Starts the form again from what is saved, after a save or when changes are discarded.
  const [formKey, setFormKey] = useState(0);
  // Loads the environment's Apps again once Create App, over this page, has created one.
  const [appsKey, setAppsKey] = useState(0);
  const outletContext = useMemo<AppsOutletContext>(
    () => ({ reload: () => setAppsKey((value) => value + 1) }),
    [],
  );
  const confirmDialog = useConfirmDialog();
  const check = useEnvironmentCheck(t, setBusy);
  const environment = useLoad(
    () => api.get<EnvironmentRecord>(`environments/${environmentId}`),
    `environment:${environmentId}`,
  );
  const record = environment.data;
  const paths = useReleasesPaths();

  const remove = async (target: EnvironmentRecord): Promise<void> => {
    const confirmed = await confirmDialog.ask({
      title: t('ui.environments.confirmDelete', { id: target.id }),
      action: t('ui.environments.delete'),
      destructive: true,
    });
    if (confirmed === null) return;
    setBusy(`delete:${target.id}`);
    try {
      await api.send('DELETE', `environments/${target.id}`);
      notify.success(t('ui.environments.deleted', { name: target.name }));
      void navigate('..');
    } catch (reason) {
      notify.error(reason);
      setBusy(null);
    }
  };

  // The header's trail (the shell renders it): the environments, then this one once it has loaded.
  usePageBreadcrumb(
    record
      ? [
          { label: t('ui.environments.title'), to: paths.environments },
          { label: record.name },
        ]
      : undefined,
  );

  if (!record)
    return (
      <PageContainer>
        {environment.error !== undefined ? (
          <LoadError
            title={t('ui.environments.loadOneFailed')}
            error={environment.error}
            onRetry={environment.reload}
          />
        ) : (
          <div
            role='status'
            aria-label={t('status.loading')}
            className='space-y-4'
          >
            <Skeleton className='h-8 w-1/3' />
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-40 w-full' />
          </div>
        )}
      </PageContainer>
    );

  const settings = canManage ? (
    <div className='flex max-w-4xl flex-col gap-6'>
      <Card data-slot='environment-settings'>
        <CardHeader>
          <CardTitle>{t('ui.environments.settingsTitle')}</CardTitle>
          <CardDescription>
            {t('ui.environments.formDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnvironmentForm
            key={`${record.updatedAt}:${formKey}`}
            layout='page'
            environment={record}
            drivers={drivers.data ?? []}
            driverName={driverName}
            onDone={() => {
              environment.reload();
              setFormKey((value) => value + 1);
            }}
            onCancel={() => setFormKey((value) => value + 1)}
          />
        </CardContent>
      </Card>
      <Card className='ring-destructive/30' data-slot='danger-zone'>
        <CardHeader>
          <CardTitle>{t('ui.environments.danger')}</CardTitle>
          <CardDescription>
            {t('ui.environments.deleteDescription')}
          </CardDescription>
        </CardHeader>
        <CardFooter className='justify-end'>
          <Button
            variant='destructive'
            disabled={busy !== null}
            onClick={() => void remove(record)}
          >
            {busy === `delete:${record.id}` ? (
              <Spinner data-icon='inline-start' />
            ) : null}
            {t('ui.environments.delete')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  ) : (
    <div className='flex max-w-4xl flex-col gap-4'>
      <p className='text-sm text-muted-foreground'>
        {t('ui.environments.readOnly')}
      </p>
      <EnvironmentFacts environment={record} t={t} detailed />
    </div>
  );

  const tabs: PageTab<EnvironmentTab>[] = [
    {
      value: 'overview',
      label: t('ui.tabs.overview'),
      content: (
        <>
          <EnvironmentFacts
            environment={record}
            t={t}
            runsOn={driverName(record.driver, record.config)}
          />
          <EnvironmentApps key={appsKey} environmentId={record.id} t={t} />
        </>
      ),
    },
    {
      value: 'variables',
      label: t('ui.tabs.variables'),
      content: (
        <EnvironmentVariables environmentId={record.id} canEdit={canManage} />
      ),
    },
    { value: 'settings', label: t('ui.tabs.settings'), content: settings },
  ];

  return (
    <PageContainer>
      <div className='space-y-3'>
        <PageHeader
          title={record.name}
          description={
            <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
              <span className='font-mono text-xs'>{record.id}</span>
              <span aria-hidden='true'>·</span>
              <span>{driverName(record.driver, record.config)}</span>
              <EnvironmentBadges protected={record.protected} />
            </span>
          }
          actions={
            <Button
              variant='outline'
              disabled={busy !== null}
              onClick={() => void check(record)}
            >
              {busy === `check:${record.id}` ? (
                <Spinner data-icon='inline-start' />
              ) : (
                <PlugZapIcon data-icon='inline-start' />
              )}
              {t('ui.environments.check')}
            </Button>
          }
        />
      </div>
      <PageTabs
        tabs={tabs}
        value={tab}
        onChange={setTab}
        label={t('ui.tabs.label', { name: record.name })}
      />
      {confirmDialog.dialog}
      <Outlet context={outletContext} />
    </PageContainer>
  );
}

/** How an environment runs and who may deploy to it, as label–value pairs; `detailed` adds the defaults its Apps take. */
function EnvironmentFacts({
  environment,
  t,
  runsOn,
  detailed = false,
}: {
  readonly environment: EnvironmentRecord;
  readonly t: Translate;
  readonly runsOn?: string;
  readonly detailed?: boolean;
}): ReactElement {
  const registries = useRegistries(detailed && environment.registryId !== null);
  const registry = registries.data?.find(
    (item) => item.id === environment.registryId,
  );
  const none = <span className='text-muted-foreground'>—</span>;
  return (
    <dl
      className='grid gap-x-6 gap-y-4 rounded-lg border bg-card p-4 text-sm sm:grid-cols-2 lg:grid-cols-3'
      data-slot='environment-facts'
    >
      <Fact label={t('ui.environments.purpose')}>
        {t(`ui.environments.purposes.${environment.purpose}`)}
      </Fact>
      {runsOn ? (
        <Fact label={t('ui.environments.runsOn')}>{runsOn}</Fact>
      ) : null}
      <Fact label={t('ui.environments.publicUrl')}>
        {environment.publicUrl ? (
          <span className='font-mono text-xs break-all'>
            {environment.publicUrl}
          </span>
        ) : (
          none
        )}
      </Fact>
      <Fact label={t('ui.environments.policy')}>
        {environment.protected ? (
          <span className='flex flex-wrap gap-1'>
            <EnvironmentBadges protected />
          </span>
        ) : (
          t('ui.environments.anyone')
        )}
      </Fact>
      <Fact label={t('ui.environments.approversColumn')}>
        {environment.approvers.length > 0 ? (
          <span className='flex flex-wrap gap-x-2 gap-y-1'>
            {environment.approvers.map((userId) => (
              <ActorName key={userId} id={userId} kind='human' />
            ))}
          </span>
        ) : (
          none
        )}
      </Fact>
      <Fact label={t('ui.environments.maxApps')}>
        {environment.maxApps ?? t('ui.environments.unlimited')}
      </Fact>
      <Fact label={t('ui.environments.sampleData')}>
        {environment.sampleDataOnFirstDeploy
          ? t('ui.driverForm.on')
          : t('ui.driverForm.off')}
      </Fact>
      {detailed ? (
        <>
          <Fact label={t('ui.environments.defaultIdle')}>
            {environment.defaultIdleStopMinutes ?? t('ui.policy.neverIdle')}
          </Fact>
          <Fact label={t('ui.environments.defaultDormant')}>
            {environment.defaultDormantAfterHours ??
              t('ui.policy.neverDormant')}
          </Fact>
          <Fact label={t('ui.environments.registry')}>
            {environment.registryId === null
              ? none
              : (registry?.name ?? environment.registryId)}
          </Fact>
        </>
      ) : null}
    </dl>
  );
}

function Fact({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='min-w-0'>
      <dt className='mb-1 text-xs text-muted-foreground'>{label}</dt>
      <dd className='min-w-0'>{children}</dd>
    </div>
  );
}

/**
 * The Apps deployed to this environment, each opening its own page, with its runtime state (why it is in it on hover
 * or a tap), a deployment in progress and a pending deployment request marked beside it. The states shown are a filter
 * kept in the address (`?runtimeState=`, repeatable), which a shared host's capacity card links with, so a reload
 * keeps it; the server filters before it cuts the page. Create App is here for those who may create one.
 */
function EnvironmentApps({
  environmentId,
  t,
}: {
  readonly environmentId: string;
  readonly t: Translate;
}): ReactElement {
  const api = useReleasesApi();
  const me = useMe();
  const links = useReleasesLinks();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const canCreate = me.permissions.scopes['rel.apps/create'] === 'all';
  const runStates = params
    .getAll('runtimeState')
    .filter((state): state is RunState =>
      (RUN_STATES as readonly string[]).includes(state),
    );
  const apps = useLoad(
    () =>
      api.list<AppSummary>('apps', {
        environmentId,
        runtimeState: runStates,
        pageSize: 100,
      }),
    `environment-apps:${environmentId}|${runStates.join(',')}`,
  );
  // Pending requests on the Apps the caller may see, for the "Pending approval" marks.
  const pending = useLoad(
    () =>
      api.list<DeploymentRequestView>('deploymentRequests', {
        status: 'pending',
        pageSize: 100,
      }),
    'pending',
  );
  const pendingApps = useMemo(
    () => pendingByApp(pending.data?.items ?? []),
    [pending.data],
  );
  /** Changes the states shown, keeping the rest of the address (the tab). */
  const setStates = (states: readonly RunState[]): void =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('runtimeState');
        for (const value of RUN_STATES)
          if (states.includes(value)) next.append('runtimeState', value);
        return next;
      },
      { replace: true },
    );
  const columns: ColumnDef<AppSummary, unknown>[] = [
    {
      id: 'name',
      header: t('ui.apps.name'),
      meta: { className: 'min-w-48' },
      cell: ({ row }) => (
        <div className='min-w-0'>
          <Link
            to={links.app(row.original.app.id)}
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
      id: 'state',
      header: t('ui.apps.state'),
      meta: { className: 'w-56' },
      cell: ({ row }) => {
        const request = pendingApps.get(row.original.app.id);
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
            {request ? (
              <span
                className='inline-flex'
                data-pending-approval={request.decidable ? 'mine' : 'other'}
              >
                <Tag tone='amber'>{t('ui.requests.pendingApproval')}</Tag>
              </span>
            ) : null}
          </span>
        );
      },
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
      id: 'url',
      header: t('ui.apps.url'),
      cell: ({ row }) =>
        row.original.url ? (
          <a
            href={row.original.url}
            target='_blank'
            rel='noreferrer'
            onClick={(event) => event.stopPropagation()}
            className='break-all text-primary underline-offset-4 hover:underline'
          >
            {row.original.url}
          </a>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
  ];
  return (
    <Section
      title={t('ui.environments.apps')}
      count={apps.data?.meta.total}
      description={t('ui.environments.appsDescription')}
      // The Apps' states change on their own; the rest of the page is the environment's settings.
      actions={
        <>
          {canCreate ? (
            <Link
              to={`${links.environment(environmentId)}/apps/new`}
              className={buttonVariants()}
            >
              <PlusIcon data-icon='inline-start' />
              {t('ui.apps.create')}
            </Link>
          ) : null}
          <RefreshButton
            refreshing={apps.loading || pending.loading}
            onRefresh={() => {
              apps.reload();
              pending.reload();
            }}
          />
        </>
      }
    >
      <div className='flex flex-wrap items-center gap-2'>
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
                onCheckedChange={(checked) =>
                  setStates(
                    checked
                      ? [...runStates, state]
                      : runStates.filter((value) => value !== state),
                  )
                }
              >
                {t(`ui.apps.runStates.${state}`)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {runStates.length > 0 ? (
          <Button variant='ghost' onClick={() => setStates([])}>
            <XIcon data-icon='inline-start' />
            {t('ui.apps.clearFilters')}
          </Button>
        ) : null}
      </div>
      {apps.data ? (
        <DataTable
          columns={columns}
          data={apps.data.items}
          getRowId={(item) => item.app.id}
          onRowClick={(row) => void navigate(links.app(row.original.app.id))}
          emptyMessage={
            runStates.length > 0
              ? t('ui.apps.noMatches')
              : t('ui.environments.appsEmpty')
          }
          scroll
        />
      ) : apps.error !== undefined ? (
        <LoadError
          title={t('ui.apps.loadFailed')}
          error={apps.error}
          onRetry={apps.reload}
        />
      ) : (
        <ListSkeleton rows={2} />
      )}
    </Section>
  );
}
