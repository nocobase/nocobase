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
import { Label } from '#components/ui/label';
import { useSettingsData } from './hooks.js';
import { PermissionManagementPage } from './permission-management-page.js';
import { pagePermissionTitles } from './page-permission-titles.js';
import { permissionWorkspace } from './permission-workspace.js';
import { SettingsError, SettingsLoading } from './shared.js';

const ALL_ROLES = '__all__';
const BATCH = 100;

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
  const role = params.get('role') ?? undefined;
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
  const [usersResult, setUsersResult] = useState<{
    readonly role: string | undefined;
    readonly items?: readonly SubjectOption[];
    readonly error?: unknown;
  }>();
  useEffect(() => {
    let active = true;
    const load = role
      ? authz.listAssignments(role).then(async (assignments) => {
          const ids = assignments
            .filter((item) => item.subject.type === 'user')
            .map((item) => item.subject.id);
          return ids.length
            ? authz.resolveSubjects('inspector', 'user', ids)
            : [];
        })
      : authz
          .listSubjects('inspector', 'user', { page: 1, pageSize: 100 })
          .then((page) => page.items);
    load.then(
      (items) => active && setUsersResult({ role, items }),
      (error: unknown) => active && setUsersResult({ role, error }),
    );
    return () => {
      active = false;
    };
  }, [authz, role]);
  const usersCurrent = usersResult?.role === role ? usersResult : undefined;
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
  const userItems = (users ?? []).map((item) => ({
    value: item.id,
    label: text(item.title),
  }));
  const update = (key: 'role' | 'user', value: string | undefined): void =>
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key === 'role') next.delete('user');
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
          <div className='flex flex-col gap-1.5'>
            <Label>{t('settings.permissionCheck.user')}</Label>
            <Select
              items={userItems}
              value={user ?? null}
              onValueChange={(value) =>
                update('user', value ? String(value) : undefined)
              }
            >
              <SelectTrigger
                aria-label={t('settings.permissionCheck.user')}
                disabled={!users?.length}
              >
                <SelectValue
                  placeholder={t(
                    users && !users.length
                      ? role
                        ? 'settings.permissionCheck.noRoleUsers'
                        : 'settings.permissionCheck.noUsers'
                      : 'settings.permissionCheck.chooseUser',
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {userItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className='text-sm text-muted-foreground'>
          {t('settings.permissionCheck.hint')}
        </p>
        <SettingsError error={options.error} retry={options.reload} />
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
