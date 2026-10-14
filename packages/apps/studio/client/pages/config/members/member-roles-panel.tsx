import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import {
  UsersClient,
  type ManagedUser,
} from '@nocobase/app-plugin-users/client/user-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon, UserPlusIcon } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  canManageProject,
  canUseSetting,
  DataTable,
  InvitationsSection,
  InviteDialog,
  PmLoadError,
  PmListSkeleton,
  PmMultiSelect,
  SettingsPageHeader,
  pmKeys,
  usePmApi,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import type { MemberWithRoles } from '../../../../shared/access.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Field, FieldLabel } from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotify } from '../../../access/notify.js';

function userFailure(error: unknown, t: (key: string) => string): string {
  if (!(error instanceof ApiClientError)) return t('common.requestFailed');
  if (error.reason === 'LAST_ASSIGNMENT')
    return t('userManagement.lastAssignment');
  if (error.reason === 'USER_DISABLED')
    return t('userManagement.disabledAssignment');
  if (error.reason === 'OWNER_REQUIRED')
    return t('userManagement.ownerRequired');
  if (error.status === 403) return t('common.forbidden');
  if (error.status === 404) return t('members.memberNotFound');
  return t('common.requestFailed');
}

const usersKey = ['studio', 'users'] as const;
function useUsers(): UsersClient {
  const api = useApiClient();
  return useMemo(() => new UsersClient(api), [api]);
}

export function MemberActions({
  member,
  viewerId,
  user,
}: {
  readonly member: MemberWithRoles;
  readonly viewerId?: string;
  readonly user?: ManagedUser;
}): ReactElement | null {
  const { t } = useTranslation();
  const users = useUsers(),
    query = useQueryClient(),
    notify = useNotify();
  const update = useCan({
    resource: { type: 'user', id: member.userId },
    action: 'update',
  }).can;
  const disable = useCan({
    resource: { type: 'user', id: member.userId },
    action: user?.disabledAt ? 'enable' : 'disable',
  }).can;
  const reset = useCan({
    resource: { type: 'user', id: member.userId },
    action: 'reset-password',
  }).can;
  const [params, setParams] = useSearchParams();
  const editing = params.get('edit') === member.userId;
  const setEditing = (open: boolean) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (open) next.set('edit', member.userId);
        else next.delete('edit');
        return next;
      },
      { replace: !open },
    );
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState(user?.name ?? member.name),
    [username, setUsername] = useState(user?.username ?? ''),
    [email, setEmail] = useState(user?.email ?? '');
  const [failure, setFailure] = useState('');
  const refresh = async () => {
    await query.invalidateQueries({ queryKey: usersKey });
    await query.invalidateQueries({ queryKey: ['studio', 'access'] });
  };
  const save = useMutation({
    mutationFn: () =>
      users.update(member.userId, { name, username: username || null, email }),
    onSuccess: async () => {
      setEditing(false);
      notify.success(t('userManagement.saved'));
      await refresh();
    },
    onError: (error) =>
      setFailure(
        t(
          error instanceof ApiClientError && error.status === 409
            ? 'userManagement.conflict'
            : 'common.requestFailed',
        ),
      ),
  });
  const status = useMutation({
    mutationFn: () =>
      user?.disabledAt
        ? users.enable(member.userId)
        : users.disable(member.userId),
    onSuccess: async () => {
      setConfirming(false);
      notify.success(t('userManagement.saved'));
      await refresh();
    },
    onError: (error) => setFailure(userFailure(error, t)),
  });
  const own = member.userId === viewerId;
  if (!update && (!disable || own) && (!reset || own)) return null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!save.isPending) save.mutate();
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('members.actions')}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-auto min-w-40'>
          {update && user ? (
            <DropdownMenuItem
              onClick={() => {
                setName(user.name);
                setUsername(user.username ?? '');
                setEmail(user.email);
                setFailure('');
                setEditing(true);
              }}
            >
              {t('userManagement.edit')}
            </DropdownMenuItem>
          ) : null}
          {disable && user && !own ? (
            <DropdownMenuItem
              onClick={() => {
                setFailure('');
                setConfirming(true);
              }}
            >
              {t(
                user.disabledAt
                  ? 'userManagement.enable'
                  : 'userManagement.disable',
              )}
            </DropdownMenuItem>
          ) : null}
          {reset && !own ? (
            <DropdownMenuItem
              render={
                <Link to={`${member.userId}/reset-password`} relative='path' />
              }
            >
              {t('members.resetPassword')}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={editing}
        onOpenChange={(open) => {
          if (!save.isPending) setEditing(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('userManagement.edit')}</DialogTitle>
          </DialogHeader>
          <form
            id={`edit-user-${member.userId}`}
            onSubmit={submit}
            className='flex flex-col gap-4'
          >
            {failure ? (
              <Alert variant='destructive'>
                <AlertDescription>{failure}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor={`name-${member.userId}`}>
                {t('members.columns.name')}
              </FieldLabel>
              <Input
                id={`name-${member.userId}`}
                value={name}
                required
                disabled={save.isPending}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`username-${member.userId}`}>
                {t('userManagement.username')}
              </FieldLabel>
              <Input
                id={`username-${member.userId}`}
                value={username}
                disabled={save.isPending}
                onChange={(event) => setUsername(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`email-${member.userId}`}>
                {t('members.columns.email')}
              </FieldLabel>
              <Input
                id={`email-${member.userId}`}
                type='email'
                value={email}
                required
                disabled={save.isPending}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
          </form>
          <DialogFooter>
            <Button
              variant='outline'
              disabled={save.isPending}
              onClick={() => setEditing(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              form={`edit-user-${member.userId}`}
              type='submit'
              disabled={save.isPending}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={confirming}
        onOpenChange={(open) => {
          if (!status.isPending) setConfirming(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                user?.disabledAt
                  ? 'userManagement.enable'
                  : 'userManagement.disable',
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                user?.disabledAt
                  ? 'userManagement.enableNotice'
                  : 'userManagement.disableNotice',
                { name: member.name },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {failure ? (
            <Alert variant='destructive'>
              <AlertDescription>{failure}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={status.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={status.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!status.isPending) status.mutate();
              }}
            >
              {t(
                user?.disabledAt
                  ? 'userManagement.enable'
                  : 'userManagement.disable',
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function UserRolesPicker({
  user,
  options,
  disabled,
  onChange,
}: {
  user: ManagedUser;
  options: Awaited<
    ReturnType<UsersClient['options']>
  >['roleScopes'][number]['options'];
  disabled: boolean;
  onChange: (value: string[]) => void;
}): ReactElement {
  const { t } = useTranslation();
  const canAssign = useCan({
    resource: { type: 'user', id: user.id },
    action: 'assign-role',
  }).can;
  const held = user.roleScopes.studio;
  const value = typeof held === 'string' ? [held] : [...(held ?? [])];
  return (
    <PmMultiSelect
      aria-label={t('roles.rolesFor', { name: user.name })}
      options={options
        .filter(
          (option) =>
            option.assignable !== false || value.includes(option.value),
        )
        .map((option) => ({
          value: option.value,
          label: option.labelI18nKey ? t(option.labelI18nKey) : option.label,
          disabled:
            option.removable === false ||
            Boolean(user.disabledAt && !value.includes(option.value)),
        }))}
      value={value}
      disabled={disabled || !canAssign}
      onChange={onChange}
    />
  );
}

export function MemberRolesPanel(): ReactElement {
  const { t } = useTranslation();
  const users = useUsers(),
    query = useQueryClient(),
    notify = useNotify(),
    viewer = useViewer();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const search = params.get('q') ?? '';
  const status = ['enabled', 'disabled'].includes(params.get('status') ?? '')
    ? params.get('status')!
    : 'all';
  const filter = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('edit');
        next.delete('page');
        if (value && value !== 'all') next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  const setPage = (value: number) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('page', String(value));
      return next;
    });
  const members = useQuery({
    queryKey: [...usersKey, page, search, status],
    queryFn: () =>
      users.list({
        page,
        pageSize: 20,
        q: search,
        ...(status === 'all'
          ? {}
          : { status: status as 'enabled' | 'disabled' }),
      }),
  });
  const options = useQuery({
    queryKey: [...usersKey, 'options'],
    queryFn: () => users.options(),
  });
  const roleOptions = useMemo(
    () =>
      options.data?.roleScopes.find((scope) => scope.key === 'studio')
        ?.options ?? [],
    [options.data],
  );
  const change = useMutation({
    mutationFn: ({ id, value }: { id: string; value: readonly string[] }) =>
      users.replaceRoleScope(id, 'studio', value),
    onSuccess: async () => {
      await query.invalidateQueries({ queryKey: usersKey });
      await query.invalidateQueries({ queryKey: ['studio', 'access'] });
      notify.success(t('userManagement.saved'));
    },
    onError: (error) => notify.error(undefined, userFailure(error, t)),
  });
  const columns = useMemo<ColumnDef<ManagedUser, unknown>[]>(
    () => [
      { accessorKey: 'id', header: t('userManagement.identifier') },
      { accessorKey: 'name', header: t('members.columns.name') },
      { accessorKey: 'username', header: t('userManagement.username') },
      { accessorKey: 'email', header: t('members.columns.email') },
      {
        id: 'status',
        header: t('userManagement.status'),
        cell: ({ row }) =>
          t(
            row.original.disabledAt
              ? 'userManagement.disabled'
              : 'userManagement.enabled',
          ),
      },
      {
        id: 'roles',
        header: t('members.columns.roles'),
        cell: ({ row }) => (
          <UserRolesPicker
            user={row.original}
            options={roleOptions}
            disabled={change.isPending || options.isPending}
            onChange={(value) => change.mutate({ id: row.original.id, value })}
          />
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <MemberActions
            user={row.original}
            member={{
              userId: row.original.id,
              name: row.original.name,
              email: row.original.email,
              roles: [],
            }}
            viewerId={viewer?.userId}
          />
        ),
      },
    ],
    [t, roleOptions, change, options.isPending, viewer?.userId],
  );
  return (
    <div className='flex flex-col gap-6'>
      <section className='flex flex-col gap-4'>
        <SettingsPageHeader
          id='studio-users-heading'
          title={t('members.title')}
          description={t('members.description')}
        />
        <div className='flex flex-wrap gap-2'>
          <Input
            aria-label={t('userManagement.search')}
            placeholder={t('userManagement.search')}
            value={search}
            onChange={(event) => {
              filter('q', event.target.value);
            }}
            className='sm:max-w-xs'
          />
          <NativeSelect
            aria-label={t('userManagement.status')}
            value={status}
            onChange={(event) => {
              filter('status', event.target.value);
            }}
          >
            <NativeSelectOption value='all'>
              {t('userManagement.all')}
            </NativeSelectOption>
            <NativeSelectOption value='enabled'>
              {t('userManagement.enabled')}
            </NativeSelectOption>
            <NativeSelectOption value='disabled'>
              {t('userManagement.disabled')}
            </NativeSelectOption>
          </NativeSelect>
        </div>
        {members.isError ? (
          <PmLoadError
            title={t('members.loadFailed')}
            error={members.error}
            onRetry={() => void members.refetch()}
          />
        ) : members.data ? (
          <div className='min-w-0 overflow-x-auto'>
            <DataTable
              columns={columns}
              data={[...members.data.items]}
              pageSize={20}
              showSelectedCount={false}
              pagination={false}
              getRowId={(row) => row.id}
            />
          </div>
        ) : (
          <PmListSkeleton rows={4} />
        )}
        {members.data?.items.length === 0 && (search || status !== 'all') ? (
          <Button variant='outline' onClick={() => setParams({})}>
            {t('userManagement.clearFilters')}
          </Button>
        ) : null}
        {options.isError ? (
          <Alert variant='destructive'>
            <AlertDescription>{t('common.requestFailed')}</AlertDescription>
          </Alert>
        ) : null}
        {members.data?.systemAdministratorCount ? (
          <p className='text-sm text-muted-foreground'>
            {t('userManagement.systemAdministrators', {
              count: members.data.systemAdministratorCount,
            })}
          </p>
        ) : null}
        <div className='flex flex-wrap items-center justify-end gap-2'>
          <span className='text-sm text-muted-foreground'>
            {t('userManagement.total', { count: members.data?.total ?? 0 })}
          </span>
          <Button
            variant='outline'
            disabled={page === 1 || members.isFetching}
            onClick={() => setPage(page - 1)}
          >
            {t('userManagement.previous')}
          </Button>
          <span>{page}</span>
          <Button
            variant='outline'
            disabled={
              !members.data ||
              page * 20 >= members.data.total ||
              members.isFetching
            }
            onClick={() => setPage(page + 1)}
          >
            {t('userManagement.next')}
          </Button>
        </div>
      </section>
      <ProjectInvitations />
    </div>
  );
}

function ProjectInvitations(): ReactElement {
  const { t } = useTranslation(),
    viewer = useViewer(),
    pm = usePmApi();
  const [inviting, setInviting] = useState(false);
  const projects = useQuery({
    queryKey: pmKeys.projects,
    queryFn: () => pm.projects(),
  });
  const inviteAll = canUseSetting(viewer, 'pm.members', 'invite');
  const invitable = (projects.data ?? []).filter(
    (project) => inviteAll || canManageProject(viewer, project),
  );
  if (!inviteAll && !invitable.length) return <></>;
  return (
    <section className='flex flex-col gap-4'>
      <Button className='self-start' onClick={() => setInviting(true)}>
        <UserPlusIcon />
        {t('invitations.invite')}
      </Button>
      <InvitationsSection />
      <InviteDialog
        open={inviting}
        projects={invitable.map((project) => ({
          id: project.id,
          name: project.name,
        }))}
        requireProject={!inviteAll}
        onClose={() => setInviting(false)}
      />
    </section>
  );
}
