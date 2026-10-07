import { Link } from 'react-router';
import { Spinner } from '../components/ui/spinner.js';
import { useClientApplication } from '@nocobase/app-client';
import { PermissionSelection } from '../components/permission-selection.js';
import { PermissionAssignmentDrawer } from '../components/permission-assignment-drawer.js';
import { InviteDialog, InviteResults } from '../components/invite-dialog.js';
import { InvitationsPanel } from '../components/invitations-panel.js';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import {
  useApiClient,
  ApiClientError,
  useService,
  useToaster,
} from '@nocobase/app-client';
import { authorizationClientToken } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ChevronDown,
  KeyRound,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  UserRoundCheck,
  UserRoundX,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';

import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import {
  emptyUserCapabilities,
  loadUserCapabilities,
  type UserCapabilities,
} from '../user-permissions.js';
import {
  createRoleFilterOptions,
  createStatusFilterOptions,
} from '../filter-options.js';
import {
  UsersClient,
  type CreateUserInput,
  type ManagedUser,
  type ManagedUserPage,
  type UpdateUserInput,
  type UserInvitation,
  type UserInvitationResult,
  type UserRoleScopeOption,
  type UserRoleValue,
  type UsersOptions,
} from '../user-client.js';
import {
  assignableRoleScopes,
  emptyRoleScopeValues,
  hasEveryRequiredRoleScope,
  localizeRoleScopes,
  selectedRoleScopeValues,
} from '../role-scopes.js';

const EMPTY_PAGE: ManagedUserPage = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
};

export default function UsersPage(): ReactElement {
  const { session } = useAuthentication();
  const { t } = useTranslation('@nocobase/app-plugin-users');
  const toaster = useToaster();
  const api = useApiClient();
  const authorization = useService(authorizationClientToken);
  const users = useMemo(() => new UsersClient(api), [api]);
  const app = useClientApplication();
  const inspector = app.runtime.settings.find(
    (route) =>
      route.id === '@nocobase/app-plugin-authorization:inspector' &&
      route.packageName === '@nocobase/app-plugin-authorization',
  );
  const [canInspect, setCanInspect] = useState(false);
  const [options, setOptions] = useState<UsersOptions>({ roleScopes: [] });
  const [result, setResult] = useState<ManagedUserPage>(EMPTY_PAGE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleteUser, setDeleteUser] = useState<ManagedUser>();
  const reportError = useCallback(
    (reason: unknown) => {
      const code = reason instanceof ApiClientError ? reason.reason : undefined;
      toaster.show({
        type: 'error',
        // Branch on the reason only; the server's message is for developers and never shown.
        title: t(`errors.${code ?? 'operationFailed'}`, {
          defaultValue: t('errors.operationFailed'),
        }),
      });
    },
    [toaster, t],
  );
  const [editor, setEditor] = useState<ManagedUser | 'create'>();
  const [inviting, setInviting] = useState(false);
  const [invitations, setInvitations] = useState<readonly UserInvitation[]>([]);
  const [resent, setResent] = useState<UserInvitationResult>();
  const [assignment, setAssignment] = useState<{
    user: ManagedUser;
    scope: UserRoleScopeOption;
  }>();
  const [passwordUser, setPasswordUser] = useState<ManagedUser>();
  const [stateUser, setStateUser] = useState<ManagedUser>();
  const [globalCapabilities, setGlobalCapabilities] =
    useState<UserCapabilities>(emptyUserCapabilities);
  const [userCapabilities, setUserCapabilities] = useState<
    Readonly<Record<string, UserCapabilities>>
  >({});

  const localizedOptions: UsersOptions = {
    roleScopes: localizeRoleScopes(
      options.roleScopes,
      (key, namespace, defaultValue) =>
        t(key, { ...(namespace ? { ns: namespace } : {}), defaultValue }),
    ),
  };
  const roleChoices = localizedOptions.roleScopes.flatMap((scope) =>
    scope.options.map((option) => ({ scope, option })),
  );
  const statusOptions = createStatusFilterOptions({
    all: t('page.allStatuses'),
    enabled: t('page.enabled'),
    disabled: t('page.disabled'),
  });
  const roleFilterOptions = createRoleFilterOptions(
    localizedOptions.roleScopes,
    t('page.allRoles'),
  );
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextOptions, nextPage, nextGlobalCapabilities, inspectAllowed] =
        await Promise.all([
          users.options(),
          users.list({
            page,
            pageSize: 20,
            ...(search.trim() ? { q: search.trim() } : {}),
            ...(status === 'all' ? {} : { status }),
            ...(role === 'all'
              ? {}
              : {
                  roleScope: role.slice(0, role.indexOf(':')),
                  role: role.slice(role.indexOf(':') + 1),
                }),
          }),
          loadUserCapabilities(authorization, '*'),
          authorization.can({
            resource: { type: 'settings', id: 'authorization.inspector' },
            action: 'inspect',
          }),
        ]);
      const capabilityEntries: readonly (readonly [
        string,
        UserCapabilities,
      ])[] = await Promise.all(
        nextPage.items.map(
          async (user): Promise<readonly [string, UserCapabilities]> => [
            user.id,
            await loadUserCapabilities(authorization, user.id),
          ],
        ),
      );
      const nextUserCapabilities: Readonly<Record<string, UserCapabilities>> =
        Object.fromEntries(capabilityEntries);
      setInvitations(
        nextGlobalCapabilities.invite ? await users.listInvitations() : [],
      );
      setCanInspect(inspectAllowed);
      setOptions(nextOptions);
      setResult(nextPage);
      setGlobalCapabilities(nextGlobalCapabilities);
      setUserCapabilities(nextUserCapabilities);
    } catch (reason) {
      reportError(reason);
    } finally {
      setLoading(false);
    }
  }, [authorization, page, role, search, status, users, reportError]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(
    () => authorization.onInvalidated(() => void load()),
    [authorization, load],
  );

  const perform = async (work: () => Promise<unknown>): Promise<void> => {
    setBusy(true);
    try {
      await work();
      await load();
    } catch (reason) {
      if (reason instanceof ApiClientError && reason.status === 403) {
        authorization.invalidate();
      }
      reportError(reason);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('page.title')}
        description={t('page.description')}
        actions={
          <>
            {globalCapabilities.invite ? (
              <Button variant='outline' onClick={() => setInviting(true)}>
                <Mail /> {t('invite.open')}
              </Button>
            ) : null}
            {globalCapabilities.create && globalCapabilities['assign-role'] ? (
              <Button onClick={() => setEditor('create')}>
                <Plus /> {t('page.add')}
              </Button>
            ) : null}
          </>
        }
      />

      <div className='flex flex-wrap gap-3'>
        <label className='flex h-9 min-w-64 flex-1 items-center gap-2 rounded-lg border bg-transparent px-3'>
          <Search className='size-4 text-muted-foreground' />
          <Input
            className='h-auto border-0 p-0 focus-visible:ring-0'
            placeholder={t('page.search')}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <Select
          items={statusOptions}
          value={status}
          onValueChange={(value) => {
            setStatus(value as typeof status);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-36'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            <SelectItem value='all'>{t('page.allStatuses')}</SelectItem>
            <SelectItem value='enabled'>{t('page.enabled')}</SelectItem>
            <SelectItem value='disabled'>{t('page.disabled')}</SelectItem>
          </SelectContent>
        </Select>
        {roleChoices.length ? (
          <Select
            items={roleFilterOptions}
            value={role}
            onValueChange={(value) => {
              setRole(String(value));
              setPage(1);
            }}
          >
            <SelectTrigger className='w-56'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectItem value='all'>{t('page.allRoles')}</SelectItem>
              {roleChoices.map(({ scope, option }) => (
                <SelectItem
                  key={`${scope.key}:${option.value}`}
                  value={`${scope.key}:${option.value}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {localizedOptions.roleScopes.some(
        (scope) => scope.hasAuthenticatedDefaultAccess,
      ) ? (
        <p className='text-sm text-muted-foreground'>
          {t('page.authenticatedDefaultAccess')}
        </p>
      ) : null}

      <div className='overflow-hidden rounded-xl border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('page.columns.user')}</TableHead>
              <TableHead>{t('page.columns.status')}</TableHead>
              {localizedOptions.roleScopes.map((scope) => (
                <TableHead key={scope.key}>{scope.label}</TableHead>
              ))}
              <TableHead className='w-14'>
                <span className='sr-only'>{t('page.columns.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={3 + localizedOptions.roleScopes.length}
                  className='h-32 text-center text-muted-foreground'
                >
                  <Spinner
                    className='mx-auto size-5'
                    aria-label={t('page.loading')}
                  />
                </TableCell>
              </TableRow>
            ) : result.items.length ? (
              result.items.map((user) => {
                const capabilities =
                  userCapabilities[user.id] ?? emptyUserCapabilities();
                const canChangeState = user.disabledAt
                  ? capabilities.enable
                  : capabilities.disable;
                const canDelete =
                  capabilities.delete && user.id !== session?.user.id;
                const hasActions =
                  (canInspect && !!inspector) ||
                  capabilities.update ||
                  capabilities['reset-password'] ||
                  capabilities['revoke-sessions'] ||
                  canDelete ||
                  canChangeState;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className='font-medium'>{user.name}</div>
                      <div className='text-xs text-muted-foreground'>
                        {user.username ? `@${user.username} · ` : ''}
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.disabledAt ? 'secondary' : 'default'}
                      >
                        {user.disabledAt
                          ? t('page.disabled')
                          : t('page.enabled')}
                      </Badge>
                    </TableCell>
                    {localizedOptions.roleScopes.map((scope) => (
                      <TableCell key={scope.key}>
                        {capabilities['assign-role'] &&
                        scope.options.some((option) =>
                          roleOptionCanToggle(
                            option,
                            roleValues(user.roleScopes[scope.key] ?? ''),
                          ),
                        ) ? (
                          <Button
                            variant='ghost'
                            className='h-auto max-w-72 justify-start px-2 py-1.5 text-left font-normal'
                            disabled={busy}
                            aria-label={`${t('assignment.title')} · ${user.name} · ${scope.label}`}
                            onClick={() => setAssignment({ user, scope })}
                          >
                            <RoleValue
                              scope={scope}
                              value={user.roleScopes[scope.key] ?? ''}
                            />
                            <ChevronDown className='size-4 shrink-0 text-muted-foreground' />
                          </Button>
                        ) : (
                          <RoleValue
                            scope={scope}
                            value={user.roleScopes[scope.key] ?? ''}
                          />
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      {hasActions ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant='ghost'
                                size='icon-sm'
                                aria-label={t('page.actions.menuFor', {
                                  name: user.name,
                                })}
                              />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            className='w-auto min-w-40'
                          >
                            {canInspect && inspector && (
                              <DropdownMenuItem
                                render={
                                  <Link
                                    to={`${inspector.path}?subjectType=user&subjectId=${encodeURIComponent(user.id)}`}
                                  />
                                }
                              >
                                {t('assignment.inspect')}
                              </DropdownMenuItem>
                            )}

                            {capabilities.update ? (
                              <DropdownMenuItem onClick={() => setEditor(user)}>
                                {t('page.actions.edit')}
                              </DropdownMenuItem>
                            ) : null}
                            {capabilities['reset-password'] ? (
                              <DropdownMenuItem
                                onClick={() => setPasswordUser(user)}
                              >
                                {t('page.actions.resetPassword')}
                              </DropdownMenuItem>
                            ) : null}
                            {capabilities['revoke-sessions'] ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  void perform(() =>
                                    users.revokeSessions(user.id),
                                  )
                                }
                              >
                                {t('page.actions.revokeSessions')}
                              </DropdownMenuItem>
                            ) : null}
                            {canChangeState ? (
                              <DropdownMenuItem
                                onClick={() => setStateUser(user)}
                              >
                                {user.disabledAt
                                  ? t('page.actions.enable')
                                  : t('page.actions.disable')}
                              </DropdownMenuItem>
                            ) : null}
                            {canDelete ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant='destructive'
                                  onClick={() => setDeleteUser(user)}
                                >
                                  {t('page.actions.delete')}
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3 + localizedOptions.roleScopes.length}
                  className='h-32 text-center text-muted-foreground'
                >
                  {t('page.noUsers')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between text-sm text-muted-foreground'>
        <span>{t('page.total', { count: result.total })}</span>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => value - 1)}
          >
            {t('page.previous')}
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={page * result.pageSize >= result.total || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            {t('page.next')}
          </Button>
        </div>
      </div>

      {assignment && userCapabilities[assignment.user.id]?.['assign-role'] ? (
        <PermissionAssignmentDrawer
          user={assignment.user}
          scope={
            localizedOptions.roleScopes.find(
              (scope) => scope.key === assignment.scope.key,
            ) ?? assignment.scope
          }
          onClose={() => setAssignment(undefined)}
          onSave={async (value) => {
            await users.replaceRoleScope(
              assignment.user.id,
              assignment.scope.key,
              value,
            );
            setAssignment(undefined);
            await load();
          }}
        />
      ) : null}
      {editor &&
      (editor === 'create'
        ? globalCapabilities.create && globalCapabilities['assign-role']
        : userCapabilities[editor.id]?.update) ? (
        <UserDialog
          busy={busy}
          options={localizedOptions}
          user={editor === 'create' ? undefined : editor}
          onClose={() => setEditor(undefined)}
          onSubmit={(input) =>
            void perform(async () => {
              if (input.kind === 'create') await users.create(input.value);
              else if (editor !== 'create') {
                await users.update(editor.id, input.value);
              }
              setEditor(undefined);
            })
          }
        />
      ) : null}
      {globalCapabilities.invite ? (
        <InvitationsPanel
          invitations={invitations}
          busy={busy}
          onResend={(invitation) =>
            void perform(async () => {
              const result = await users.resendInvitation(invitation.id);
              if (result.outcome === 'invited' && result.inviteUrl)
                setResent(result);
              else
                toaster.show({
                  type: 'success',
                  title: t('invitations.resent'),
                });
            })
          }
          onRevoke={(invitation) =>
            void perform(async () => {
              await users.revokeInvitation(invitation.id);
              toaster.show({
                type: 'success',
                title: t('invitations.revoked'),
              });
            })
          }
        />
      ) : null}
      {inviting && globalCapabilities.invite ? (
        <InviteDialog
          roleScopes={
            globalCapabilities['assign-role']
              ? assignableRoleScopes(localizedOptions.roleScopes)
              : []
          }
          onInvite={async (input) => {
            try {
              const results = await users.invite(input);
              await load();
              return results;
            } catch (reason) {
              reportError(reason);
              throw reason;
            }
          }}
          onClose={() => setInviting(false)}
        />
      ) : null}
      {resent ? (
        <Dialog
          open
          onOpenChange={(open) => (!open ? setResent(undefined) : undefined)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('invitations.resend')}</DialogTitle>
            </DialogHeader>
            <InviteResults results={[resent]} />
            <DialogFooter>
              <Button onClick={() => setResent(undefined)}>
                {t('invite.done')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
      {deleteUser && userCapabilities[deleteUser.id]?.delete ? (
        <ConfirmDeleteDialog
          user={deleteUser}
          busy={busy}
          onClose={() => setDeleteUser(undefined)}
          onConfirm={() =>
            void perform(async () => {
              await users.remove(deleteUser.id);
              setDeleteUser(undefined);
              if (result.items.length === 1 && page > 1) setPage(page - 1);
              toaster.show({ type: 'success', title: t('deletion.success') });
            })
          }
        />
      ) : null}
      {passwordUser && userCapabilities[passwordUser.id]?.['reset-password'] ? (
        <PasswordDialog
          busy={busy}
          user={passwordUser}
          onClose={() => setPasswordUser(undefined)}
          onSubmit={(password) =>
            void perform(async () => {
              await users.resetPassword(passwordUser.id, password);
              setPasswordUser(undefined);
            })
          }
        />
      ) : null}
      {stateUser &&
      userCapabilities[stateUser.id]?.[
        stateUser.disabledAt ? 'enable' : 'disable'
      ] ? (
        <ConfirmStateDialog
          busy={busy}
          user={stateUser}
          onClose={() => setStateUser(undefined)}
          onConfirm={() =>
            void perform(async () => {
              if (stateUser.disabledAt) await users.enable(stateUser.id);
              else await users.disable(stateUser.id);
              setStateUser(undefined);
            })
          }
        />
      ) : null}
    </PageContainer>
  );
}

function RoleValue({
  scope,
  value,
}: {
  readonly scope: UserRoleScopeOption;
  readonly value: UserRoleValue;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-users');
  const values = roleValues(value);
  if (!values.length) {
    return (
      <span className='text-sm text-muted-foreground'>
        {t('page.noDirectRoles')}
      </span>
    );
  }
  return (
    <div className='flex min-w-0 flex-wrap items-center gap-1.5'>
      {values.slice(0, 2).map((entry) => {
        const option = scope.options.find((item) => item.value === entry);
        return (
          <Badge
            key={entry}
            variant='secondary'
            className='max-w-48'
            title={option?.label ?? entry}
          >
            <span className='truncate'>{option?.label ?? entry}</span>
            {option?.removable === false ? (
              <LockKeyhole
                aria-label={t('page.protectedRole')}
                className='ml-1 size-3'
              />
            ) : null}
          </Badge>
        );
      })}
      {values.length > 2 && (
        <span className='text-xs text-muted-foreground'>
          +{values.length - 2}
        </span>
      )}
    </div>
  );
}

function roleOptionCanToggle(
  option: UserRoleScopeOption['options'][number],
  selected: readonly string[],
): boolean {
  return selected.includes(option.value)
    ? option.removable !== false
    : option.assignable !== false;
}

function UserDialog({
  busy,
  options,
  user,
  onClose,
  onSubmit,
}: {
  readonly busy: boolean;
  readonly options: UsersOptions;
  readonly user?: ManagedUser;
  readonly onClose: () => void;
  readonly onSubmit: (input: UserDialogSubmitInput) => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-users');
  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const creationRoleScopes = assignableRoleScopes(options.roleScopes);
  const [roles, setRoles] = useState<Record<string, UserRoleValue>>(() =>
    emptyRoleScopeValues(creationRoleScopes),
  );
  const requiredRolesSelected = hasEveryRequiredRoleScope(
    creationRoleScopes,
    roles,
  );
  const submit = (event: FormEvent): void => {
    event.preventDefault();
    onSubmit(
      user
        ? {
            kind: 'update',
            value: { name, username: username.trim() ? username : null, email },
          }
        : {
            kind: 'create',
            value: {
              name,
              ...(username.trim() ? { username } : {}),
              email,
              password,
              roleScopes: selectedRoleScopeValues(creationRoleScopes, roles),
            },
          },
    );
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => (!open && !busy ? onClose() : undefined)}
    >
      <DialogContent className={user ? undefined : 'sm:max-w-2xl'}>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>
              {user ? t('form.editTitle') : t('form.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {user ? t('form.editDescription') : t('form.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <Field label={t('form.name')}>
            <Input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label={t('form.username')}>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </Field>
          <Field label={t('form.email')}>
            <Input
              required
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          {!user ? (
            <>
              <Field label={t('form.password')}>
                <Input
                  required
                  type='password'
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              {creationRoleScopes.map((scope) => (
                <Field key={scope.key} label={scope.label}>
                  <div className='flex max-h-80 flex-col overflow-hidden rounded-lg border'>
                    <PermissionSelection
                      disabled={busy}
                      scope={scope}
                      selected={roleValues(roles[scope.key] ?? '')}
                      onChange={(value) =>
                        setRoles((current) => ({
                          ...current,
                          [scope.key]:
                            scope.selection === 'single'
                              ? (value[0] ?? '')
                              : value,
                        }))
                      }
                    />
                  </div>
                </Field>
              ))}
            </>
          ) : null}
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={busy}
              onClick={onClose}
            >
              {t('form.cancel')}
            </Button>
            <Button
              type='submit'
              disabled={busy || (!user && !requiredRolesSelected)}
            >
              {busy ? (
                <Spinner
                  data-icon='inline-start'
                  aria-label={t('page.loading')}
                />
              ) : null}
              {user ? t('form.save') : t('form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type UserDialogSubmitInput =
  | { readonly kind: 'create'; readonly value: CreateUserInput }
  | { readonly kind: 'update'; readonly value: UpdateUserInput };

function PasswordDialog({
  busy,
  user,
  onClose,
  onSubmit,
}: {
  readonly busy: boolean;
  readonly user: ManagedUser;
  readonly onClose: () => void;
  readonly onSubmit: (password: string) => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-users');
  const [password, setPassword] = useState('');
  return (
    <Dialog
      open
      onOpenChange={(open) => (!open && !busy ? onClose() : undefined)}
    >
      <DialogContent>
        <form
          className='space-y-4'
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(password);
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('password.title')}</DialogTitle>
            <DialogDescription>
              {t('password.description', { name: user.name })}
            </DialogDescription>
          </DialogHeader>
          <Field label={t('password.newPassword')}>
            <Input
              required
              type='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={busy}
              onClick={onClose}
            >
              {t('form.cancel')}
            </Button>
            <Button type='submit' disabled={busy}>
              <KeyRound /> {t('password.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmStateDialog({
  busy,
  user,
  onClose,
  onConfirm,
}: {
  readonly busy: boolean;
  readonly user: ManagedUser;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-users');
  const enabling = Boolean(user.disabledAt);
  return (
    <AlertDialog
      open
      onOpenChange={(open) => (!open && !busy ? onClose() : undefined)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {enabling
              ? t('state.enableTitle', { name: user.name })
              : t('state.disableTitle', { name: user.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {enabling
              ? t('state.enableDescription', { name: user.name })
              : t('state.disableDescription', { name: user.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t('form.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            variant={enabling ? 'default' : 'destructive'}
            onClick={onConfirm}
          >
            {busy ? (
              <Spinner
                data-icon='inline-start'
                aria-label={t('page.loading')}
              />
            ) : enabling ? (
              <UserRoundCheck />
            ) : (
              <UserRoundX />
            )}
            {enabling ? t('state.enable') : t('state.disable')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function roleValues(value: UserRoleValue): readonly string[] {
  return typeof value === 'string' ? (value ? [value] : []) : value;
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactElement;
}): ReactElement {
  return (
    <div className='space-y-1.5'>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function ConfirmDeleteDialog({
  user,
  busy,
  onClose,
  onConfirm,
}: {
  readonly user: ManagedUser;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-users');
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('deletion.title', { name: user.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('deletion.description', { name: user.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t('form.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? (
              <Spinner
                data-icon='inline-start'
                aria-label={t('page.loading')}
              />
            ) : null}
            {t('page.actions.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
