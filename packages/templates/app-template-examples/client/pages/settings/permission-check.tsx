import { useClientApplication } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useAuthorizationClient,
  type AuthorizationEffect,
  type AuthorizationOptionsResponse,
  type ConfiguredAccess,
  type LocalizedText,
  type PermissionSet,
  type SubjectOption,
} from '@nocobase/app-plugin-authorization/client';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useSearchParams } from 'react-router';
import { cn } from 'cn';
import { Badge } from '#components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Button } from '#components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '#components/ui/combobox';
import { Label } from '#components/ui/label';
import { useSettingsData } from './hooks.js';
import { PermissionManagementPage } from './permission-management-page.js';
import { pagePermissionTitles } from './page-permission-titles.js';
import { permissionWorkspace } from './permission-workspace.js';
import { SettingsError, SettingsLoading } from './shared.js';

const ALL_ROLES = '__all__';
/** The most checks, subject ids or users one request of the authorization routes takes. */
const BATCH = 100;

function chunks<T>(items: readonly T[]): T[][] {
  const result: T[][] = [];
  for (let offset = 0; offset < items.length; offset += BATCH)
    result.push(items.slice(offset, offset + BATCH));
  return result;
}

const statusOf = (error: unknown): unknown =>
  typeof error === 'object' && error !== null
    ? Reflect.get(error, 'status')
    : undefined;

interface Decisions {
  readonly user: string;
  readonly access?: ConfiguredAccess;
  readonly effects?: ReadonlyMap<string, AuthorizationEffect>;
  readonly error?: unknown;
}

/**
 * Permission check: what one user can open and do, decided by the server from all of their roles and the default,
 * sharing and restriction rules. Preview as this role opens it with the role chosen, listing the users who hold it;
 * the server cannot act as a role without a user.
 */
export default function PermissionCheckPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const app = useClientApplication();
  const authz = useAuthorizationClient();
  const [params, setParams] = useSearchParams();
  const requestedRole = params.get('role') ?? undefined;
  const user = params.get('user') ?? undefined;
  const text = (value: LocalizedText): string =>
    typeof value === 'string'
      ? value
      : t(value.key, {
          ns: value.ns,
          defaultValue: value.defaultValue ?? value.key,
        });
  const options = useSettingsData<{ data: AuthorizationOptionsResponse }>(
    'authorization/inspector/options',
  );
  const roles = useSettingsData<{ data: readonly PermissionSet[] }>(
    'authorization/permissionSets',
  );
  // Inspecting does not require reading roles, but listing a role's members does: without that permission the check,
  // including a preview link naming a role, covers any role only.
  const rolesDenied = statusOf(roles.error) === 403;
  const role = rolesDenied ? undefined : requestedRole;
  // A role's members are only listed once the role list says they can be read.
  const rolePending = Boolean(role) && roles.loading;
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const [chosen, setChosen] = useState<{ value: string; label: string }>();
  const [usersResult, setUsersResult] = useState<{
    readonly key: string;
    readonly items?: readonly SubjectOption[];
    readonly total?: number;
    readonly error?: unknown;
  }>();
  // A role's members are resolved in batches the resolve route accepts and searched here; any role searches the
  // server's user directory, a page at a time. Searching within a role filters the members already listed.
  const directoryQuery = role ? '' : query;
  const usersKey = JSON.stringify([role, directoryQuery]);
  useEffect(() => {
    if (rolePending) return;
    let active = true;
    const load = role
      ? authz.listAssignments(role).then(async (assignments) => {
          const ids = [
            ...new Set(
              assignments
                .filter((item) => item.subject.type === 'user')
                .map((item) => item.subject.id),
            ),
          ];
          const pages = await Promise.all(
            chunks(ids).map((batch) =>
              authz.resolveSubjects('inspector', 'user', batch),
            ),
          );
          const items = pages.flat();
          return { items, total: items.length };
        })
      : authz.listSubjects('inspector', 'user', {
          ...(directoryQuery ? { search: directoryQuery } : {}),
          page: 1,
          pageSize: BATCH,
        });
    load.then(
      ({ items, total }) =>
        active && setUsersResult({ key: usersKey, items, total }),
      (error: unknown) => active && setUsersResult({ key: usersKey, error }),
    );
    return () => {
      active = false;
    };
  }, [authz, role, rolePending, directoryQuery, usersKey]);
  const usersCurrent = usersResult?.key === usersKey ? usersResult : undefined;
  const users = usersCurrent?.items;

  const workspace = useMemo(
    () =>
      options.data
        ? permissionWorkspace(
            options.data.data,
            app.runtime.routes,
            pagePermissionTitles,
            {
              text: (value) =>
                typeof value === 'string'
                  ? value
                  : t(value.key, {
                      ns: value.ns,
                      defaultValue: value.defaultValue ?? value.key,
                    }),
              t: (key, values) => t(key, values),
            },
          )
        : undefined,
    [options.data, app, t],
  );
  const [decisions, setDecisions] = useState<Decisions>();
  useEffect(() => {
    if (!user || !workspace) return;
    let active = true;
    const subject = { type: 'user', id: user };
    const checks = [
      ...[...workspace.bindings.values()].map((binding) => ({
        resource: binding.resource,
        action: binding.action,
      })),
      ...[...workspace.menuPages.values()].flatMap((pages) =>
        pages.map((page) => ({
          resource: { type: 'page', id: page },
          action: 'access',
        })),
      ),
    ];
    const batches: (typeof checks)[] = [];
    for (let offset = 0; offset < checks.length; offset += BATCH)
      batches.push(checks.slice(offset, offset + BATCH));
    Promise.all([
      authz.inspectConfigured(subject),
      Promise.all(batches.map((batch) => authz.inspectBatch(subject, batch))),
    ]).then(
      ([access, results]) => {
        if (!active) return;
        const effects = new Map<string, AuthorizationEffect>();
        for (const result of results.flat())
          effects.set(
            JSON.stringify([
              result.resource.type,
              result.resource.id,
              result.action,
            ]),
            result.decision.effect,
          );
        setDecisions({ user, access, effects });
      },
      (error: unknown) => active && setDecisions({ user, error }),
    );
    return () => {
      active = false;
    };
  }, [authz, user, workspace]);

  const roleItems = [
    { value: ALL_ROLES, label: t('settings.permissionCheck.anyRole') },
    ...[...(roles.data?.data ?? [])]
      .map((item) => ({ value: item.key, label: text(item.title ?? item.key) }))
      .sort((a, b) => a.label.localeCompare(b.label, i18n.language)),
  ];
  const needle = query.toLocaleLowerCase(i18n.language);
  const found = (users ?? [])
    .map((item) => ({ value: item.id, label: text(item.title) }))
    .filter(
      (item) =>
        !role ||
        !needle ||
        item.label.toLocaleLowerCase(i18n.language).includes(needle),
    );
  // The chosen user stays selectable while a search shows others.
  const userItems =
    chosen &&
    chosen.value === user &&
    !found.some((item) => item.value === user)
      ? [chosen, ...found]
      : found;
  const totalUsers = role ? found.length : (usersCurrent?.total ?? 0);
  const update = (key: 'role' | 'user', value: string | undefined): void =>
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key === 'role') {
          next.delete('user');
          setSearch('');
          setQuery('');
        }
        return next;
      },
      { replace: true },
    );
  const decided = decisions?.user === user ? decisions : undefined;
  const current = decided?.access && decided.effects ? decided : undefined;
  const effectOf = (key: string): AuthorizationEffect | undefined =>
    current?.effects?.get(key);
  const menuVisible = (menuId: string, actionIds: readonly string[]) => {
    const pages = workspace?.menuPages.get(menuId);
    return pages
      ? pages.some(
          (page) =>
            effectOf(JSON.stringify(['page', page, 'access'])) !== 'deny',
        )
      : actionIds.some((id) => effectOf(id) && effectOf(id) !== 'deny');
  };
  const menus = workspace?.modules.flatMap((module) =>
    module.menus
      .filter((menu) => !menu.public)
      .map((menu) => ({ module, menu })),
  );
  const visible = menus?.filter(({ menu }) =>
    menuVisible(
      menu.id,
      menu.actions.map((action) => action.id),
    ),
  ).length;

  return (
    <PermissionManagementPage tab='permission-check'>
      <div className='flex flex-col gap-4'>
        <div className='grid gap-3 sm:grid-cols-2 lg:max-w-2xl'>
          {rolesDenied ? null : (
            <div className='flex flex-col gap-1.5'>
              <Label>{t('settings.permissionCheck.role')}</Label>
              <Select
                items={roleItems}
                value={role ?? ALL_ROLES}
                onValueChange={(value) =>
                  update(
                    'role',
                    !value || value === ALL_ROLES ? undefined : String(value),
                  )
                }
              >
                <SelectTrigger aria-label={t('settings.permissionCheck.role')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='permission-check-user'>
              {t('settings.permissionCheck.user')}
            </Label>
            {/* One searchable picker: typing a name lists the matching users at once. */}
            <Combobox
              items={userItems.map((item) => item.value)}
              itemToStringLabel={(value: string) =>
                userItems.find((item) => item.value === value)?.label ?? value
              }
              filter={null}
              value={user ?? null}
              inputValue={search}
              onInputValueChange={(value, details) => {
                // Choosing a user fills the input with their name; only typing searches.
                if (details.reason === 'input-change') setSearch(value);
              }}
              onValueChange={(value: string | null) => {
                const next = value ?? undefined;
                setChosen(userItems.find((item) => item.value === next));
                setSearch('');
                update('user', next);
              }}
            >
              <ComboboxTrigger
                id='permission-check-user'
                aria-label={t('settings.permissionCheck.user')}
                render={
                  <Button
                    variant='outline'
                    className='w-full justify-between font-normal'
                  />
                }
              >
                <span className='min-w-0 truncate'>
                  {userItems.find((item) => item.value === user)?.label ??
                    t(
                      users && !userItems.length && !query
                        ? role
                          ? 'settings.permissionCheck.noRoleUsers'
                          : 'settings.permissionCheck.noUsers'
                        : 'settings.permissionCheck.chooseUser',
                    )}
                </span>
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxInput
                  aria-label={t('settings.permissionCheck.searchUsers')}
                  placeholder={t('settings.permissionCheck.searchPlaceholder')}
                  showTrigger={false}
                />
                <ComboboxEmpty>
                  {t(
                    !users
                      ? 'settings.permissionCheck.loadingUsers'
                      : query
                        ? 'settings.permissionCheck.noMatchingUsers'
                        : role
                          ? 'settings.permissionCheck.noRoleUsers'
                          : 'settings.permissionCheck.noUsers',
                  )}
                </ComboboxEmpty>
                <ComboboxList>
                  {(value: string) => (
                    <ComboboxItem key={value} value={value}>
                      {userItems.find((item) => item.value === value)?.label ??
                        value}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
        <p className='text-sm text-muted-foreground'>
          {t('settings.permissionCheck.hint')}
          {totalUsers > found.length
            ? ` ${t('settings.permissionCheck.moreUsers', {
                shown: found.length,
                total: totalUsers,
              })}`
            : ''}
        </p>
        <SettingsError error={options.error} retry={options.reload} />
        {rolesDenied ? null : (
          <SettingsError error={roles.error} retry={roles.reload} />
        )}
        <SettingsError error={usersCurrent?.error} />
        <SettingsError error={decided?.error} />
        {options.loading ? (
          <SettingsLoading />
        ) : !user ? null : !current ? (
          decided?.error ? null : (
            <SettingsLoading />
          )
        ) : (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap items-center gap-2 text-sm'>
              <span className='text-muted-foreground'>
                {t('settings.permissionCheck.roles')}
              </span>
              {current.access?.unrestricted ? (
                <Badge>{t('settings.unrestrictedRole')}</Badge>
              ) : null}
              {(current.access?.sets ?? []).map((set) => (
                <Badge key={set.key} variant='secondary'>
                  {text(set.title ?? set.key)}
                </Badge>
              ))}
              <span className='ml-auto text-muted-foreground'>
                {t('settings.permissionEditor.visibleMenus', {
                  visible,
                  total: menus?.length ?? 0,
                })}
              </span>
            </div>
            <div className='divide-y rounded-lg border'>
              {menus?.map(({ module, menu }) => {
                const open = menuVisible(
                  menu.id,
                  menu.actions.map((action) => action.id),
                );
                return (
                  <div
                    key={menu.id}
                    className='flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start'
                  >
                    <div className='flex min-w-0 items-center gap-2 sm:w-64 sm:shrink-0'>
                      <span
                        aria-hidden
                        className={cn(
                          'size-2 shrink-0 rounded-full',
                          open ? 'bg-primary' : 'bg-muted-foreground/30',
                        )}
                      />
                      <span className='min-w-0'>
                        <span className='block truncate text-sm font-medium'>
                          {menu.label}
                        </span>
                        <span className='block truncate text-xs text-muted-foreground'>
                          {[module.label, menu.group]
                            .filter(Boolean)
                            .join(' › ')}
                        </span>
                      </span>
                    </div>
                    <div className='flex min-w-0 flex-wrap gap-1.5'>
                      {menu.actions.map((action) => {
                        const effect = effectOf(action.id);
                        return (
                          <Badge
                            key={action.id}
                            variant={
                              effect === 'permit'
                                ? 'default'
                                : effect === 'conditional'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className={cn(
                              (!effect || effect === 'deny') &&
                                'text-muted-foreground line-through',
                            )}
                            title={t(
                              `settings.permissionCheck.effect.${effect ?? 'deny'}`,
                            )}
                          >
                            {action.label}
                            {effect === 'conditional'
                              ? ` · ${t('settings.permissionCheck.effect.conditional')}`
                              : ''}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PermissionManagementPage>
  );
}
