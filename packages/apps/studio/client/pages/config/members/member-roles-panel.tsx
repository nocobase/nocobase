import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { KeyRoundIcon, MoreHorizontalIcon, UserPlusIcon } from 'lucide-react';
import { type ReactElement, useMemo, useState } from 'react';
import {
  canManageProject,
  canUseSetting,
  DataTable,
  InvitationsSection,
  InviteDialog,
  PmListSkeleton,
  PmLoadError,
  PmMultiSelect,
  PmTag,
  pmKeys,
  SettingsPageHeader,
  usePmApi,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useCan } from '@nocobase/app-plugin-authorization/client';

import type { MemberWithRoles, Role } from '../../../../shared/access.js';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router';
import { studioKeys, useStudioApi } from '../../../access/api.js';
import { useNotify } from '../../../access/notify.js';
import { nextRoles, roleOptions, roleTitle, sameRoles } from './roles-model.js';
import { useRoleError } from './use-role-error.js';

export function MemberActions({
  member,
  viewerId,
}: {
  readonly member: MemberWithRoles;
  readonly viewerId?: string;
}): ReactElement | null {
  const { t } = useTranslation();
  const access = useCan({
    resource: { type: 'user', id: member.userId },
    action: 'reset-password',
  });
  if (!access.can || member.userId === viewerId) return null;
  return (
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
        <DropdownMenuItem
          render={
            <Link to={`${member.userId}/reset-password`} relative='path' />
          }
        >
          <KeyRoundIcon />
          {t('members.resetPassword')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MemberRolesCell({
  member,
  roles,
  viewerId,
  canAssign,
  busy,
  onChange,
}: {
  readonly member: MemberWithRoles;
  readonly roles: readonly Role[];
  readonly viewerId: string | undefined;
  readonly canAssign: boolean;
  readonly busy: boolean;
  readonly onChange: (roles: string[]) => void;
}): ReactElement {
  const { t } = useTranslation();
  const held = member.roles;
  const byKey = new Map(roles.map((role) => [role.key, role]));
  if (!canAssign) {
    return held.length === 0 ? (
      <span className='text-muted-foreground'>
        —<span className='sr-only'>{t('roles.none')}</span>
      </span>
    ) : (
      <div className='flex flex-wrap gap-1'>
        {held.map((key) => (
          <PmTag key={key} tone='grey'>
            {roleTitle(t, byKey.get(key)!)}
          </PmTag>
        ))}
      </div>
    );
  }
  const options = roleOptions(roles, member.userId, viewerId).map((option) => ({
    ...option,
    label: roleTitle(t, byKey.get(option.value)!),
  }));
  return (
    <div className='w-72'>
      <PmMultiSelect
        aria-label={t('roles.rolesFor', { name: member.name })}
        options={options}
        value={held}
        disabled={busy}
        placeholder={t('roles.pick')}
        onChange={(requested) => {
          const next = nextRoles(roles, member.userId, viewerId, requested);
          if (!sameRoles(next, held)) onChange(next);
        }}
      />
    </div>
  );
}

/**
 * The members tab: every member but the system administrators (the server leaves them out) with their roles, changed
 * in place by whoever holds `pm.members/assign`. Only roles without platform grants are offered and only an owner adds or removes the owner role
 * (`roles-model.ts`); the server checks the same. Accounts themselves (creating, disabling) stay in user management;
 * newcomers arrive by invitation.
 */
export function MemberRolesPanel(): ReactElement {
  const { t } = useTranslation();
  const api = useStudioApi();
  const notify = useNotify();
  const roleError = useRoleError();
  const queryClient = useQueryClient();
  const viewer = useViewer();
  const members = useQuery({
    queryKey: studioKeys.members,
    queryFn: () => api.members(),
  });
  const roles = useQuery({
    queryKey: studioKeys.roles,
    queryFn: () => api.roles(),
  });
  const pm = usePmApi();
  const projects = useQuery({
    queryKey: pmKeys.projects,
    queryFn: () => pm.projects(),
  });
  const [inviting, setInviting] = useState(false);
  const canAssign = canUseSetting(viewer, 'pm.members', 'assign');
  const inviteAll = canUseSetting(viewer, 'pm.members', 'invite');

  const change = useMutation({
    mutationFn: ({
      member,
      next,
    }: {
      member: MemberWithRoles;
      next: string[];
    }) => api.replaceMemberRoles(member.userId, next),
    onSuccess: (_, { member }) =>
      notify.success(t('roles.assigned', { name: member.name })),
    onError: roleError,
    // Members and roles share `studio/access`, so this refreshes the holders too.
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: ['studio', 'access'] }),
  });

  const roleRows = roles.data;
  const columns = useMemo<ColumnDef<MemberWithRoles, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('members.columns.name'),
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <span className='font-medium'>{row.original.name}</span>
            {row.original.userId === viewer?.userId ? (
              <span className='text-xs text-muted-foreground'>
                {t('properties.you')}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: t('members.columns.email'),
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.email ?? '—'}
          </span>
        ),
      },
      {
        id: 'roles',
        header: t('members.columns.roles'),
        meta: { className: 'w-76' },
        cell: ({ row }) => (
          <MemberRolesCell
            member={row.original}
            roles={roleRows ?? []}
            viewerId={viewer?.userId}
            canAssign={canAssign}
            busy={change.isPending}
            onChange={(next) => change.mutate({ member: row.original, next })}
          />
        ),
      },
      {
        id: 'actions',
        meta: { className: 'w-12' },
        cell: ({ row }) => (
          <MemberActions member={row.original} viewerId={viewer?.userId} />
        ),
      },
    ],
    [t, viewer, roleRows, change, canAssign],
  );

  const invitable = (projects.data ?? []).filter(
    (project) => inviteAll || canManageProject(viewer, project),
  );
  const canInvite = inviteAll || invitable.length > 0;
  const failed = members.isError ? members : roles.isError ? roles : null;

  let content: ReactElement;
  if (failed && !(members.data && roleRows)) {
    content = (
      <PmLoadError
        title={t('members.loadFailed')}
        error={failed.error}
        onRetry={() => void failed.refetch()}
      />
    );
  } else if (!members.data || !roleRows) {
    content = <PmListSkeleton rows={4} />;
  } else {
    content = (
      <DataTable
        columns={columns}
        data={members.data}
        pageSize={50}
        showSelectedCount={false}
        getRowId={(member) => member.userId}
      />
    );
  }

  return (
    <div className='space-y-6'>
      <section
        className='space-y-4'
        aria-labelledby='pm-config-members-heading'
      >
        <SettingsPageHeader
          id='pm-config-members-heading'
          title={t('members.title')}
          description={t('members.description')}
          readOnly={!canAssign && !canInvite}
          actions={
            canInvite ? (
              <Button onClick={() => setInviting(true)}>
                <UserPlusIcon />
                {t('invitations.invite')}
              </Button>
            ) : null
          }
        />
        {content}
      </section>
      {canInvite ? <InvitationsSection /> : null}
      <InviteDialog
        open={inviting}
        projects={invitable.map((project) => ({
          id: project.id,
          name: project.name,
        }))}
        requireProject={!inviteAll}
        onClose={() => setInviting(false)}
      />
    </div>
  );
}
