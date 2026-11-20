import { useSettingsData, useRolePermission } from './hooks.js';
import { useTranslation } from '@nocobase/i18n/client';
import type {
  PermissionSet,
  LocalizedText,
} from '@nocobase/app-plugin-authorization/client';
import { resolveListState } from '@nocobase/app-client';
import { useState, type ReactElement } from 'react';
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  matchPath,
  useLocation,
  useNavigate,
  useResolvedPath,
} from 'react-router';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { cn } from 'cn';
import { PermissionManagementPage } from './permission-management-page.js';
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
  const context: RolesOutletContext = { reload: request.reload, base };
  const create = canCreate ? (
    <Button
      nativeButton={false}
      render={<Link to={{ pathname: `${base}/create` }} />}
    >
      <PlusIcon />
      {t('settings.newRole')}
    </Button>
  ) : null;
  return (
    <PermissionManagementPage tab='roles' actions={create ?? undefined}>
      <div className='grid min-w-0 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]'>
        {/* On a phone the roles are a select above the editor, so the permissions stay in view. */}
        <div className='lg:hidden'>
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
            <SelectTrigger aria-label={t('settings.roles')} className='w-full'>
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
        <aside
          aria-label={t('settings.roles')}
          className='hidden min-w-0 flex-col gap-2 lg:sticky lg:top-4 lg:flex lg:self-start'
        >
          <InputGroup>
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
          <ListFeedbackActions
            state={listState}
            onClear={() => setSearch('')}
            onRetry={request.reload}
            busy={request.loading}
          />
          <ListFeedback state={listState}>
            <nav className='flex max-h-[60svh] flex-col gap-0.5 overflow-y-auto lg:max-h-[calc(100svh-14rem)]'>
              {rows.map((role) => (
                <NavLink
                  key={role.key}
                  to={{
                    pathname: `${base}/${encodeURIComponent(role.key)}/edit`,
                  }}
                  aria-current={selected === role.key ? 'page' : undefined}
                  className={cn(
                    'flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                    selected === role.key && 'bg-accent font-medium',
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
                    <Badge variant='outline'>{t('settings.protected')}</Badge>
                  ) : null}
                </NavLink>
              ))}
            </nav>
          </ListFeedback>
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
    </PermissionManagementPage>
  );
}
