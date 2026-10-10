import {
  ApiClientError,
  useGuardedClose,
  useUnsavedChangesGuard,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { type FormEvent, type ReactElement, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  canUseSetting,
  DataTable,
  PmListSkeleton,
  PmLoadError,
  PmTag,
  SettingsPageHeader,
  UnsavedChangesBoundary,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';

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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Role } from '../../../../shared/access.js';
import { memberNameOf, rolePath, roleTitle } from './roles-model.js';
import { useRoleError } from './use-role-error.js';
import { studioKeys, useStudioApi } from '../../../access/api.js';
import { useNotify } from '../../../access/notify.js';

/** The holders a `ROLE_IN_USE` refusal names (`error.metadata.holderIds`). */
function holderIdsOfError(payload: unknown): string[] {
  const metadata = (
    payload as { error?: { metadata?: { holderIds?: unknown } } } | null
  )?.error?.metadata;
  return Array.isArray(metadata?.holderIds)
    ? metadata.holderIds.filter((id): id is string => typeof id === 'string')
    : [];
}

function NewRoleDialog({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useStudioApi();
  const notify = useNotify();
  const roleError = useRoleError();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const unsaved = useUnsavedChangesGuard(title.trim() !== '');
  const requestClose = useGuardedClose(unsaved, () => {
    setTitle('');
    onClose();
  });
  const create = useMutation({
    mutationFn: () => api.createRole({ title, abilities: {}, settings: {} }),
    onSuccess: (role) => {
      notify.success(t('roles.created', { name: title.trim() }));
      void queryClient.invalidateQueries({ queryKey: studioKeys.roles });
      setTitle('');
      onClose();
      void navigate(rolePath(role.key));
    },
    onError: roleError,
  });
  function submit(event: FormEvent): void {
    event.preventDefault();
    if (title.trim()) create.mutate();
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <UnsavedChangesBoundary guard={unsaved} />
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>{t('roles.newTitle')}</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor='pm-new-role-title'>
              {t('roles.name')}
            </FieldLabel>
            <Input
              id='pm-new-role-title'
              value={title}
              maxLength={100}
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={requestClose}>
              {t('actions.cancel')}
            </Button>
            <Button type='submit' disabled={!title.trim() || create.isPending}>
              {t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The roles tab: every role of projects with its kind (built-in / custom) and how many people hold it. Whoever holds
 * `pm.members/define-roles` creates roles here and deletes custom ones nobody holds; a role opens as a covering page
 * (`roles/:key`).
 */
export function RolesPanel(): ReactElement {
  const { t } = useTranslation();
  const api = useStudioApi();
  const notify = useNotify();
  const roleError = useRoleError();
  const queryClient = useQueryClient();
  const roles = useQuery({
    queryKey: studioKeys.roles,
    queryFn: () => api.roles(),
  });
  const members = useQuery({
    queryKey: studioKeys.members,
    queryFn: () => api.members(),
  });
  const canDefine = canUseSetting(useViewer(), 'pm.members', 'define-roles');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [inUse, setInUse] = useState<readonly string[]>([]);

  const remove = useMutation({
    mutationFn: (role: Role) => api.deleteRole(role.key),
    onSuccess: (_, role) => {
      notify.success(t('roles.deleted', { name: roleTitle(t, role) }));
      setDeleting(null);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiClientError && error.reason === 'ROLE_IN_USE')
        setInUse(holderIdsOfError(error.payload));
      roleError(error);
    },
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: studioKeys.roles }),
  });

  const columns = useMemo<ColumnDef<Role, unknown>[]>(
    () => [
      {
        id: 'name',
        header: t('roles.columns.name'),
        meta: { className: 'w-full max-w-0' },
        cell: ({ row }) => (
          <div className='flex min-w-0 items-center gap-2'>
            <Link
              to={rolePath(row.original.key)}
              className='max-w-[30rem] truncate font-medium hover:underline focus-visible:underline'
              title={roleTitle(t, row.original)}
            >
              {roleTitle(t, row.original)}
            </Link>
          </div>
        ),
      },
      {
        id: 'kind',
        header: t('roles.columns.kind'),
        meta: { className: 'w-28' },
        cell: ({ row }) =>
          row.original.builtIn ? (
            <PmTag tone='blue'>{t('roles.builtIn')}</PmTag>
          ) : (
            <PmTag tone='grey'>{t('roles.custom')}</PmTag>
          ),
      },
      {
        id: 'holders',
        header: t('roles.columns.holders'),
        meta: { className: 'w-28' },
        cell: ({ row }) => (
          <span className='tabular-nums'>{row.original.holderCount}</span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('roles.actions')}</span>,
        meta: { className: 'w-12' },
        cell: ({ row }) =>
          canDefine && !row.original.builtIn ? (
            <div className='flex justify-end'>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={t('roles.actionsFor', {
                        name: roleTitle(t, row.original),
                      })}
                    />
                  }
                >
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-auto min-w-40'>
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={() => {
                      setInUse(row.original.holderIds);
                      setDeleting(row.original);
                    }}
                  >
                    <Trash2Icon />
                    {t('roles.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null,
      },
    ],
    [t, canDefine],
  );

  const nameOf = (userId: string): string => memberNameOf(members.data, userId);

  let content: ReactElement;
  if (roles.isError && !roles.data) {
    content = (
      <PmLoadError
        title={t('roles.loadFailed')}
        error={roles.error}
        onRetry={() => void roles.refetch()}
      />
    );
  } else if (!roles.data) {
    content = <PmListSkeleton rows={3} />;
  } else {
    content = (
      <DataTable
        columns={columns}
        data={roles.data}
        pageSize={50}
        showSelectedCount={false}
        getRowId={(role) => role.key}
      />
    );
  }

  return (
    <section className='space-y-4' aria-labelledby='pm-config-roles-heading'>
      <SettingsPageHeader
        id='pm-config-roles-heading'
        title={t('roles.title')}
        description={t('roles.description')}
        readOnly={!canDefine}
        actions={
          canDefine ? (
            <Button onClick={() => setCreating(true)}>
              <PlusIcon />
              {t('roles.new')}
            </Button>
          ) : null
        }
      />
      {content}
      <NewRoleDialog open={creating} onClose={() => setCreating(false)} />
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('roles.deleteTitle', {
                name: deleting ? roleTitle(t, deleting) : '',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {inUse.length > 0
                ? t('roles.deleteInUse', { count: inUse.length })
                : t('roles.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {inUse.length > 0 ? (
            <ul className='flex flex-wrap gap-1'>
              {inUse.map((userId) => (
                <li key={userId}>
                  <PmTag tone='grey'>{nameOf(userId)}</PmTag>
                </li>
              ))}
            </ul>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={inUse.length > 0 || remove.isPending}
              onClick={() => {
                if (deleting) remove.mutate(deleting);
              }}
            >
              {t('roles.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
