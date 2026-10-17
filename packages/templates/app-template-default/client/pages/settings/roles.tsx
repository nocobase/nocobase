import { useSettingsData, useRolePermission } from './hooks.js';
import { useTranslation } from '@nocobase/i18n/client';
import type {
  PermissionSet,
  LocalizedText,
} from '@nocobase/app-plugin-authorization/client';
import { type ReactElement } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import { ShieldCheckIcon, PlusIcon } from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import {
  Empty,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '#components/ui/empty';
import { SettingsError, SettingsLoading } from './shared.js';

export default function RolesPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const search = params.get('q') ?? '';
  const request = useSettingsData<{ data: readonly PermissionSet[] }>(
    'authorization/permissionSets',
  );
  const canCreate = useRolePermission('create');
  const text = (value: LocalizedText): string =>
    typeof value === 'string'
      ? value
      : t(value.key, {
          ns: value.ns,
          defaultValue: value.defaultValue ?? value.key,
        });
  const rows = (request.data?.data ?? [])
    .filter((role) =>
      text(role.title ?? role.key)
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) =>
      text(a.title ?? a.key).localeCompare(
        text(b.title ?? b.key),
        i18n.language,
      ),
    );
  const create = canCreate ? (
    <Button
      nativeButton={false}
      render={<Link to={{ pathname: 'create', search: location.search }} />}
    >
      <PlusIcon />
      {t('settings.newRole')}
    </Button>
  ) : null;
  return (
    <>
      <PageContainer>
        <PageHeader
          title={t('settings.roles')}
          description={t('settings.rolesDescription')}
          actions={rows.length || search ? create : undefined}
        />
        <div className='flex items-center gap-3'>
          <Input
            className='sm:max-w-xs'
            value={search}
            placeholder={t('settings.roleSearch')}
            aria-label={t('settings.roleSearch')}
            onChange={(event) => {
              setParams(event.target.value ? { q: event.target.value } : {}, {
                replace: true,
              });
            }}
          />
          {search && (
            <Button
              variant='ghost'
              onClick={() => {
                setParams({});
              }}
            >
              {t('settings.clear')}
            </Button>
          )}
        </div>
        <SettingsError error={request.error} retry={request.reload} />
        {request.loading && !request.data ? (
          <SettingsLoading />
        ) : (
          !request.error &&
          (rows.length ? (
            <div className='divide-y overflow-hidden rounded-xl border bg-card'>
              {rows.map((role) => (
                <Link
                  key={role.key}
                  to={{
                    pathname: `${encodeURIComponent(role.key)}/edit`,
                    search: location.search,
                  }}
                  className='flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring'
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <div className='rounded-lg bg-primary/10 p-2 text-primary'>
                      <ShieldCheckIcon className='size-4' />
                    </div>
                    <div className='min-w-0'>
                      <p className='font-medium'>
                        {text(role.title ?? role.key)}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {role.key}
                      </p>
                    </div>
                  </div>
                  <Badge variant='secondary'>
                    {t(
                      role.protection
                        ? 'settings.protected'
                        : 'settings.custom',
                    )}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <Empty className='min-h-48 border border-dashed'>
              <EmptyMedia variant='icon'>
                <ShieldCheckIcon />
              </EmptyMedia>
              <EmptyTitle>
                {t(search ? 'settings.noResults' : 'settings.noRoles')}
              </EmptyTitle>
              <EmptyDescription>
                {t(search ? 'settings.clearHint' : 'settings.rolesDescription')}
              </EmptyDescription>
              <EmptyContent>
                {search ? (
                  <Button
                    variant='outline'
                    onClick={() => {
                      setParams({});
                    }}
                  >
                    {t('settings.clear')}
                  </Button>
                ) : (
                  create
                )}
              </EmptyContent>
            </Empty>
          ))
        )}
      </PageContainer>
      <Outlet context={{ reload: request.reload }} />
    </>
  );
}
