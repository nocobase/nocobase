import { useSettingsData, useRolePermission } from './hooks.js';
import { useTranslation } from '@nocobase/i18n/client';
import type { PermissionSet, LocalizedText } from '../authorization-client.js';
import { resolveListState } from '@nocobase/app-client';
import { useState, type ReactElement } from 'react';
import {
  Navigate,
  NavLink,
  Outlet,
  matchPath,
  useLocation,
  useNavigate,
  useResolvedPath,
} from 'react-router';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { RowActions } from '#components/row-actions';
import { announceDataChange } from '../hooks/use-data-changes.js';
import { RoleDialog, type RoleAction } from './role-dialog.js';
import { cn } from 'cn';
import { AuthorizationPage } from './authorization-page.js';
import { ROLES_TAB } from './tab-keys.js';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { ListFeedback, ListFeedbackActions } from '#components/list-feedback';
import type { RolesOutletContext } from './role-form.js';

/**
 * Roles and permissions: the roles on the left, the selected role's permissions on the right. The role editor is the
 * child route, so a role has its own URL and switching roles asks first when the editor has unsaved changes.
 */
export default function RolesPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const base = useResolvedPath('.').pathname.replace(/\/$/, '');
  // Kept out of the URL: changing the URL would ask to discard the editor's unsaved changes.
  const [search, setSearch] = useState('');
  const request = useSettingsData<{ data: readonly PermissionSet[] }>(
    'authorization/permissionSets',
    true,
  );
  const canCreate = useRolePermission('create');
  const text = (value: LocalizedText): string =>
    typeof value === 'string'
      ? value
      : t(value.key, {
          ns: value.ns,
          defaultValue: value.defaultValue ?? value.key,
        });
  const roles = [...(request.data?.data ?? [])].sort(
    (a, b) =>
      Number(Boolean(b.unrestricted)) - Number(Boolean(a.unrestricted)) ||
      text(a.title ?? a.key).localeCompare(
        text(b.title ?? b.key),
        i18n.language,
      ),
  );
  const query = search.trim().toLocaleLowerCase();
  const rows = roles.filter(
    (role) =>
      !query ||
      text(role.title ?? role.key)
        .toLocaleLowerCase()
        .includes(query) ||
      role.key.toLocaleLowerCase().includes(query),
  );
  const listState = resolveListState(
    {
      data: request.data,
      error: request.error,
      isPending: request.loading && !request.data,
    },
    rows.length,
    Boolean(query),
  );
  const selected =
    matchPath(`${base}/:key/edit`, location.pathname)?.params.key ?? undefined;
  // Only the bare list opens the first role; any child route, such as New role, keeps its own content.
  const atList = Boolean(matchPath(base || '/', location.pathname));
  const first = roles[0];
  const canUpdate = useRolePermission('update');
  const canDelete = useRolePermission('delete');
  const [action, setAction] = useState<RoleAction>();
  const [editorLocked, setEditorLocked] = useState(false);
  const context: RolesOutletContext = {
    reload: request.reload,
    base,
    setEditorLocked,
  };
  function rowActions(role: PermissionSet) {
    const locked = role.key === selected && editorLocked;
    return (
      <RowActions
        label={t('settings.actionsFor', { name: text(role.title ?? role.key) })}
        actions={[
          canUpdate &&
            !role.unrestricted &&
            (!role.protection || role.protection.allow.includes('update')) && {
              key: 'edit',
              label: t('settings.editRole'),
              disabled: locked,
              onClick: () => setAction({ kind: 'edit', role }),
            },
          canCreate &&
            !role.unrestricted && {
              key: 'copy',
              label: t('settings.duplicateRole'),
              onClick: () => setAction({ kind: 'copy', role }),
            },
          canDelete &&
            !role.unrestricted &&
            (!role.protection || role.protection.allow.includes('delete')) && {
              key: 'delete',
              label: t('settings.deleteRole'),
              disabled: locked,
              destructive: true,
              onClick: () => setAction({ kind: 'delete', role }),
            },
        ]}
      />
    );
  }
  const current = roles.find((role) => role.key === selected);
  async function saved(result: PermissionSet | null) {
    setAction(undefined);
    request.reload();
    if (action?.kind === 'edit' && result) {
      const path = `authorization/permissionSets/${encodeURIComponent(result.key)}`;
      announceDataChange({
        scopes: [path],
        results: { [path]: { data: result } },
      });
    } else if (result) {
      setSearch('');
      await navigate(`${base}/${encodeURIComponent(result.key)}/edit`);
    } else if (action?.kind === 'delete' && selected === action.role.key) {
      request.replaceData({
        data: roles.filter((role) => role.key !== selected),
      });
      await navigate(base, { replace: true });
    }
  }
  return (
    <AuthorizationPage
      tab={ROLES_TAB}
      description={t('settings.rolesDescription')}
    >
      <div className='grid min-w-0 rounded-lg border bg-card text-card-foreground lg:grid-cols-[16rem_minmax(0,1fr)]'>
        {/* On a phone the roles are a select above the editor, so the permissions stay in view. */}
        <aside
          aria-label={t('settings.roles')}
          className='flex min-w-0 flex-col gap-2 border-b p-3 lg:border-r lg:border-b-0'
        >
          <div className='flex min-w-0 items-center gap-2'>
            <div className='min-w-0 flex-1 lg:hidden'>
              <Select
                items={roles.map((role) => ({
                  value: role.key,
                  label: text(role.title ?? role.key),
                }))}
                value={selected ?? null}
                onValueChange={(value) => {
                  if (value)
                    void navigate({
                      pathname: `${base}/${encodeURIComponent(String(value))}/edit`,
                    });
                }}
              >
                <SelectTrigger
                  aria-label={t('settings.roles')}
                  className='w-full'
                >
                  <SelectValue placeholder={t('settings.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.key} value={role.key}>
                      {text(role.title ?? role.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <InputGroup className='hidden min-w-0 flex-1 lg:flex'>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                placeholder={t('settings.roleSearch')}
                aria-label={t('settings.roleSearch')}
                onChange={(event) => setSearch(event.target.value)}
              />
            </InputGroup>
            {canCreate && (
              <Button
                size='icon-sm'
                aria-label={t('settings.newRole')}
                title={t('settings.newRole')}
                onClick={() => setAction({ kind: 'create' })}
              >
                <PlusIcon />
              </Button>
            )}
            {current && <div className='lg:hidden'>{rowActions(current)}</div>}
          </div>
          <div className='hidden lg:block'>
            <ListFeedbackActions
              state={listState}
              onClear={() => setSearch('')}
              onRetry={request.reload}
              busy={request.loading}
            />
            <ListFeedback state={listState}>
              <nav className='flex max-h-[60svh] flex-col gap-0.5 overflow-y-auto lg:max-h-[calc(100svh-14rem)]'>
                {rows.map((role) => (
                  <div
                    key={role.key}
                    className={cn(
                      'flex items-center gap-1 rounded-md pr-1 hover:bg-accent has-focus-visible:bg-accent has-aria-expanded:bg-accent',
                      selected === role.key && 'bg-accent',
                    )}
                  >
                    <NavLink
                      to={{
                        pathname: `${base}/${encodeURIComponent(role.key)}/edit`,
                      }}
                      aria-current={selected === role.key ? 'page' : undefined}
                      className={cn(
                        'flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        selected === role.key && 'font-medium',
                      )}
                    >
                      <span className='min-w-0 flex-1'>
                        <span
                          className='block truncate'
                          title={text(role.title ?? role.key)}
                        >
                          {text(role.title ?? role.key)}
                        </span>
                        <span
                          className='block truncate font-mono text-xs text-muted-foreground'
                          title={role.key}
                        >
                          {role.key}
                        </span>
                      </span>
                      {role.unrestricted ? (
                        <Badge variant='secondary'>
                          {t('settings.unrestrictedRole')}
                        </Badge>
                      ) : role.protection ? (
                        <Badge variant='outline'>
                          {t('settings.protected')}
                        </Badge>
                      ) : null}
                    </NavLink>
                    {rowActions(role)}
                  </div>
                ))}
              </nav>
            </ListFeedback>
          </div>
        </aside>
        <section className='min-w-0'>
          {atList && first ? (
            <Navigate
              replace
              to={{ pathname: `${base}/${encodeURIComponent(first.key)}/edit` }}
            />
          ) : null}
          <Outlet context={context} />
        </section>
      </div>
      {action && (
        <RoleDialog
          action={action}
          onClose={() => setAction(undefined)}
          onSaved={saved}
        />
      )}
    </AuthorizationPage>
  );
}
