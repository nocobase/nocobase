import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { Link, useLocation } from 'react-router';
import { ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { Button } from '#components/ui/button';
import { StatusBadge } from '#components/status-badge';
import { Loading } from '#components/loading';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { platformLoginUrl } from './links.js';
import {
  usePortalData,
  errorKey,
  permission,
  namespace,
  safeUrl,
  type Row,
  type Runtime,
  type List,
} from './data.js';

export function Feedback({ error }: { readonly error?: unknown }) {
  const { t } = useTranslation();
  if (!error) return <Loading label={t('portal.loading')} className='py-8' />;
  return (
    <p
      className='flex items-center gap-2 py-8 text-sm text-muted-foreground'
      role='alert'
    >
      {t(errorKey(error))}
    </p>
  );
}
export function State({ value }: { readonly value?: string }) {
  const { t } = useTranslation();
  const { t: translateState } = useTranslation(namespace);
  return (
    <StatusBadge
      size='sm'
      tone={
        value === 'running' || value === 'succeeded'
          ? 'success'
          : value === 'failed' || value === 'drifted'
            ? 'warning'
            : value === 'pending' || value === 'runningOperation'
              ? 'info'
              : 'neutral'
      }
    >
      {[
        'active',
        'running',
        'stopped',
        'pending',
        'archived',
        'retired',
        'unavailable',
        'notCreated',
        'starting',
        'stopping',
      ].includes(value ?? 'pending')
        ? t(`portal.states.${value ?? 'pending'}`)
        : [
              'queued',
              'awaitingApproval',
              'succeeded',
              'failed',
              'interrupted',
            ].includes(value ?? '')
          ? translateState(`states.${value}`)
          : t('portal.states.unavailable')}
    </StatusBadge>
  );
}
export function Action({
  kind,
  id,
  action,
  disabled = false,
  search,
  menu = false,
  primary = false,
  rowAction = false,
  separator = false,
}: {
  readonly kind: 'templates' | 'instances';
  readonly id?: string;
  readonly action: string;
  readonly disabled?: boolean;
  readonly search?: string;
  readonly menu?: boolean;
  readonly primary?: boolean;
  readonly rowAction?: boolean;
  readonly separator?: boolean;
}) {
  const { t } = useTranslation(),
    location = useLocation();
  const access = useCan(
    permission(
      kind,
      action === 'upload'
        ? 'publish'
        : action === 'new'
          ? kind === 'templates'
            ? 'create'
            : 'provision'
          : action,
    ),
  );
  if (!access.can) return null;
  const label = t(
    `actions.${action === 'new' ? (kind === 'templates' ? 'create' : 'provision') : action}`,
    { ns: namespace },
  );
  const link = (
    <Link
      to={{
        pathname: `/multi-app/${kind}/${id ? `${id}/` : ''}${action}`,
        search: search ?? location.search,
      }}
    />
  );
  return menu ? (
    <>
      {separator && <DropdownMenuSeparator />}
      <DropdownMenuItem
        disabled={disabled}
        render={link}
        variant={
          ['stop', 'archive', 'retire'].includes(action)
            ? 'destructive'
            : 'default'
        }
      >
        {label}
      </DropdownMenuItem>
    </>
  ) : (
    <Button
      variant={primary ? 'default' : rowAction ? 'ghost' : 'outline'}
      className={
        rowAction ? 'min-h-12 min-w-24 text-primary sm:min-h-8' : undefined
      }
      disabled={disabled}
      nativeButton={false}
      render={link}
    >
      {label}
    </Button>
  );
}
export function MoreActions({
  kind,
  row,
  runtime,
  rowActions = false,
}: {
  readonly rowActions?: boolean;
  readonly kind: 'instances' | 'templates';
  readonly row: Row;
  readonly runtime?: Runtime;
}) {
  const { t } = useTranslation(),
    location = useLocation();
  const actions =
    kind === 'templates'
      ? ['upload', 'publish', 'retire']
      : row.status === 'archived'
        ? rowActions
          ? []
          : ['restore']
        : [
            ...(!rowActions && runtime?.state === 'stopped' ? ['start'] : []),
            'upgrade',
            'configure',
            ...(runtime?.state === 'running' ? ['stop'] : []),
            ...(runtime?.state === 'stopped' ? ['archive'] : []),
          ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            className={
              rowActions ? 'min-h-11 min-w-11 sm:min-h-8 sm:min-w-8' : undefined
            }
            aria-label={t(
              rowActions ? 'portal.moreActionsFor' : 'portal.actionsFor',
              { name: row.name ?? row.id },
            )}
          />
        }
      >
        <MoreHorizontal aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-36'>
        <DropdownMenuGroup>
          {kind === 'templates' && (
            <TemplateVersion template={row} action menu />
          )}
          {rowActions && (
            <div>
              {row.status === 'archived' || runtime?.state === 'stopped' ? (
                <Action
                  kind='instances'
                  id={row.id}
                  action={row.status === 'archived' ? 'restore' : 'start'}
                  menu
                  disabled={!!row.operationId || !runtime}
                />
              ) : (
                <Entry instance={row} runtime={runtime} menu />
              )}
            </div>
          )}

          <DropdownMenuItem
            render={
              <Link
                to={{
                  pathname: `/multi-app/${kind}/${row.id}`,
                  search: location.search,
                }}
              />
            }
          >
            {t('portal.details')}
          </DropdownMenuItem>
          {actions.map((action) => (
            <Action
              key={action}
              kind={kind}
              id={row.id}
              action={action}
              menu
              separator={['stop', 'archive', 'retire'].includes(action)}
              disabled={
                !!row.operationId ||
                (kind === 'templates'
                  ? row.status !== 'active'
                  : !runtime ||
                    (action === 'start' && runtime.state === 'running') ||
                    (action === 'stop' && runtime.state !== 'running') ||
                    (action === 'archive' && runtime.state !== 'stopped'))
              }
            />
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function Entry({
  instance,
  runtime,
  busy = false,
  hideUnavailable = false,
  menu = false,
}: {
  readonly instance: Row;
  readonly runtime?: Runtime;
  readonly busy?: boolean;
  readonly hideUnavailable?: boolean;
  readonly menu?: boolean;
}) {
  const { t } = useTranslation();
  const url = safeUrl(runtime?.url ?? null);
  const ready =
    instance.status === 'active' &&
    runtime?.state === 'running' &&
    !instance.operationId &&
    !runtime.drifted &&
    !busy;
  if (menu)
    return ready && url ? (
      <DropdownMenuItem render={<a href={platformLoginUrl(url)} />}>
        {t('portal.enter')}
      </DropdownMenuItem>
    ) : null;
  return ready && url ? (
    <Button
      size='sm'
      variant='ghost'
      className='min-h-12 min-w-24 text-primary sm:min-h-8'
      nativeButton={false}
      render={<a href={platformLoginUrl(url)} />}
    >
      <ArrowUpRight aria-hidden='true' />
      {t('portal.enter')}
    </Button>
  ) : hideUnavailable ? null : (
    <span className='text-xs text-muted-foreground'>
      {t(
        busy
          ? 'portal.loading'
          : instance.operationId
            ? 'portal.pending'
            : instance.status === 'archived'
              ? 'portal.states.archived'
              : runtime?.state === 'stopped'
                ? 'portal.stopped'
                : runtime?.drifted
                  ? 'portal.drifted'
                  : 'portal.unavailable',
      )}
    </span>
  );
}
export function InstanceRuntime({
  row,
  part,
}: {
  readonly row: Row;
  readonly part: 'version' | 'status' | 'actions';
}) {
  const { t } = useTranslation();
  const request = usePortalData<{ data: Runtime }>(
    `multiApp/instances/${row.id}/runtime?revision=${row.revision ?? 0}`,
  );
  const runtime = request.error ? undefined : request.data?.data;
  if (part === 'actions')
    return (
      <div className='flex justify-end'>
        <MoreActions kind='instances' row={row} runtime={runtime} rowActions />
      </div>
    );
  if (part === 'status')
    return (
      <div className='flex flex-col items-start gap-1'>
        <State
          value={
            row.status === 'archived'
              ? 'archived'
              : request.error
                ? 'unavailable'
                : runtime?.state
          }
        />
        {row.operationId && (
          <span className='text-xs text-muted-foreground' role='status'>
            {t('portal.operationInProgress')}
          </span>
        )}
      </div>
    );
  return (
    <div className='flex flex-col gap-1 tabular-nums'>
      <span translate='no'>{runtime?.currentVersion ?? '—'}</span>
      {row.operationId &&
        runtime?.desiredVersion &&
        runtime.currentVersion !== runtime.desiredVersion && (
          <span className='text-xs text-muted-foreground'>
            {t('portal.upgradingTo', { version: runtime.desiredVersion })}
          </span>
        )}
    </div>
  );
}
export function TemplateVersion({
  template,
  action = false,
  menu = false,
}: {
  readonly template: Row;
  readonly action?: boolean;
  readonly menu?: boolean;
}) {
  const { t } = useTranslation(),
    location = useLocation();
  const request = usePortalData<List>(
    `multiApp/templates/${template.id}/versions?pageSize=1`,
  );
  const access = useCan(permission('instances', 'provision'));
  const version = request.error ? undefined : request.data?.data[0];
  if (!action)
    return (
      <span className='tabular-nums' translate='no'>
        {request.error ? '—' : (version?.version ?? t('portal.noVersion'))}
      </span>
    );
  if (!access.can) return null;
  const disabled = !version || template.status !== 'active' || request.loading;
  const link = (
    <Link
      to={{
        pathname: `/multi-app/templates/${template.id}/provision`,
        search: new URLSearchParams({
          ...Object.fromEntries(new URLSearchParams(location.search)),
          templateId: template.id,
          versionId: version?.id ?? '',
          environmentId: template.environmentId ?? '',
        }).toString(),
      }}
    />
  );
  if (menu)
    return (
      <DropdownMenuItem disabled={disabled} render={link}>
        {t('portal.createInstance')}
      </DropdownMenuItem>
    );
  return (
    <Button
      size='sm'
      variant='ghost'
      nativeButton={false}
      disabled={disabled}
      render={link}
    >
      {t('portal.createInstance')}
    </Button>
  );
}
