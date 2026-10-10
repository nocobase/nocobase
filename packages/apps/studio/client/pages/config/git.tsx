/**
 * `/config/git` ("Git"): how the workspace reaches its code hosts, as a list of sources, as many as it needs
 * (`studio.git` `read`; adding, changing and removing take `manage`). Each source is titled by its provider's icon and
 * name with its own ("GitHub · Acme"). An app is one card with its app id, host, how people may connect their own
 * account, the webhook and callback URLs to copy, and its installations, one per organization or account it is
 * installed on, each with the repositories it reaches (read live), the linked repositories that use it (a popover listing
 * each with its project, linking to the project's CI settings) and its state;
 * "Add installation" connects it on another account with the app's credentials. An app Studio created on the host shows
 * where to install it until it is, and where its device flow is turned on. A token is a card of its own: its provider,
 * name and badges, its account and host, then its state, reach, use and how people connect their own account. "Add
 * connection" lists the providers (`GIT_PROVIDER_CHOICES`) and opens the chosen one's dialog (`connection-dialogs.tsx`);
 * GitHub's creates an app on the host from Studio's manifest, and the host sends the browser back here with
 * `installed=1`, or `error=<code>`. Credentials are write-only: editing never shows them, and the forms say so
 * where they are entered. Without a connection nothing about git shows elsewhere.
 */
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { SettingsPageHeader } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  MoreHorizontalIcon,
  PlusIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';

import { DeliveryStatus } from '../../git/webhook-section.js';

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from 'cn';

import type { GitConnection, GitProvider } from '../../../shared/git.js';
import { useNotify } from '../../access/notify.js';
import {
  gitKeys,
  useGitApi,
  useGitConnectionReach,
  useGitConnectionUses,
  useGitConnections,
} from '../../git/api.js';
import {
  CopyValue,
  GitConnectionDialog,
  ProviderIcon,
  type GitDialog,
} from '../../git/connection-dialogs.js';
import {
  absoluteUrl,
  connectionState,
  gitSources,
  hostOf,
  type GitConnectionState,
  type GitSource,
} from '../../git/connections-model.js';
import { GIT_PROVIDER_CHOICES, providerOf } from '../../git/providers.js';
import { projectSettingsPath } from '../../projects/settings/model.js';

/** "Add connection": the providers Studio implements, each opening its own dialog. */
function AddConnectionMenu({
  align,
  onAdd,
}: {
  /** `end` under the header's button, `center` under the empty state's. */
  readonly align: 'end' | 'center';
  readonly onAdd: (provider: GitProvider) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button />}>
        <PlusIcon data-icon='inline-start' />
        {t('studioGit.connections.add')}
        <ChevronDownIcon data-icon='inline-end' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {GIT_PROVIDER_CHOICES.map((provider) => (
          <DropdownMenuItem
            key={provider}
            data-provider={provider}
            onClick={() => onAdd(provider)}
          >
            <ProviderIcon provider={provider} />
            {providerOf(provider).label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** How people may connect their own account through a connection, in words. */
function usePersonalSummary(): (connection: GitConnection) => string {
  const { t } = useTranslation();
  return (connection) =>
    connection.personalMethods.length > 0
      ? t('studioGit.connections.personalVia', {
          methods: connection.personalMethods
            .map((method) => t(`studioGit.connections.method.${method}`))
            .join(' · '),
        })
      : t('studioGit.connections.noPersonal');
}

/** "GitHub · Acme", after the provider's icon. */
function SourceTitle({
  connection,
  name,
}: {
  readonly connection: GitConnection;
  readonly name: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <ProviderIcon provider={connection.provider} />
      {t('studioGit.connections.sourceTitle', {
        provider: providerOf(connection.provider).label,
        name,
      })}
      {connection.demo ? (
        <Badge
          variant='secondary'
          data-git-demo
          title={t('studioGit.connections.demoHint')}
        >
          {t('studioGit.connections.demo')}
        </Badge>
      ) : null}
    </>
  );
}

export default function GitSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const canManage = useCan({
    resource: { type: 'settings', id: 'studio.git' },
    action: 'manage',
  }).can;
  const query = useGitConnections();
  const [dialog, setDialog] = useState<GitDialog | null>(null);
  const [removing, setRemoving] = useState<GitConnection | null>(null);
  const [params, setParams] = useSearchParams();
  // Back from the host after creating or installing an app.
  useEffect(() => {
    const error = params.get('error');
    if (params.get('installed'))
      notify.success(t('studioGit.connections.installedNotice'));
    else if (error)
      notify.error(null, t('studioGit.connections.appFailed', { code: error }));
    if (params.has('installed') || params.has('error')) {
      void queryClient.invalidateQueries({ queryKey: gitKeys.all });
      setParams({}, { replace: true });
    }
  }, [notify, params, queryClient, setParams, t]);
  const remove = useMutation({
    mutationFn: (id: string) => api.removeConnection(id),
    onSuccess: () => {
      notify.success(t('studioGit.connections.removed'));
      setRemoving(null);
    },
    onError: (error) => notify.error(error),
    onSettled: () => queryClient.invalidateQueries({ queryKey: gitKeys.all }),
  });
  const sources = gitSources(query.data ?? []);
  const addMenu = (align: 'end' | 'center'): ReactElement | null =>
    canManage ? (
      <AddConnectionMenu
        align={align}
        onAdd={(provider) => setDialog({ type: 'add', provider })}
      />
    ) : null;

  let content: ReactNode;
  if (query.isPending) content = <Spinner />;
  else if (sources.length === 0)
    content = (
      <Empty className='min-h-48 border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <GitBranchIcon />
          </EmptyMedia>
          <EmptyTitle>{t('studioGit.connections.emptyTitle')}</EmptyTitle>
          <EmptyDescription>
            {canManage
              ? t('studioGit.connections.emptyDescription')
              : t('studioGit.connections.emptyDescriptionReadOnly')}
          </EmptyDescription>
        </EmptyHeader>
        {canManage ? <EmptyContent>{addMenu('center')}</EmptyContent> : null}
      </Empty>
    );
  else
    content = (
      <div className='space-y-3'>
        {sources.map((source) => (
          <SourceCard
            key={source.key}
            source={source}
            canManage={canManage}
            onDialog={setDialog}
            onRemove={setRemoving}
          />
        ))}
      </div>
    );

  return (
    <section className='space-y-4' aria-labelledby='studio-config-git-heading'>
      <SettingsPageHeader
        id='studio-config-git-heading'
        title={t('studioGit.connections.title')}
        description={t('studioGit.connections.description')}
        readOnly={!canManage}
        actions={sources.length > 0 ? addMenu('end') : null}
      />
      {content}
      <GitConnectionDialog
        dialog={dialog}
        onClose={() => setDialog(null)}
        onFinish={(connection) => setDialog({ type: 'finish', connection })}
      />
      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('studioGit.connections.removeTitle', {
                name: removing?.name ?? '',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('studioGit.connections.removeBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              {t('studioGit.connections.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={remove.isPending}
              onClick={() => {
                if (removing) remove.mutate(removing.id);
              }}
            >
              {t('studioGit.connections.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function SourceCard({
  source,
  canManage,
  onDialog,
  onRemove,
}: {
  readonly source: GitSource;
  readonly canManage: boolean;
  readonly onDialog: (dialog: GitDialog) => void;
  readonly onRemove: (connection: GitConnection) => void;
}): ReactElement {
  const { t } = useTranslation();
  const personal = usePersonalSummary();
  if (source.kind === 'token') {
    const { connection } = source;
    return (
      <Card data-git-source='token' data-git-connection={connection.id}>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            <SourceTitle connection={connection} name={connection.name} />
            <Badge variant='outline'>
              {t('studioGit.connections.kind.token')}
            </Badge>
          </CardTitle>
          <CardDescription>
            {[connection.account, hostOf(source.webUrl)]
              .filter(Boolean)
              .join(' · ')}
          </CardDescription>
          {canManage ? (
            <CardAction>
              <RowActions
                connection={connection}
                onEdit={() => onDialog({ type: 'edit', connection })}
                onRemove={() => onRemove(connection)}
              />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          <dl
            className='grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 text-sm'
            data-git-details
          >
            <dt className='text-muted-foreground'>
              {t('studioGit.connections.columns.status')}
            </dt>
            <dd>
              <StateBadge state={connectionState(connection)} />
            </dd>
            <dt className='text-muted-foreground'>
              {t('studioGit.connections.columns.repos')}
            </dt>
            <dd>
              {connection.demo ? (
                <span
                  className='text-muted-foreground'
                  title={t('studioGit.connections.demoHint')}
                  data-git-demo-reach
                >
                  {t('studioGit.connections.demoReach')}
                </span>
              ) : (
                <Reach connectionId={connection.id} />
              )}
            </dd>
            <dt className='text-muted-foreground'>
              {t('studioGit.connections.columns.usedBy')}
            </dt>
            <dd>
              <UsedBy connection={connection} />
            </dd>
            <dt className='text-muted-foreground'>
              {t('studioGit.connections.columns.personal')}
            </dt>
            <dd>{personal(connection)}</dd>
          </dl>
        </CardContent>
      </Card>
    );
  }
  const { lead, installations } = source;
  return (
    <Card data-git-source='app' data-git-app={source.appId ?? lead.id}>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          <SourceTitle connection={lead} name={lead.name} />
          <Badge variant='outline'>{t('studioGit.connections.kind.app')}</Badge>
          <Badge variant='secondary'>
            {t('studioGit.connections.installations', {
              count: installations.length,
            })}
          </Badge>
        </CardTitle>
        <CardDescription>
          {t('studioGit.connections.appMeta', {
            appId: source.appId ?? '—',
            host: hostOf(source.webUrl),
          })}
          {' · '}
          {personal(lead)}
        </CardDescription>
        {lead.appSettingsUrl && lead.personalMethods.includes('device') ? (
          <p className='text-xs text-muted-foreground'>
            {t(`studioGit.providers.${lead.provider}.deviceFlowHint`)}{' '}
            <a
              href={lead.appSettingsUrl}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline'
            >
              {t(`studioGit.providers.${lead.provider}.appSettings`)}
              <ExternalLinkIcon className='size-3' aria-hidden='true' />
            </a>
          </p>
        ) : null}
        {canManage ? (
          <CardAction className='flex flex-wrap justify-end gap-1.5'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onDialog({ type: 'install', app: lead })}
            >
              <PlusIcon data-icon='inline-start' />
              {t('studioGit.connections.addInstallation')}
            </Button>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => onDialog({ type: 'editApp', installations })}
            >
              {t('studioGit.connections.editApp')}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className='space-y-4'>
        <MissingPermissions installations={installations} />
        {canManage && (lead.webhookUrl || lead.callbackUrl) ? (
          <div className='grid gap-3 md:grid-cols-2'>
            {lead.webhookUrl ? (
              <CopyValue
                label={t('studioGit.connections.webhookUrl')}
                value={absoluteUrl(lead.webhookUrl)}
              />
            ) : null}
            {lead.callbackUrl ? (
              <CopyValue
                label={t('studioGit.connections.callbackUrl')}
                value={absoluteUrl(lead.callbackUrl)}
              />
            ) : null}
          </div>
        ) : null}
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t('studioGit.connections.columns.account')}
                </TableHead>
                <TableHead>
                  {t('studioGit.connections.columns.installation')}
                </TableHead>
                <TableHead>
                  {t('studioGit.connections.columns.repos')}
                </TableHead>
                <TableHead>
                  {t('studioGit.connections.columns.usedBy')}
                </TableHead>
                <TableHead>
                  {t('studioGit.connections.columns.status')}
                </TableHead>
                {canManage ? <TableHead className='w-0' /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {installations.map((installation) => (
                <TableRow
                  key={installation.id}
                  data-git-connection={installation.id}
                >
                  <TableCell>
                    <div className='font-medium'>
                      {installation.account ?? '—'}
                    </div>
                    {installations.length > 1 ? (
                      <div className='text-xs text-muted-foreground'>
                        {installation.name}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {installation.installationId ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Reach connectionId={installation.id} />
                  </TableCell>
                  <TableCell>
                    <UsedBy connection={installation} />
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap items-center gap-1.5'>
                      <StateBadge state={connectionState(installation)} />
                      {canManage &&
                      connectionState(installation) === 'notInstalled' &&
                      installation.installUrl ? (
                        <Button
                          size='sm'
                          variant='outline'
                          nativeButton={false}
                          render={<a href={installation.installUrl} />}
                        >
                          {t('studioGit.connections.install', {
                            provider: providerOf(installation.provider).label,
                          })}
                          <ExternalLinkIcon data-icon='inline-end' />
                        </Button>
                      ) : null}
                    </div>
                    <DeliveryStatus
                      delivery={installation.lastDelivery}
                      lastReceivedAt={installation.lastReceivedAt}
                    />
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <RowActions
                        connection={installation}
                        onEdit={() =>
                          onDialog({ type: 'edit', connection: installation })
                        }
                        onRemove={() => onRemove(installation)}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/** Installations that have not accepted every permission Studio's app asks for, with where each accepts them. */
function MissingPermissions({
  installations,
}: {
  readonly installations: readonly GitConnection[];
}): ReactElement | null {
  const { t } = useTranslation();
  const missing = installations.filter(
    (installation) => installation.missingPermissions.length > 0,
  );
  const first = missing[0];
  if (!first) return null;
  const provider = providerOf(first.provider).label;
  const permissions = [
    ...new Set(
      missing.flatMap((installation) => installation.missingPermissions),
    ),
  ].join(', ');
  return (
    <Alert data-git-missing-permissions>
      <TriangleAlertIcon />
      <AlertTitle>
        {t('studioGit.connections.missingPermissions.title')}
      </AlertTitle>
      <AlertDescription>
        <p>
          {t('studioGit.connections.missingPermissions.description', {
            permissions,
            provider,
          })}
        </p>
        <ul className='mt-1 space-y-0.5'>
          {missing.map((installation) => (
            <li key={installation.id} className='flex flex-wrap gap-1.5'>
              <span className='font-medium'>
                {installation.account ?? installation.name}
              </span>
              {installation.permissionsUrl ? (
                <a
                  href={installation.permissionsUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline'
                >
                  {t('studioGit.connections.missingPermissions.review', {
                    provider,
                  })}
                  <ExternalLinkIcon className='size-3' aria-hidden='true' />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

const STATE_DOT: Readonly<Record<GitConnectionState, string>> = {
  ready: 'bg-emerald-500',
  notInstalled: 'bg-amber-500',
  incomplete: 'bg-destructive',
  webhookFailing: 'bg-amber-500',
  noWebhook: 'bg-amber-500',
};

function StateBadge({
  state,
}: {
  readonly state: GitConnectionState;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Badge
      variant='outline'
      data-state={state}
      title={t(`studioGit.connections.stateHint.${state}`)}
      className='gap-1.5'
    >
      <span
        aria-hidden='true'
        className={cn('size-1.5 rounded-full', STATE_DOT[state])}
      />
      {t(`studioGit.connections.state.${state}`)}
    </Badge>
  );
}

/**
 * "Used by 4 repositories", opening the list of them with their projects, each linking to its project's CI settings;
 * read when opened. Plain text when nothing uses the connection.
 */
function UsedBy({
  connection,
}: {
  readonly connection: GitConnection;
}): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const uses = useGitConnectionUses(connection.id, open);
  const label = t('studioGit.connections.usedBy', {
    count: connection.usedBy,
  });
  if (connection.usedBy === 0)
    return (
      <span className='text-muted-foreground'>
        {t('studioGit.connections.usedByNone')}
      </span>
    );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant='link'
            size='sm'
            className='h-auto gap-1 p-0 font-normal has-data-[icon=inline-end]:pr-0'
            data-git-used-by={connection.id}
          />
        }
      >
        {label}
        <ChevronDownIcon data-icon='inline-end' />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto max-w-sm min-w-64'>
        <PopoverHeader>
          <PopoverTitle>{t('studioGit.connections.usesTitle')}</PopoverTitle>
        </PopoverHeader>
        {uses.isPending ? (
          <Spinner className='size-4' />
        ) : uses.isError ? (
          <p className='text-sm text-destructive'>
            {t('studioGit.connections.usesLoadFailed')}
          </p>
        ) : (
          <ul className='flex flex-col gap-1.5 text-sm' data-git-uses>
            {uses.data.map((use) => (
              <li key={use.resourceId} className='min-w-0'>
                <Link
                  to={projectSettingsPath(use.projectId, 'ci', use.resourceId)}
                  className='font-medium underline-offset-4 hover:underline'
                  onClick={() => setOpen(false)}
                >
                  {use.repo}
                </Link>
                <span className='ml-2 text-muted-foreground'>
                  {use.projectName}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** How many repositories it reaches, read live. */
function Reach({
  connectionId,
}: {
  readonly connectionId: string;
}): ReactElement {
  const { t } = useTranslation();
  const reach = useGitConnectionReach(connectionId);
  if (reach.isPending) return <Spinner className='size-3' />;
  if (!reach.data)
    return (
      <span className='text-muted-foreground'>
        {t('studioGit.connections.reposUnreachable')}
      </span>
    );
  return (
    <span className='tabular-nums' data-reach>
      {reach.data.more
        ? t('studioGit.connections.reposMore', {
            count: reach.data.repositories,
          })
        : reach.data.repositories}
    </span>
  );
}

function RowActions({
  connection,
  onEdit,
  onRemove,
}: {
  readonly connection: GitConnection;
  readonly onEdit: () => void;
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
            aria-label={t('studioGit.connections.actionsFor', {
              name: connection.name,
            })}
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-auto min-w-40'>
        <DropdownMenuItem onClick={onEdit}>
          {t('studioGit.connections.edit')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant='destructive' onClick={onRemove}>
          {t('studioGit.connections.remove')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
