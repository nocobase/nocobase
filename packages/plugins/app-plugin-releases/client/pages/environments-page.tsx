/**
 * Environments settings: where Apps are deployed. Reading lists them with their driver; a row opens the environment's
 * page at `:environmentId` (the child route, `environment-page.tsx`), where it is viewed and edited. Adding one is a
 * dialog (`components/environment-form.tsx`); a row's menu also checks the environment and deletes it. Outcomes are
 * toasts.
 */
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowRightIcon,
  PencilIcon,
  PlugZapIcon,
  PlusIcon,
  ServerIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, useNavigate, useOutlet } from 'react-router';

import type { EnvironmentRecord } from '../../shared/releases.js';
import { ActorName } from '../components/actor-name.js';
import { useConfirmDialog } from '../components/confirm-dialog.js';
import { DataTable } from '../components/data-table.js';
import { EnvironmentForm } from '../components/environment-form.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { EnvironmentBadges } from '../components/release-badges.js';
import { RowActions } from '../components/row-actions.js';
import { EmptyState, ListSkeleton, LoadError } from '../components/states.js';
import { Button } from '../components/ui/button.js';
import { Dialog, DialogContent } from '../components/ui/dialog.js';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu.js';
import { useDriverNames } from '../hooks/use-driver-names.js';
import { useEnvironmentCheck } from '../hooks/use-environment-check.js';
import { useNotify } from '../hooks/use-notify.js';
import { useLoad, useMe, useReleasesApi } from '../hooks/use-releases.js';

export default function EnvironmentsPage(): ReactElement {
  const outlet = useOutlet();
  if (outlet) return <>{outlet}</>;
  return <EnvironmentsList />;
}

export function EnvironmentsList(): ReactElement {
  const api = useReleasesApi();
  const me = useMe();
  const notify = useNotify();
  const navigate = useNavigate();
  const canManage = me.permissions.settings['rel.environments/manage'];
  const environments = useLoad(
    () =>
      api.list<EnvironmentRecord>('environments').then((page) => page.items),
    'environments',
  );
  const { drivers, driverName, t } = useDriverNames();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const confirmDialog = useConfirmDialog();
  const check = useEnvironmentCheck(t, setBusy);
  const open = (environment: EnvironmentRecord, tab?: string): void =>
    void navigate(
      `${encodeURIComponent(environment.id)}${tab ? `?tab=${tab}` : ''}`,
    );

  const remove = async (environment: EnvironmentRecord): Promise<void> => {
    const confirmed = await confirmDialog.ask({
      title: t('ui.environments.confirmDelete', { id: environment.id }),
      action: t('ui.environments.delete'),
      destructive: true,
    });
    if (confirmed === null) return;
    setBusy(`delete:${environment.id}`);
    try {
      await api.send('DELETE', `environments/${environment.id}`);
      notify.success(t('ui.environments.deleted', { name: environment.name }));
      environments.reload();
    } catch (reason) {
      notify.error(reason);
    } finally {
      setBusy(null);
    }
  };

  const columns: ColumnDef<EnvironmentRecord, unknown>[] = [
    {
      id: 'name',
      header: t('ui.environments.name'),
      meta: { className: 'min-w-40' },
      cell: ({ row }) => (
        <div className='min-w-0'>
          <Link
            to={encodeURIComponent(row.original.id)}
            onClick={(event) => event.stopPropagation()}
            className='font-medium hover:underline'
          >
            {row.original.name}
          </Link>
          <div className='truncate font-mono text-xs text-muted-foreground'>
            {row.original.id}
          </div>
        </div>
      ),
    },
    {
      id: 'driver',
      header: t('ui.environments.runsOn'),
      meta: { className: 'w-32' },
      cell: ({ row }) => driverName(row.original.driver, row.original.config),
    },
    {
      id: 'policy',
      header: t('ui.environments.policy'),
      meta: { className: 'w-64' },
      cell: ({ row }) => (
        <span className='flex flex-wrap gap-1'>
          <EnvironmentBadges protected={row.original.protected} />
        </span>
      ),
    },
    {
      id: 'approvers',
      header: t('ui.environments.approversColumn'),
      meta: { className: 'w-48' },
      cell: ({ row }) =>
        row.original.approvers.length > 0 ? (
          <span className='flex flex-wrap gap-x-2 gap-y-1'>
            {row.original.approvers.map((userId) => (
              <ActorName key={userId} id={userId} kind='human' />
            ))}
          </span>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    {
      id: 'publicUrl',
      header: t('ui.environments.publicUrl'),
      cell: ({ row }) => (
        <span className='font-mono text-xs break-all text-muted-foreground'>
          {row.original.publicUrl ?? '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className='sr-only'>{t('ui.common.actions')}</span>,
      meta: { className: 'w-12 text-right' },
      cell: ({ row }) => (
        // The menu is a control of its own: choosing in it does not open the row.
        <div onClick={(event) => event.stopPropagation()}>
          <RowActions
            name={row.original.name}
            disabled={busy !== null}
            busy={busy?.endsWith(`:${row.original.id}`)}
          >
            <DropdownMenuItem onClick={() => open(row.original)}>
              <ArrowRightIcon />
              {t('ui.environments.open')}
            </DropdownMenuItem>
            {canManage ? (
              <DropdownMenuItem onClick={() => open(row.original, 'settings')}>
                <PencilIcon />
                {t('ui.environments.edit')}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => void check(row.original)}>
              <PlugZapIcon />
              {t('ui.environments.check')}
            </DropdownMenuItem>
            {canManage ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => void remove(row.original)}
                >
                  <Trash2Icon />
                  {t('ui.environments.delete')}
                </DropdownMenuItem>
              </>
            ) : null}
          </RowActions>
        </div>
      ),
    },
  ];

  const addButton = () =>
    canManage ? (
      <Button onClick={() => setAdding(true)}>
        <PlusIcon data-icon='inline-start' />
        {t('ui.environments.add')}
      </Button>
    ) : null;

  let content: ReactElement;
  if (environments.error !== undefined && !environments.data)
    content = (
      <LoadError
        title={t('ui.environments.loadFailed')}
        error={environments.error}
        onRetry={environments.reload}
      />
    );
  else if (!environments.data) content = <ListSkeleton />;
  else if (environments.data.length === 0)
    content = (
      <EmptyState
        icon={<ServerIcon />}
        title={t('ui.environments.emptyTitle')}
        description={
          canManage
            ? t('ui.environments.emptyDescription')
            : t('ui.environments.emptyNoAccess')
        }
        action={addButton()}
      />
    );
  else
    content = (
      <DataTable
        columns={columns}
        data={environments.data}
        getRowId={(environment) => environment.id}
        onRowClick={(row) => open(row.original)}
      />
    );

  return (
    <PageContainer>
      <PageHeader
        title={t('ui.environments.title')}
        description={t('ui.environments.description')}
        actions={
          environments.data && environments.data.length > 0 ? addButton() : null
        }
      />
      {content}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'>
          {adding ? (
            <EnvironmentForm
              environment={undefined}
              drivers={drivers.data ?? []}
              driverName={driverName}
              onDone={() => {
                setAdding(false);
                environments.reload();
              }}
              onCancel={() => setAdding(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      {confirmDialog.dialog}
    </PageContainer>
  );
}
