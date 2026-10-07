/**
 * One App, in tabs kept in the URL (`?tab=`): Overview (its state, current release, address, run mode and recent
 * deployments, with the first administrator a first deployment generated), Deployments (releases with upload, deploy
 * or request a deployment, the deployment history with rollback and logs, and deployment requests), Variables, and
 * Settings (run mode and labels, the config.yml editor as Advanced, and deleting the App). The App's pending deployment
 * request (there is at most one) is the first row of its deployments, opening the request's dialog at
 * `requests/:requestId` below this page (`request-page.tsx`), where an approver decides it; an approver also reads a
 * one-line notice under the header. What the variables lack or changed shows above every tab. Each block shows only
 * what the caller's permissions allow; the server checks every action again. Outcomes are toasts; a runtime's error is worded by `lib/errors.ts`.
 */
import { ApiClientError, usePageBreadcrumb } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { JournalEntry, JournalPage } from '@nocobase/logging';
import type { ColumnDef } from '@tanstack/react-table';
import {
  BanIcon,
  ClipboardCheckIcon,
  FileCogIcon,
  PlayIcon,
  RotateCwIcon,
  ScrollTextIcon,
  SquareIcon,
  Undo2Icon,
  UploadIcon,
} from 'lucide-react';
import {
  useContext,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  type To,
} from 'react-router';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  CONFIG_SECRET_MASK,
  type AppSummary,
  type ConfigDocument,
  type DeploymentPage,
  type DeploymentRequestView,
  type DeploymentView,
  type ReleaseView,
} from '../../shared/releases.js';
import { ActorName } from '../components/actor-name.js';
import { AppSettingsCard } from '../components/app-settings-card.js';
import {
  DeploymentArtifactTag,
  ReleaseArtifacts,
} from '../components/artifacts.js';
import { ConfigSecrets } from '../components/config-secrets.js';
import { useConfirmDialog } from '../components/confirm-dialog.js';
import { DataTable } from '../components/data-table.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { RefreshButton } from '../components/refresh-button.js';
import { PageTabs, type PageTab } from '../components/page-tabs.js';
import {
  AppLabels,
  AppStateBadge,
  AppSummaryLine,
  EnvironmentBadges,
  LabelChips,
  StatusTag,
} from '../components/release-badges.js';
import { RowActions } from '../components/row-actions.js';
import { Section } from '../components/section.js';
import { EmptyState, ListSkeleton, LoadError } from '../components/states.js';
import { Tag } from '../components/tag.js';
import { Alert, AlertAction, AlertTitle } from '../components/ui/alert.js';
import { Button, buttonVariants } from '../components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import { DropdownMenuItem } from '../components/ui/dropdown-menu.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { Spinner } from '../components/ui/spinner.js';
import { Textarea } from '../components/ui/textarea.js';
import { UploadReleaseDialog } from '../components/upload-release-dialog.js';
import {
  ChangedVariablesAlert,
  InitialAdminAlert,
  MissingVariablesAlert,
} from '../components/variable-alerts.js';
import { AppVariables } from '../components/variables-table.js';
import { useNotify } from '../hooks/use-notify.js';
import { useLoad, useMe, useReleasesApi } from '../hooks/use-releases.js';
import { useTabHref, useTabParam } from '../hooks/use-tab-param.js';
import { ReleasesAppOriginContext } from '../lib/app-origin.js';
import {
  configSecretChanges,
  type ConfigSecretDrafts,
} from '../lib/config-secrets.js';
import { ReleasesDeleteAppImpactContext } from '../lib/delete-app-impact.js';
import { messageText } from '../lib/errors.js';
import { formatDate, formatSize, labelsHeader } from '../lib/format.js';
import { useReleasesLinks, useReleasesPaths } from '../lib/paths.js';
import { canOnApp } from '../lib/permissions.js';
import { policySummary } from '../lib/runtime-policy.js';
import type { RequestOutletContext } from './request-page.js';

type Operation = 'start' | 'stop' | 'restart';

const OPERATION_ICONS: Readonly<Record<Operation, ReactNode>> = {
  start: <PlayIcon data-icon='inline-start' />,
  stop: <SquareIcon data-icon='inline-start' />,
  restart: <RotateCwIcon data-icon='inline-start' />,
};

type AppTab = 'overview' | 'deployments' | 'variables' | 'settings';

/** How many deployments the Overview tab lists. */
const RECENT_DEPLOYMENTS = 5;

export default function AppPage(): ReactElement {
  const { appId = '' } = useParams();
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const me = useMe();
  const links = useReleasesLinks();
  const paths = useReleasesPaths();
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();
  const tabHref = useTabHref();
  const [busy, setBusy] = useState<string | null>(null);
  const confirmDialog = useConfirmDialog();
  const deleteImpact = useContext(ReleasesDeleteAppImpactContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const app = useLoad(
    () => api.get<AppSummary>(`apps/${appId}`),
    `app:${appId}`,
  );
  const releases = useLoad(
    () =>
      api
        .list<ReleaseView>(`apps/${appId}/releases`, { pageSize: 100 })
        .then((page) => page.items),
    `releases:${appId}`,
  );
  const deployments = useLoad(
    () =>
      api.list<DeploymentView>(`apps/${appId}/deployments`, { pageSize: 50 }),
    `deployments:${appId}`,
  );
  const requests = useLoad(
    () => api.list<DeploymentRequestView>('deploymentRequests', { appId }),
    `requests:${appId}`,
  );
  const summary = app.data;
  const origin = useContext(ReleasesAppOriginContext);
  const canConfigure = canOnApp(me, 'configure', summary);
  const canDelete = canOnApp(me, 'delete', summary);
  const [tab, setTab] = useTabParam<AppTab>(
    canConfigure || canDelete
      ? ['overview', 'deployments', 'variables', 'settings']
      : ['overview', 'deployments', 'variables'],
  );
  // A protected environment takes every deployment through a request an approver approves.
  const viaRequest = summary?.environment.protected ?? false;
  const canDeploy = canOnApp(me, 'deploy', summary);

  const reloadAll = (): void => {
    app.reload();
    releases.reload();
    deployments.reload();
    requests.reload();
  };
  const outletContext: RequestOutletContext = { reloadRequests: reloadAll };
  // The request's dialog opens over the tab it was opened from.
  const requestTo = (requestId: string): To => ({
    pathname: `requests/${encodeURIComponent(requestId)}`,
    search: location.search,
  });
  const pending = requests.data?.items.find(
    (request) => request.status === 'pending',
  );

  /** Runs one action at a time, reporting its outcome as a toast. */
  const run = async (
    key: string,
    work: () => Promise<unknown>,
    done?: string,
  ): Promise<void> => {
    setBusy(key);
    try {
      await work();
      if (done) notify.success(done);
      reloadAll();
    } catch (reason) {
      notify.error(reason);
    } finally {
      setBusy(null);
    }
  };

  const deploy = async (release: ReleaseView): Promise<void> => {
    const key = `deploy:${release.id}`;
    if (viaRequest) {
      await run(
        key,
        () =>
          api.send('POST', `apps/${appId}/deploymentRequests`, {
            releaseId: release.id,
          }),
        t('ui.requests.created'),
      );
      return;
    }
    await run(
      key,
      () =>
        api.send('POST', `apps/${appId}/deploy`, {
          releaseId: release.id,
        }),
      t('ui.deploy.started', { version: release.version }),
    );
  };

  const rollback = async (deploymentId: string): Promise<void> => {
    const key = `rollback:${deploymentId}`;
    if (viaRequest) {
      await run(
        key,
        () =>
          api.send('POST', `apps/${appId}/deploymentRequests`, {
            rollbackToDeploymentId: deploymentId,
          }),
        t('ui.requests.created'),
      );
      return;
    }
    // A rollback takes changes back: confirmed first.
    const confirm = await confirmDialog.ask({
      title: t('ui.deployments.confirmRollbackTitle', {
        name: summary?.app.name ?? appId,
      }),
      description: t('ui.deployments.confirmRollback'),
      action: t('ui.deployments.rollback'),
    });
    if (confirm === null) return;
    await run(
      key,
      () =>
        api.send('POST', `apps/${appId}/rollback`, {
          deploymentId,
        }),
      t('ui.deployments.rollbackStarted'),
    );
  };

  /** The archive chosen; the upload dialog asks for its optional commit and labels. */
  const [chosen, setChosen] = useState<File | null>(null);
  const uploadFile = (file: File, labels: Record<string, string>): void => {
    setChosen(null);
    const header = labelsHeader(labels);
    void run(
      'upload',
      () =>
        api.upload(
          `apps/${appId}/releases`,
          file,
          header ? { 'x-release-labels': header } : {},
        ),
      t('ui.releases.uploaded'),
    );
  };

  const remove = async (): Promise<void> => {
    const typed = await confirmDialog.ask({
      title: t('ui.settings.confirmDeleteTitle', {
        name: summary?.app.name ?? appId,
      }),
      description: t('ui.settings.confirmDelete', { appId }),
      details: deleteImpact ? <deleteImpact.Impact appId={appId} /> : null,
      action: t('ui.settings.delete'),
      destructive: true,
      typeToConfirm: appId,
    });
    if (typed === null) return;
    setBusy('delete');
    try {
      await api.send('DELETE', `apps/${appId}`, undefined, { confirm: typed });
      notify.success(
        t('ui.settings.deleted', { name: summary?.app.name ?? appId }),
      );
      void navigate('..');
    } catch (reason) {
      notify.error(reason);
      setBusy(null);
    }
  };

  // The header's trail (the shell renders it): the Apps, then this one once it has loaded.
  usePageBreadcrumb(
    summary
      ? [
          { label: t('ui.apps.title'), to: paths.apps },
          { label: summary.app.name },
        ]
      : undefined,
  );

  if (!summary)
    return (
      <PageContainer>
        {app.error !== undefined ? (
          <LoadError
            title={t('ui.apps.loadOneFailed')}
            error={app.error}
            onRetry={app.reload}
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

  const releaseColumns: ColumnDef<ReleaseView, unknown>[] = [
    {
      id: 'version',
      header: t('ui.apps.version'),
      meta: { className: 'min-w-40' },
      cell: ({ row }) => (
        <span className='flex flex-wrap items-center gap-1.5'>
          <span className='font-mono text-xs font-medium tabular-nums'>
            {row.original.version}
          </span>
          <ReleaseVariablesTags release={row.original} />
        </span>
      ),
    },
    {
      id: 'checksum',
      header: t('ui.artifacts.title'),
      meta: { className: 'min-w-56' },
      cell: ({ row }) => <ReleaseArtifacts release={row.original} />,
    },
    {
      id: 'size',
      header: t('ui.releases.size'),
      meta: { className: 'w-24' },
      cell: ({ row }) => (
        <span className='tabular-nums'>
          {row.original.size === null ? '—' : formatSize(row.original.size)}
        </span>
      ),
    },
    {
      id: 'labels',
      header: t('ui.apps.labels'),
      cell: ({ row }) => <LabelChips labels={row.original.labels} />,
    },
    {
      id: 'created',
      header: t('ui.releases.created'),
      meta: { className: 'w-44' },
      cell: ({ row }) => (
        <span className='text-muted-foreground tabular-nums'>
          {formatDate(row.original.createdAt, i18n.language)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className='sr-only'>{t('ui.common.actions')}</span>,
      meta: { className: 'w-32 text-right' },
      cell: ({ row }) =>
        canDeploy ? (
          <Button
            size='sm'
            variant='ghost'
            disabled={busy !== null}
            onClick={() => void deploy(row.original)}
          >
            {busy === `deploy:${row.original.id}` ? (
              <Spinner data-icon='inline-start' />
            ) : null}
            {viaRequest ? t('ui.requests.request') : t('ui.deploy.deploy')}
          </Button>
        ) : null,
    },
  ];

  const releaseCount = releases.data?.length;
  // The release the App runs, which applying changed variables deploys again.
  const currentReleaseId = deployments.data?.items.find(
    (deployment) => deployment.id === summary.app.currentDeploymentId,
  )?.releaseId;
  const currentRelease = releases.data?.find(
    (release) => release.id === currentReleaseId,
  );
  const deploymentItems = deployments.data?.items ?? [];
  const canReadEnvironments =
    me.permissions.settings['rel.environments/read'] === true;
  // Where a value every App of the environment gets is set.
  const environmentVariablesTo = canReadEnvironments
    ? `${links.environment(summary.environment.id)}?tab=variables`
    : undefined;

  const deploymentTable = (items: readonly DeploymentItem[]): ReactElement =>
    deployments.data ? (
      <DeploymentTable
        appId={appId}
        pending={pending}
        requestTo={requestTo}
        deployments={items}
        currentId={summary.app.currentDeploymentId}
        canRollback={canDeploy}
        canReadLogs={canOnApp(me, 'read-logs', summary)}
        busy={busy}
        onRollback={(id) => void rollback(id)}
      />
    ) : deployments.error !== undefined ? (
      <LoadError
        title={t('ui.deployments.loadFailed')}
        error={deployments.error}
        onRetry={deployments.reload}
      />
    ) : (
      <ListSkeleton rows={2} />
    );

  const overview = (
    <>
      {canDeploy ? (
        <InitialAdminAlert
          appId={appId}
          reloadKey={summary.app.currentDeploymentId ?? ''}
        />
      ) : null}
      <dl className='grid gap-x-6 gap-y-4 rounded-lg border bg-card p-4 text-sm sm:grid-cols-2 lg:grid-cols-3'>
        <Overview label={t('ui.apps.state')}>
          <AppStateBadge summary={summary} />
          {summary.runtime.error ? (
            <p className='mt-1.5 text-xs text-destructive wrap-anywhere'>
              {messageText(t, summary.runtime.error)}
            </p>
          ) : null}
        </Overview>
        <Overview label={t('ui.overview.currentRelease')}>
          <span className='font-mono text-xs tabular-nums'>
            {summary.currentVersion ?? '—'}
          </span>
        </Overview>
        <Overview label={t('ui.apps.url')}>
          {summary.url ? (
            <a
              href={summary.url}
              target='_blank'
              rel='noreferrer'
              className='break-all text-primary underline-offset-4 hover:underline'
            >
              {summary.url}
            </a>
          ) : (
            <span className='text-muted-foreground'>—</span>
          )}
        </Overview>
        <Overview label={t('ui.policy.title')}>
          <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
            <span>{policySummary(t, summary.app)}</span>
            {canConfigure ? (
              <Link
                to={tabHref('settings')}
                className='text-sm text-primary underline-offset-4 hover:underline'
              >
                {t('ui.settings.editShort')}
              </Link>
            ) : null}
          </span>
        </Overview>
        <Overview label={t('ui.apps.lastAccess')}>
          <span className='tabular-nums'>
            {formatDate(summary.runtime.lastAccessedAt, i18n.language)}
          </span>
        </Overview>
        <Overview label={t('ui.apps.labels')}>
          <AppLabels appId={summary.app.id} labels={summary.app.labels} />
        </Overview>
      </dl>
      {origin ? <origin.Origin appId={appId} /> : null}
      <Section
        title={t('ui.overview.recent')}
        actions={
          deploymentItems.length > 0 ? (
            <Link
              to={tabHref('deployments')}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {t('ui.overview.viewAll')}
            </Link>
          ) : null
        }
      >
        {deploymentTable(deploymentItems.slice(0, RECENT_DEPLOYMENTS))}
      </Section>
    </>
  );

  const deploymentsTab = (
    <>
      <Section
        title={t('ui.releases.title')}
        count={releaseCount}
        actions={
          canOnApp(me, 'upload', summary) && !summary.environment.runsImages ? (
            <>
              {/* The native file input stays hidden: its button and "No file chosen" follow the browser's language. */}
              <input
                ref={fileInputRef}
                type='file'
                className='sr-only'
                tabIndex={-1}
                aria-hidden='true'
                accept='.tar.gz,.tgz,application/gzip'
                disabled={busy !== null}
                onChange={(event) => {
                  setChosen(event.target.files?.[0] ?? null);
                  event.target.value = '';
                }}
              />
              <Button
                variant='outline'
                size='sm'
                disabled={busy !== null}
                onClick={() => fileInputRef.current?.click()}
              >
                {busy === 'upload' ? (
                  <Spinner data-icon='inline-start' />
                ) : (
                  <UploadIcon data-icon='inline-start' />
                )}
                {t('ui.releases.upload')}
              </Button>
            </>
          ) : null
        }
      >
        {releases.data ? (
          <DataTable
            columns={releaseColumns}
            data={releases.data}
            getRowId={(release) => release.id}
            emptyMessage={t('ui.releases.empty')}
            scroll
          />
        ) : releases.error !== undefined ? (
          <LoadError
            title={t('ui.releases.loadFailed')}
            error={releases.error}
            onRetry={releases.reload}
          />
        ) : (
          <ListSkeleton rows={2} />
        )}
      </Section>

      {requests.data && requests.data.items.length > 0 ? (
        <RequestsSection
          requests={requests.data.items}
          busy={busy}
          onReview={(request) => void navigate(requestTo(request.id))}
          onCancel={(request) =>
            void run(
              `cancel:${request.id}`,
              () => api.send('POST', `deploymentRequests/${request.id}/cancel`),
              t('ui.requests.done.cancel'),
            )
          }
        />
      ) : null}

      <Section
        title={t('ui.deployments.title')}
        count={deployments.data?.items.length}
      >
        {deploymentTable(deploymentItems)}
      </Section>
    </>
  );

  const settingsTab = (
    <div className='flex max-w-4xl flex-col gap-6'>
      {canConfigure ? (
        <AppSettingsCard summary={summary} onSaved={app.reload} />
      ) : null}
      {canConfigure ? (
        <ConfigurationCard
          appId={appId}
          deployed={summary.app.currentDeploymentId !== null}
          variablesHref={tabHref('variables')}
        />
      ) : null}
      {canDelete ? (
        <Card className='ring-destructive/30' data-slot='danger-zone'>
          <CardHeader>
            <CardTitle>{t('ui.settings.danger')}</CardTitle>
            <CardDescription>
              {t('ui.settings.deleteDescription')}
            </CardDescription>
          </CardHeader>
          <CardFooter className='justify-end'>
            <Button
              variant='destructive'
              disabled={busy !== null}
              onClick={() => void remove()}
            >
              {busy === 'delete' ? <Spinner data-icon='inline-start' /> : null}
              {t('ui.settings.delete')}
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );

  const tabs: PageTab<AppTab>[] = [
    { value: 'overview', label: t('ui.tabs.overview'), content: overview },
    {
      value: 'deployments',
      label: t('ui.tabs.deployments'),
      content: deploymentsTab,
    },
    {
      value: 'variables',
      label: t('ui.tabs.variables'),
      content: (
        <AppVariables
          appId={appId}
          canEdit={canConfigure}
          {...(environmentVariablesTo
            ? { environmentTo: environmentVariablesTo }
            : {})}
          reloadKey={summary.app.currentDeploymentId ?? ''}
          onChanged={app.reload}
        />
      ),
    },
    ...(canConfigure || canDelete
      ? [
          {
            value: 'settings' as const,
            label: t('ui.tabs.settings'),
            content: settingsTab,
          },
        ]
      : []),
  ];

  const banner =
    (summary.variables?.missing.length ?? 0) > 0 ||
    (summary.variables?.changed && summary.app.currentDeploymentId) ? (
      <div className='flex flex-col gap-3'>
        <MissingVariablesAlert
          names={summary.variables?.missing ?? []}
          {...(environmentVariablesTo
            ? { environmentTo: environmentVariablesTo }
            : {})}
          {...(tab === 'variables' ? {} : { appTo: tabHref('variables') })}
        />
        {summary.variables?.changed && summary.app.currentDeploymentId ? (
          <ChangedVariablesAlert
            busy={busy !== null}
            {...(canDeploy && currentRelease
              ? { onApply: () => void deploy(currentRelease) }
              : {})}
          />
        ) : null}
      </div>
    ) : null;

  return (
    <PageContainer>
      <div className='space-y-3'>
        <PageHeader
          title={summary.app.name}
          description={
            <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
              <span className='font-mono text-xs'>{summary.app.id}</span>
              <span aria-hidden='true'>·</span>
              {canReadEnvironments ? (
                <Link
                  to={links.environment(summary.environment.id)}
                  className='hover:text-foreground hover:underline'
                >
                  {summary.environment.name}
                </Link>
              ) : (
                <span>{summary.environment.name}</span>
              )}
              <EnvironmentBadges protected={summary.environment.protected} />
              <AppSummaryLine
                appId={summary.app.id}
                labels={summary.app.labels}
              />
            </span>
          }
          actions={
            <>
              {canOnApp(me, 'operate', summary) &&
              summary.app.currentDeploymentId
                ? (['start', 'stop', 'restart'] as const).map((operation) => (
                    <Button
                      key={operation}
                      variant='outline'
                      disabled={busy !== null}
                      onClick={() =>
                        void run(
                          operation,
                          () => api.send('POST', `apps/${appId}/${operation}`),
                          t(`ui.operate.done.${operation}`),
                        )
                      }
                    >
                      {busy === operation ? (
                        <Spinner data-icon='inline-start' />
                      ) : (
                        OPERATION_ICONS[operation]
                      )}
                      {t(`ui.operate.${operation}`)}
                    </Button>
                  ))
                : null}
              {/* The runtime's state, deployments and requests change on their own; nothing announces them. */}
              <RefreshButton
                refreshing={
                  app.loading ||
                  releases.loading ||
                  deployments.loading ||
                  requests.loading
                }
                onRefresh={reloadAll}
              />
            </>
          }
        />
      </div>

      {pending?.decidable ? (
        <PendingRequestNotice request={pending} to={requestTo(pending.id)} />
      ) : null}

      <PageTabs
        tabs={tabs}
        value={tab}
        onChange={setTab}
        banner={banner}
        label={t('ui.tabs.label', { name: summary.app.name })}
      />
      {confirmDialog.dialog}
      <UploadReleaseDialog
        file={chosen}
        onCancel={() => setChosen(null)}
        onUpload={uploadFile}
      />
      <Outlet context={outletContext} />
    </PageContainer>
  );
}

/** What a release's variables manifest asks for: how many it declares and how many nothing supplies. */
function ReleaseVariablesTags({
  release,
}: {
  readonly release: ReleaseView;
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const variables = release.variables;
  if (!variables || variables.declared === 0) return null;
  return (
    <>
      <Tag tone='grey'>
        {t('ui.variables.needs', { count: variables.declared })}
      </Tag>
      {variables.missing.length > 0 ? (
        <Tag tone='red' title={variables.missing.join(', ')}>
          {t('ui.variables.missing', { count: variables.missing.length })}
        </Tag>
      ) : null}
    </>
  );
}

function Overview({
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

type DeploymentItem = DeploymentPage['items'][number];

/** A row of the deployments: one that ran, or the pending request at the top. */
type DeploymentRow =
  | { readonly type: 'deployment'; readonly deployment: DeploymentItem }
  | { readonly type: 'request'; readonly request: DeploymentRequestView };

/** "<requester> requested to deploy <version> to <environment>" and "Review", for an approver, under the header. */
function PendingRequestNotice({
  request,
  to,
}: {
  readonly request: DeploymentRequestView;
  readonly to: To;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    // Informational rather than an interruption, so not announced as an alert (A8).
    <Alert role='status' data-slot='pending-request-notice'>
      <ClipboardCheckIcon />
      <AlertTitle className='font-normal'>
        {request.requestedBy ? (
          <ActorName id={request.requestedBy} kind={request.requestedVia} />
        ) : (
          t('ui.requests.someone')
        )}{' '}
        {t(`ui.requests.notice.${request.kind}`, {
          version: request.release?.version ?? '—',
          environment: request.environment?.name ?? request.environmentId,
        })}
      </AlertTitle>
      <AlertAction>
        <Link
          to={to}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          {t('ui.requests.review')}
        </Link>
      </AlertAction>
    </Alert>
  );
}

function DeploymentTable({
  appId,
  pending,
  requestTo,
  deployments,
  currentId,
  canRollback,
  canReadLogs,
  busy,
  onRollback,
}: {
  readonly appId: string;
  /** The App's pending request, first. */
  readonly pending: DeploymentRequestView | undefined;
  readonly requestTo: (requestId: string) => To;
  readonly deployments: readonly DeploymentItem[];
  readonly currentId: string | null;
  readonly canRollback: boolean;
  readonly canReadLogs: boolean;
  readonly busy: string | null;
  readonly onRollback: (deploymentId: string) => void;
}): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const notify = useNotify();
  const [logs, setLogs] = useState<
    Readonly<Record<string, Pick<JournalPage, 'entries'> | 'loading'>>
  >({});
  const toggleLogs = async (deploymentId: string): Promise<void> => {
    if (logs[deploymentId]) {
      setLogs(({ [deploymentId]: _, ...rest }) => rest);
      return;
    }
    setLogs((current) => ({ ...current, [deploymentId]: 'loading' }));
    try {
      const page = await api.list<JournalEntry>(
        `apps/${appId}/deployments/${deploymentId}/logs`,
        { fromStart: true },
      );
      setLogs((current) => ({
        ...current,
        [deploymentId]: { entries: [...page.items] },
      }));
    } catch (reason) {
      setLogs(({ [deploymentId]: _, ...rest }) => rest);
      notify.error(reason);
    }
  };
  const rows: DeploymentRow[] = [
    ...(pending ? [{ type: 'request' as const, request: pending }] : []),
    ...deployments.map((deployment) => ({
      type: 'deployment' as const,
      deployment,
    })),
  ];
  const columns: ColumnDef<DeploymentRow, unknown>[] = [
    {
      id: 'kind',
      header: t('ui.deployments.kind'),
      meta: { className: 'w-32' },
      cell: ({ row }) => {
        const item = row.original;
        const kind =
          item.type === 'request' ? item.request.kind : item.deployment.kind;
        return (
          <span className='inline-flex items-center gap-1.5'>
            {t(`ui.requests.kind.${kind}`)}
            {item.type === 'deployment' && item.deployment.id === currentId ? (
              <Tag tone='green'>{t('ui.deployments.current')}</Tag>
            ) : null}
          </span>
        );
      },
    },
    {
      id: 'version',
      header: t('ui.apps.version'),
      meta: { className: 'w-32' },
      cell: ({ row }) => {
        const item = row.original;
        const release =
          item.type === 'request'
            ? item.request.release
            : item.deployment.release;
        return (
          <span className='font-mono text-xs tabular-nums'>
            {release?.version ?? '—'}
          </span>
        );
      },
    },
    {
      id: 'artifact',
      header: t('ui.artifacts.ran'),
      meta: { className: 'w-64' },
      cell: ({ row }) =>
        row.original.type === 'deployment' ? (
          <DeploymentArtifactTag artifact={row.original.deployment.artifact} />
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    {
      id: 'status',
      header: t('ui.deployments.status'),
      meta: { className: 'min-w-48' },
      cell: ({ row }) => {
        const item = row.original;
        if (item.type === 'request')
          return (
            <StatusTag
              status={item.request.status}
              wording='ui.requests.status'
            />
          );
        return (
          <div className='min-w-0'>
            <StatusTag
              status={item.deployment.status}
              wording='ui.deployments.statuses'
            />
            {item.deployment.error ? (
              <p className='mt-1 text-xs text-destructive wrap-anywhere'>
                {messageText(t, item.deployment.error)}
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      id: 'by',
      header: t('ui.deployments.by'),
      meta: { className: 'w-48' },
      cell: ({ row }) => {
        const item = row.original;
        const [id, kind] =
          item.type === 'request'
            ? [item.request.requestedBy, item.request.requestedVia]
            : [item.deployment.actorId, item.deployment.actorKind];
        return (
          <span className='inline-flex min-w-0 items-center gap-1.5'>
            {id ? <ActorName id={id} kind={kind} /> : '—'}
            <span className='text-xs text-muted-foreground'>
              {t(`ui.actors.${kind}`)}
            </span>
          </span>
        );
      },
    },
    {
      id: 'created',
      header: t('ui.releases.created'),
      meta: { className: 'w-44' },
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className='text-muted-foreground tabular-nums'>
            {formatDate(
              item.type === 'request'
                ? item.request.createdAt
                : item.deployment.createdAt,
              i18n.language,
            )}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <span className='sr-only'>{t('ui.common.actions')}</span>,
      meta: { className: 'w-12 text-right' },
      cell: ({ row }) => {
        const item = row.original;
        if (item.type === 'request')
          return (
            <Link
              to={requestTo(item.request.id)}
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              {item.request.decidable
                ? t('ui.requests.review')
                : t('ui.requests.view')}
            </Link>
          );
        const deployment = item.deployment;
        const rollbackable =
          canRollback &&
          deployment.status === 'succeeded' &&
          deployment.id !== currentId;
        if (!canReadLogs && !rollbackable) return null;
        return (
          <RowActions
            name={deployment.release?.version ?? deployment.id}
            busy={
              logs[deployment.id] === 'loading' ||
              busy === `rollback:${deployment.id}`
            }
          >
            {canReadLogs ? (
              <DropdownMenuItem onClick={() => void toggleLogs(deployment.id)}>
                <ScrollTextIcon />
                {logs[deployment.id]
                  ? t('ui.deployments.hideLogs')
                  : t('ui.deployments.logs')}
              </DropdownMenuItem>
            ) : null}
            {rollbackable ? (
              <DropdownMenuItem
                disabled={busy !== null}
                onClick={() => onRollback(deployment.id)}
              >
                <Undo2Icon />
                {t('ui.deployments.rollback')}
              </DropdownMenuItem>
            ) : null}
          </RowActions>
        );
      },
    },
  ];
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(item) =>
        item.type === 'request'
          ? `request:${item.request.id}`
          : item.deployment.id
      }
      emptyMessage={t('ui.deployments.empty')}
      scroll
      renderBelow={(item) => {
        if (item.type === 'request') return null;
        const page = logs[item.deployment.id];
        if (!page || page === 'loading') return null;
        return (
          <pre className='max-h-64 overflow-auto rounded-md bg-muted/50 p-3 font-mono text-xs leading-5 whitespace-pre-wrap'>
            {page.entries.length === 0
              ? t('ui.deployments.noLogs')
              : page.entries
                  .map(
                    (entry) =>
                      `${entry.time} ${String(entry.level)} ${typeof entry.phase === 'string' ? entry.phase : ''} ${entry.msg}`,
                  )
                  .join('\n')}
          </pre>
        );
      }}
    />
  );
}

function RequestsSection({
  requests,
  busy,
  onReview,
  onCancel,
}: {
  readonly requests: readonly DeploymentRequestView[];
  readonly busy: string | null;
  /** Opens the request's dialog, where an approver decides it. */
  readonly onReview: (request: DeploymentRequestView) => void;
  readonly onCancel: (request: DeploymentRequestView) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const columns: ColumnDef<DeploymentRequestView, unknown>[] = [
    {
      id: 'kind',
      header: t('ui.deployments.kind'),
      meta: { className: 'w-24' },
      cell: ({ row }) => t(`ui.requests.kind.${row.original.kind}`),
    },
    {
      id: 'status',
      header: t('ui.deployments.status'),
      meta: { className: 'w-28' },
      cell: ({ row }) => (
        <StatusTag status={row.original.status} wording='ui.requests.status' />
      ),
    },
    {
      id: 'requestedBy',
      header: t('ui.requests.requestedBy'),
      meta: { className: 'w-40' },
      cell: ({ row }) =>
        row.original.requestedBy ? (
          <ActorName
            id={row.original.requestedBy}
            kind={row.original.requestedVia}
          />
        ) : (
          '—'
        ),
    },
    {
      id: 'decidedBy',
      header: t('ui.requests.decidedBy'),
      meta: { className: 'w-40' },
      cell: ({ row }) =>
        row.original.decidedBy ? (
          <ActorName id={row.original.decidedBy} kind='human' />
        ) : (
          '—'
        ),
    },
    {
      id: 'note',
      header: t('ui.requests.note'),
      cell: ({ row }) => (
        <span className='line-clamp-2 text-muted-foreground'>
          {row.original.note ?? '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className='sr-only'>{t('ui.common.actions')}</span>,
      meta: { className: 'w-12 text-right' },
      cell: ({ row }) =>
        row.original.status === 'pending' ? (
          <RowActions
            name={t(`ui.requests.kind.${row.original.kind}`)}
            disabled={busy !== null}
            busy={busy?.endsWith(`:${row.original.id}`)}
          >
            {row.original.decidable ? (
              <DropdownMenuItem onClick={() => onReview(row.original)}>
                <ClipboardCheckIcon />
                {t('ui.requests.review')}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => onCancel(row.original)}>
              <BanIcon />
              {t('ui.requests.cancel')}
            </DropdownMenuItem>
          </RowActions>
        ) : null,
    },
  ];
  return (
    <Section title={t('ui.requests.title')} count={requests.length}>
      <DataTable
        columns={columns}
        data={requests}
        getRowId={(request) => request.id}
        scroll
      />
    </Section>
  );
}

/**
 * The deployed App's config.yml, on the Settings tab as "Advanced": a card saved on its own. Before the first
 * deployment there is no file yet, and an App configured from outside release management has none to edit: either way
 * the card says so and points to the variables.
 */
function ConfigurationCard({
  appId,
  deployed,
  variablesHref,
}: {
  readonly appId: string;
  readonly deployed: boolean;
  readonly variablesHref: string;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const notify = useNotify();
  const config = useLoad(
    () =>
      deployed
        ? api.get<ConfigDocument>(`apps/${appId}/config`)
        : Promise.resolve(null),
    `config:${appId}:${String(deployed)}`,
  );
  const [draft, setDraft] = useState<string>();
  const [secretDrafts, setSecretDrafts] = useState<ConfigSecretDrafts>({});
  const [saving, setSaving] = useState(false);
  const value = draft ?? config.data?.content ?? '';
  const secrets = config.data?.secrets ?? [];
  const changes = configSecretChanges(secrets, secretDrafts);
  const dirty = draft !== undefined || Object.keys(secretDrafts).length > 0;
  const editable = !!config.data && config.data.mode !== 'external';
  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      await api.send('PUT', `apps/${appId}/config`, {
        content: value,
        ...(changes.length > 0 ? { secretChanges: changes } : {}),
      });
      setDraft(undefined);
      setSecretDrafts({});
      notify.success(t('ui.config.saved'));
      config.reload();
    } catch (reason) {
      notify.error(reason);
      // Saved but not reloaded by the runtime: what was sent is stored, so the drafts are done.
      if (
        reason instanceof ApiClientError &&
        reason.reason === 'CONFIG_RELOAD_FAILED'
      ) {
        setDraft(undefined);
        setSecretDrafts({});
        config.reload();
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card data-slot='app-config'>
      <CardHeader>
        <CardTitle>{t('ui.config.title')}</CardTitle>
        <CardDescription>{t('ui.config.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {!deployed || config.data?.mode === 'external' ? (
          <EmptyState
            className='min-h-40 p-6 md:p-6'
            icon={<FileCogIcon />}
            title={
              deployed
                ? t('ui.config.externalTitle')
                : t('ui.config.noFileTitle')
            }
            description={
              deployed ? t('ui.config.external') : t('ui.config.noFile')
            }
            action={
              <Link
                to={variablesHref}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                {t('ui.config.toVariables')}
              </Link>
            }
          />
        ) : config.error !== undefined && !config.data ? (
          <LoadError
            title={t('ui.config.loadFailed')}
            error={config.error}
            onRetry={config.reload}
          />
        ) : !config.data ? (
          <ListSkeleton rows={3} />
        ) : (
          <div className='space-y-3'>
            <Textarea
              aria-label='config.yml'
              aria-describedby={
                secrets.length > 0 ? 'rel-config-masked-hint' : undefined
              }
              className='min-h-64 bg-card font-mono text-xs'
              spellCheck={false}
              value={value}
              onChange={(event) => setDraft(event.target.value)}
            />
            {secrets.length > 0 ? (
              <p
                id='rel-config-masked-hint'
                className='text-sm text-muted-foreground'
              >
                {t('ui.config.maskedHint', { mask: CONFIG_SECRET_MASK })}
              </p>
            ) : null}
            <ConfigSecrets
              secrets={secrets}
              drafts={secretDrafts}
              disabled={saving}
              onChange={setSecretDrafts}
            />
          </div>
        )}
      </CardContent>
      {editable ? (
        <CardFooter className='justify-end gap-2'>
          {dirty ? (
            <Button
              variant='outline'
              disabled={saving}
              onClick={() => {
                setDraft(undefined);
                setSecretDrafts({});
              }}
            >
              {t('ui.config.discard')}
            </Button>
          ) : null}
          <Button disabled={!dirty || saving} onClick={() => void save()}>
            {saving ? <Spinner data-icon='inline-start' /> : null}
            {t('ui.config.save')}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
