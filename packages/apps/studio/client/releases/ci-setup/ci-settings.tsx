/**
 * Settings › Deployment for one repository (`projects/settings/page.tsx` picks which). What is shown is what CI
 * reported (`GET …/ci/connection`): no way of connecting, and no target, is recorded.
 *
 * - "CI status": the Apps CI reported, in one table with fixed columns (App, last build with its state, last deploy,
 *   "…"), a header row per environment they run in (release management's order, a shield on a protected one); an App
 *   says "Not reported yet" only while its own reports are missing; the pull requests' Apps of an application are one
 *   row, `<appId>-pr-*`. Each row's "…" opens its variables (the App's in Releases; its environment's for pull
 *   requests' Apps), shows its builds, and removes it from the list after a confirmation (`DELETE …/ci/apps/:appId`):
 *   an App's link to the repository goes, the pull requests' row only hides their builds, CI reporting again brings it
 *   back, and deleting the App itself is the Apps page's. Above the table, what the last "Configure CI" run awaits
 *   (its pull request, the repository's initialization, its agent's issue) and what failed, in the reader's language
 *   (`failure.tsx`); beneath it, as a quiet line of its own, the API key Studio keeps, rotated from its own "…"
 *   (written to the repository, or, once the setup is `manual` because the person stores the secret themselves,
 *   revealed once in a dialog).
 *   "Waiting for the first report" with "Configure CI" until CI reported anything; "Configure CI"
 *   (`configure-dialog.tsx`) is in the card's header once there are rows;
 * - the builds CI reported, filtered by App.
 */
import { useApiClient } from '@nocobase/app-client';
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ExternalLinkIcon,
  KeyRoundIcon,
  ListIcon,
  MoreHorizontalIcon,
  RadarIcon,
  RotateCwIcon,
  SettingsIcon,
  ShieldIcon,
  Trash2Icon,
  TriangleAlertIcon,
  VariableIcon,
} from 'lucide-react';
import {
  Fragment,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Link, useSearchParams } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { relativeTime } from '@/extensions/nocobase-inbox/model';

import type { BuildState } from '../../../shared/builds.js';
import type {
  CiConnectionView,
  CiReportedApp,
} from '../../../shared/ci-modes.js';
import { errorText, useNotify } from '../../access/notify.js';
import { SettingsCard } from '../../projects/settings/settings-card.js';
import { CiKeyReplacementDialog } from './key-replacement-dialog.js';
import { ciPath } from '../ci-query.js';
import {
  ciModeKeys,
  useCiConnection,
  useRemoveCiApp,
  useRepositoryBuilds,
  useRevealCiKey,
} from './api.js';
import { ConfigureCiDialog } from './configure-dialog.js';
import { RevealedCiKey } from './method-details.js';
import { CiFailureAlert } from './failure.js';
import {
  buildOfRow,
  ciRowName,
  environmentSections,
  variablesPath,
  type CiEnvironmentSection,
} from './model.js';

const BUILD_VARIANT: Readonly<
  Record<BuildState, 'default' | 'secondary' | 'destructive' | 'outline'>
> = {
  queued: 'outline',
  building: 'secondary',
  failed: 'destructive',
  succeeded: 'default',
};

/** The search parameter that holds "Configure CI" open. */
const CONFIGURE = 'configure';

export function CiSettings({
  resource,
}: {
  readonly resource: ProjectResource;
}): ReactElement {
  const { t } = useTranslation();
  const connection = useCiConnection(resource.id);
  const [search, setSearch] = useSearchParams();
  const [appFilter, setAppFilter] = useState<string | null>(null);
  const recentRef = useRef<HTMLDivElement>(null);
  const view = connection.data;
  const configuring = search.get(CONFIGURE) === '1';
  const setConfiguring = (open: boolean) => {
    const params = new URLSearchParams(search);
    if (open) params.set(CONFIGURE, '1');
    else params.delete(CONFIGURE);
    setSearch(params);
  };
  const showBuilds = (appId: string) => {
    setAppFilter(appId);
    recentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <div className='flex flex-col gap-6' data-ci-settings>
      {connection.isError ? (
        <Alert variant='destructive'>
          <TriangleAlertIcon />
          <AlertTitle>{t('ciSetup.loadFailed')}</AlertTitle>
          <AlertDescription>
            {errorText(t, connection.error, t('common.requestFailed'))}
          </AlertDescription>
        </Alert>
      ) : !view ? (
        <SettingsCard id='ci-status' title={t('ciSetup.status.title')}>
          <Skeleton className='h-32 w-full' aria-label={t('ciSetup.loading')} />
        </SettingsCard>
      ) : (
        <StatusCard
          view={view}
          onConfigure={() => setConfiguring(true)}
          onShowBuilds={showBuilds}
        />
      )}
      <div ref={recentRef} className='scroll-mt-4'>
        <RecentBuilds
          resourceId={resource.id}
          apps={(view?.apps ?? []).map(ciRowName)}
          app={appFilter}
          onApp={setAppFilter}
        />
      </div>
      {view?.canManage ? (
        <ConfigureCiDialog
          open={configuring}
          onOpenChange={setConfiguring}
          view={view}
          resource={resource}
        />
      ) : null}
    </div>
  );
}

// --- Status ----------------------------------------------------------------------------------------------------------

function StatusCard({
  view,
  onConfigure,
  onShowBuilds,
}: {
  readonly view: CiConnectionView;
  readonly onConfigure: () => void;
  readonly onShowBuilds: (appId: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const sections = environmentSections(view);
  const [removing, setRemoving] = useState<CiReportedApp | null>(null);
  const configure = view.canManage ? (
    <Button type='button' onClick={onConfigure} data-ci-configure>
      <SettingsIcon data-icon='inline-start' />
      {t('ciSetup.configure.action')}
    </Button>
  ) : null;
  return (
    <SettingsCard
      id='ci-status'
      title={t('ciSetup.status.title')}
      description={t('ciSetup.status.description')}
      // The primary action sits in the empty state while there is nothing to list (L7).
      headerAction={sections.length > 0 ? configure : undefined}
    >
      {view.lastError ? (
        <CiFailureAlert
          message={view.lastError}
          failure={view.lastFailure}
          data-ci-error
        />
      ) : null}
      <RunOutcome view={view} />
      {sections.length > 0 ? (
        <ReportedAppsTable
          sections={sections}
          action={(app) => (
            <RowActions
              app={app}
              canManage={view.canManage}
              onShowBuilds={() => onShowBuilds(ciRowName(app))}
              onRemove={() => setRemoving(app)}
            />
          )}
        />
      ) : (
        <WaitingForReport
          description={
            view.canManage
              ? t('ciSetup.status.empty')
              : t('ciSetup.status.emptyReadOnly')
          }
          action={configure}
        />
      )}
      {view.key ? <KeyLine view={view} /> : null}
      <RemoveAppDialog
        resourceId={view.resourceId}
        app={removing}
        onClose={() => setRemoving(null)}
      />
    </SettingsCard>
  );
}

/** A row's "…": its variables, its builds, and removing it from the list. */
function RowActions({
  app,
  canManage,
  onShowBuilds,
  onRemove,
}: {
  readonly app: CiReportedApp;
  readonly canManage: boolean;
  readonly onShowBuilds: () => void;
  readonly onRemove: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('ciSetup.status.actionsOf', {
              appId: ciRowName(app),
            })}
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-auto min-w-40'>
        <DropdownMenuItem
          render={<Link to={variablesPath(app)} />}
          data-ci-app-variables
        >
          <VariableIcon />
          {t('ciSetup.status.variables')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShowBuilds}>
          <ListIcon />
          {t('ciSetup.status.builds')}
        </DropdownMenuItem>
        {canManage ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant='destructive'
              onClick={onRemove}
              data-ci-app-remove
            >
              <Trash2Icon />
              {t('ciSetup.remove.action')}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Removing a row asks first. An App's row only leaves this list, its link to the repository going; deleting the App
 * is the Apps page's. The pull requests' row has no link to remove: it only hides their builds here.
 */
function RemoveAppDialog({
  resourceId,
  app,
  onClose,
}: {
  readonly resourceId: string;
  readonly app: CiReportedApp | null;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const remove = useRemoveCiApp(resourceId);
  const name = app ? ciRowName(app) : '';
  return (
    <AlertDialog
      open={app !== null}
      onOpenChange={(open) => {
        if (!open && !remove.isPending) onClose();
      }}
    >
      <AlertDialogContent data-ci-remove-dialog>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('ciSetup.remove.title', { appId: name })}
          </AlertDialogTitle>
          <AlertDialogDescription
            data-ci-remove-kind={app?.pullRequests ? 'pull-requests' : 'app'}
          >
            {app?.pullRequests ? (
              t('ciSetup.remove.pullRequests')
            ) : (
              <>
                {t('ciSetup.remove.description')}{' '}
                <Link
                  to='/releases'
                  className='font-medium text-primary underline-offset-4 hover:underline'
                >
                  {t('ciSetup.remove.appsPage')}
                </Link>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>
            {t('ciSetup.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={remove.isPending}
            onClick={() => {
              if (!app) return;
              remove.mutate(app, {
                onSuccess: () => {
                  notify.success(t('ciSetup.remove.done', { appId: name }));
                  onClose();
                },
                onError: (error) => notify.error(error),
              });
            }}
            data-ci-remove-confirm
          >
            {t('ciSetup.remove.action')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** What the last "Configure CI" run awaits: its pull request, the repository's initialization, or its agent's issue. */
function RunOutcome({
  view,
}: {
  readonly view: CiConnectionView;
}): ReactElement | null {
  const { t } = useTranslation();
  const link =
    'inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline';
  let content: ReactNode = null;
  if (view.state === 'pr-open' && view.pullRequest)
    content = (
      <a
        href={view.pullRequest.url}
        target='_blank'
        rel='noreferrer'
        className={link}
      >
        {t('ciSetup.status.prOpen', { number: view.pullRequest.number })}
        <ExternalLinkIcon className='size-3' aria-hidden='true' />
      </a>
    );
  else if (view.state === 'pending') content = t('ciSetup.status.pending');
  else if (view.task)
    content = (
      <>
        {t('ciSetup.status.task')}{' '}
        <Link
          to={`/issues/${encodeURIComponent(view.task.identifier ?? view.task.issueId)}`}
          className={link}
        >
          {view.task.identifier ?? view.task.issueId}
        </Link>
      </>
    );
  return content ? (
    <p
      className='rounded-lg bg-muted/50 px-4 py-3 text-sm'
      data-ci-outcome={
        view.state === 'pr-open'
          ? 'pr-open'
          : view.state === 'pending'
            ? 'pending'
            : 'task'
      }
    >
      {content}
    </p>
  ) : null;
}

function WaitingForReport({
  description,
  action,
}: {
  readonly description: string;
  readonly action?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Empty className='min-h-40 border border-dashed p-6 md:p-6' data-ci-waiting>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <RadarIcon />
        </EmptyMedia>
        <EmptyTitle>{t('ciSetup.status.emptyTitle')}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

/** A build's state as a quiet dot and its word: color only helps. */
const BUILD_DOT: Readonly<Record<BuildState, string>> = {
  queued: 'bg-muted-foreground/50',
  building: 'bg-primary/60 animate-pulse',
  failed: 'bg-destructive',
  succeeded: 'bg-primary',
};

/**
 * The Apps CI reported, in one table: a header row per environment (release management's order, a shield on a
 * protected one), then its Apps with their last build and deploy. A row is there only because CI reported it, so its
 * state shows only while it has no report of its own. The widths are fixed so every environment's columns line up.
 */
function ReportedAppsTable({
  sections,
  action,
}: {
  readonly sections: readonly CiEnvironmentSection[];
  /** The row's "…", at its end. */
  readonly action: (app: CiReportedApp) => ReactNode;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const time = (value: string | null) =>
    value ? (
      <span title={new Date(value).toLocaleString(i18n.language)}>
        {relativeTime(value, i18n.language)}
      </span>
    ) : (
      <span className='text-muted-foreground'>—</span>
    );
  return (
    <TooltipProvider>
      <Table className='min-w-xl table-fixed' data-ci-apps>
        <colgroup>
          <col />
          <col className='w-40' />
          <col className='w-32' />
          <col className='w-12' />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead>{t('ciSetup.status.app')}</TableHead>
            <TableHead>{t('ciSetup.status.lastBuild')}</TableHead>
            <TableHead>{t('ciSetup.status.lastDeploy')}</TableHead>
            <TableHead>
              <span className='sr-only'>{t('ciSetup.status.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map(({ environment, apps }) => (
            <Fragment key={environment.id}>
              <TableRow
                className='bg-muted/40 hover:bg-muted/40'
                data-ci-environment={environment.id}
              >
                <TableCell
                  colSpan={4}
                  className='py-1.5 text-xs font-medium text-muted-foreground'
                >
                  <span className='inline-flex items-center gap-1.5'>
                    {environment.name}
                    {environment.protected ? (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span
                              className='inline-flex'
                              aria-label={t('ciSetup.status.protected')}
                              data-ci-environment-protected
                            />
                          }
                        >
                          <ShieldIcon className='size-3.5' aria-hidden />
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('ciSetup.status.protectedHint')}
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </span>
                </TableCell>
              </TableRow>
              {apps.map((app) => (
                <TableRow
                  key={`${app.appId}:${app.pullRequests ? 'pr' : 'app'}`}
                  data-ci-app={app.appId}
                  data-ci-app-environment={environment.id}
                  data-ci-app-pull-requests={app.pullRequests || undefined}
                >
                  <TableCell className='truncate'>
                    <span
                      className='font-mono text-xs'
                      title={
                        app.pullRequests
                          ? t('ciSetup.status.pullRequestApps')
                          : app.appId
                      }
                    >
                      {ciRowName(app)}
                    </span>
                    {app.connected ? null : (
                      <span
                        className='ml-2 text-xs text-muted-foreground'
                        data-ci-app-state='waiting'
                      >
                        {t('ciSetup.status.notReported')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className='flex min-w-0 items-center gap-2'>
                      {time(app.lastBuildAt)}
                      {app.lastBuildState ? (
                        <span
                          className='inline-flex items-center gap-1 text-xs text-muted-foreground'
                          data-ci-app-build={app.lastBuildState}
                        >
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${BUILD_DOT[app.lastBuildState]}`}
                            aria-hidden
                          />
                          {t(`previews.build.states.${app.lastBuildState}`)}
                        </span>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell>{time(app.lastDeployAt)}</TableCell>
                  <TableCell className='text-right'>{action(app)}</TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}

/**
 * The API key Studio keeps as the repository secret, a quiet line apart from the list, with "Rotate key" behind "…".
 * When the setup is `manual`, the person holds the secret (it was revealed to them, or Studio could not write it), so
 * rotating reveals the new one once instead of writing it to the repository.
 */
function KeyLine({ view }: { readonly view: CiConnectionView }): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const revealing = view.state === 'manual';
  const reveal = useRevealCiKey(view.resourceId);
  const [confirmReplacement, setConfirmReplacement] = useState(false);
  const rotate = useMutation({
    mutationFn: async () =>
      api.request({ method: 'POST', path: ciPath(view.resourceId, '/rotate') }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ciModeKeys.connection(view.resourceId),
      });
      notify.success(t('ciSetup.key.rotated'));
    },
    onError: (error) => notify.error(error),
  });
  const key = view.key!;
  return (
    <div
      className='mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-muted/40 py-1 pr-1 pl-3 text-xs text-muted-foreground'
      data-ci-key={key.id}
    >
      <KeyRoundIcon className='size-3.5 shrink-0' aria-hidden />
      <span className='font-medium'>{t('ciSetup.key.title')}</span>
      <span className='min-w-0 flex-1 truncate'>
        {key.status === 'missing'
          ? t('ciSetup.key.missing')
          : [
              key.name,
              t(`ciSetup.key.status.${key.status}`),
              key.expiresAt
                ? t('ciSetup.key.expires', {
                    date: new Date(key.expiresAt).toLocaleDateString(
                      i18n.language,
                    ),
                  })
                : t('ciSetup.key.never'),
              t('ciSetup.key.secret', { secret: view.secretName }),
            ].join(' · ')}
      </span>
      {view.canManage ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t('ciSetup.key.actions')}
                disabled={rotate.isPending || reveal.isPending}
              />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-auto min-w-40'>
            <DropdownMenuItem
              disabled={key.status !== 'active' && key.status !== 'expired'}
              onClick={() => {
                if (revealing) setConfirmReplacement(true);
                else rotate.mutate();
              }}
            >
              <RotateCwIcon />
              {revealing
                ? t('ciSetup.key.rotateReveal')
                : t('ciSetup.key.rotate')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      {revealing ? (
        <CiKeyReplacementDialog
          open={confirmReplacement}
          lastUsedAt={key.lastUsedAt}
          isPending={reveal.isPending}
          onOpenChange={setConfirmReplacement}
          onConfirm={() =>
            reveal.mutateAsync('rotate', {
              onError: (error) => notify.error(error),
            })
          }
        />
      ) : null}
      <Dialog
        open={Boolean(reveal.data)}
        onOpenChange={(open) => {
          if (!open) reveal.reset();
        }}
      >
        <DialogContent data-ci-rotated-key>
          <DialogHeader>
            <DialogTitle>{t('ciSetup.key.rotated')}</DialogTitle>
            <DialogDescription>{key.name}</DialogDescription>
          </DialogHeader>
          {reveal.data ? (
            <RevealedCiKey secret={reveal.data} secretName={view.secretName} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Recent builds ---------------------------------------------------------------------------------------------------

const ALL = 'all';

function RecentBuilds({
  resourceId,
  apps,
  app,
  onApp,
}: {
  readonly resourceId: string;
  /** The Apps listed above, for the filter. */
  readonly apps: readonly string[];
  /** The App shown; every one when null. */
  readonly app: string | null;
  readonly onApp: (appId: string | null) => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const builds = useRepositoryBuilds(resourceId);
  const all = builds.data ?? [];
  const rows = all.filter((build) => !app || buildOfRow(build, app));
  const appItems = [
    { value: ALL, label: t('ciSetup.recent.allApps') },
    ...[...new Set(apps)].map((item) => ({ value: item, label: item })),
  ];
  const selectClass =
    'w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal';
  let body: ReactNode;
  if (builds.isError)
    body = (
      <p className='text-sm text-muted-foreground'>
        {t('ciSetup.recent.loadFailed')}
      </p>
    );
  else if (!builds.data)
    body = (
      <Skeleton className='h-24 w-full' aria-label={t('ciSetup.loading')} />
    );
  else if (all.length === 0)
    body = (
      <p className='text-sm text-muted-foreground' data-ci-builds-empty>
        {t('ciSetup.recent.empty')}
      </p>
    );
  else
    body = (
      <Table data-ci-builds>
        <TableHeader>
          <TableRow>
            <TableHead>{t('ciSetup.recent.time')}</TableHead>
            <TableHead>{t('ciSetup.recent.app')}</TableHead>
            <TableHead>{t('ciSetup.recent.kind')}</TableHead>
            <TableHead>{t('ciSetup.recent.commit')}</TableHead>
            <TableHead>{t('ciSetup.recent.state')}</TableHead>
            <TableHead>{t('ciSetup.recent.run')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className='text-muted-foreground'>
                {t('ciSetup.recent.noMatch')}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((build) => (
              <TableRow key={build.id} data-ci-build={build.id}>
                <TableCell
                  title={new Date(build.reportedAt).toLocaleString(
                    i18n.language,
                  )}
                >
                  {relativeTime(build.reportedAt, i18n.language)}
                </TableCell>
                <TableCell className='font-mono text-xs'>
                  {build.appId}
                </TableCell>
                <TableCell>
                  {build.pullRequest
                    ? t('ciSetup.recent.kinds.pullRequest')
                    : (build.ref ?? t('ciSetup.recent.kinds.ref'))}
                </TableCell>
                <TableCell className='font-mono text-xs'>
                  {build.sha.slice(0, 7)}
                </TableCell>
                <TableCell>
                  <Badge variant={BUILD_VARIANT[build.state]}>
                    {t(`previews.build.states.${build.state}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {build.logsUrl ? (
                    <a
                      href={build.logsUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline'
                    >
                      {t('ciSetup.recent.open')}
                      <ExternalLinkIcon className='size-3' aria-hidden='true' />
                    </a>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  return (
    <SettingsCard
      id='ci-builds'
      title={t('ciSetup.recent.title')}
      description={t('ciSetup.recent.description')}
    >
      <div className='flex flex-wrap gap-2'>
        <Select
          items={appItems}
          value={app ?? ALL}
          onValueChange={(next: string | null) =>
            onApp(!next || next === ALL ? null : next)
          }
        >
          <SelectTrigger
            className='w-full sm:w-40'
            aria-label={t('ciSetup.recent.app')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectClass}>
            {appItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {body}
    </SettingsCard>
  );
}
