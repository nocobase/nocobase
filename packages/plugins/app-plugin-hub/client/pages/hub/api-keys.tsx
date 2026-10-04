import { PageHeader } from '../../components/page-header.js';
import { apiClientToken, useService, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import {
  Copy,
  KeyRound,
  LoaderCircle,
  Plus,
  Search,
  MoreHorizontal,
  Ban,
  Trash2,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group.js';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/ui/dropdown-menu.js';
import { AppDialog, ErrorNotification } from './shared.js';
import { formatDateTime } from './utils.js';
import type { HubCapabilities } from '../../permissions.js';
import {
  HUB_API_KEY_SCOPES,
  type HubApiKeyAppOption,
  type HubApiKeyScope,
  type HubApiKeySummary,
  type CreatedHubApiKey,
} from '../../../shared/api-keys.js';

export function ApiKeys({
  apps,
  capabilities,
}: {
  readonly apps: readonly HubApiKeyAppOption[];
  readonly capabilities: HubCapabilities;
}): ReactElement {
  const client = useService(apiClientToken);
  const { t, i18n } = useTranslation('@nocobase/app-plugin-hub');
  const toaster = useToaster();
  const [keys, setKeys] = useState<readonly HubApiKeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [createOpen, setCreateOpen] = useState(false);
  const [allApps, setAllApps] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [appIds, setAppIds] = useState<readonly string[]>([]);
  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [customExpiry, setCustomExpiry] = useState(false);
  const [scopes, setScopes] = useState<readonly HubApiKeyScope[]>([]);
  const [created, setCreated] = useState<CreatedHubApiKey>();
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    key: HubApiKeySummary;
    action: 'disable' | 'delete';
  }>();
  const canManage = capabilities['manage-api-keys'];
  const copySecret = async (secret: string): Promise<boolean> => {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toaster.show({ type: 'success', title: t('apiKeys.copied') });
      return true;
    } catch {
      setCopied(false);
      setError(t('apiKeys.copyFailed'));
      return false;
    }
  };

  const scopeOptions = HUB_API_KEY_SCOPES;
  const allowedScopes = scopeOptions.filter((scope) =>
    allApps
      ? capabilities[scope]
      : appIds.length > 0 &&
        appIds.every((id) =>
          apps.find((app) => app.id === id)?.permissions.includes(scope),
        ),
  );
  const visibleApps = apps.filter((app) =>
    `${app.name} ${app.id}`
      .toLocaleLowerCase()
      .includes(appSearch.trim().toLocaleLowerCase()),
  );
  const path = 'hub/apiKeys';
  const load = useCallback(async () => {
    const response = await client.request<{
      data: readonly HubApiKeySummary[];
    }>({ path });
    return response.data;
  }, [client, path]);
  useEffect(() => {
    let cancelled = false;
    if (!canManage) return;
    void load()
      .then((items) => {
        if (!cancelled) setKeys(items);
      })
      .catch(() => {
        if (!cancelled) setError(t('apiKeys.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load, canManage, t]);

  const perform = async (work: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      await work();
      setKeys(await load());
    } catch {
      setError(t('apiKeys.operationFailed'));
    } finally {
      setBusy(false);
    }
  };
  const date = (value: string | null): string =>
    value ? formatDateTime(value, i18n.language) : '—';
  const shortDate = (value: string): string =>
    new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  if (!canManage) return <ErrorNotification message={t('apiKeys.noAccess')} />;

  return (
    <section className='space-y-6'>
      <PageHeader
        title={t('apiKeys.title')}
        description={t('apiKeys.description')}
        actions={
          <Button
            variant='outline'
            disabled={
              busy ||
              (!apps.length &&
                !scopeOptions.some((scope) => capabilities[scope]))
            }
            onClick={() => {
              setName('');
              setAppIds([]);
              setAppSearch('');
              setAllApps(false);
              setExpiresAt('');
              setCustomExpiry(false);
              setScopes([]);
              setError(undefined);
              setCreateOpen(true);
            }}
          >
            <Plus className='size-4' />
            {t('apiKeys.create')}
          </Button>
        }
      />
      {!apps.length ? (
        <p className='text-sm text-muted-foreground'>{t('apiKeys.noApps')}</p>
      ) : null}
      {error ? (
        <ErrorNotification
          message={error}
          onClose={() => setError(undefined)}
        />
      ) : null}
      {loading ? (
        <div
          role='status'
          className='flex items-center gap-2 text-muted-foreground'
        >
          <LoaderCircle className='size-4 animate-spin' />
          {t('apiKeys.loading')}
        </div>
      ) : !keys.length ? (
        <div className='flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center'>
          <KeyRound className='size-8 text-muted-foreground' />
          <h3 className='font-medium'>{t('apiKeys.empty')}</h3>
          <p className='max-w-lg text-sm text-muted-foreground'>
            {t('apiKeys.emptyDescription')}
          </p>
        </div>
      ) : (
        <div className='overflow-x-auto rounded-lg border bg-card'>
          <table className='w-full min-w-[960px] table-fixed text-left text-sm'>
            <colgroup>
              <col className='w-[23%]' />
              <col className='w-[22%]' />
              <col className='w-[16%]' />
              <col className='w-[14%]' />
              <col className='w-[20%]' />
              <col className='w-[5%]' />
            </colgroup>
            <thead className='border-b bg-muted/30 text-xs text-muted-foreground'>
              <tr>
                {['name', 'apps', 'scopes', 'status', 'activity'].map(
                  (column) => (
                    <th
                      scope='col'
                      key={column}
                      className='whitespace-nowrap px-4 py-3 font-medium'
                    >
                      {t(`apiKeys.${column}`)}
                    </th>
                  ),
                )}
                <th scope='col'>
                  <span className='sr-only'>{t('apiKeys.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr
                  key={key.id}
                  className='border-b align-middle transition-colors last:border-0 hover:bg-muted/20'
                >
                  <td className='px-4 py-3'>
                    <div className='truncate font-medium' title={key.name}>
                      {key.name}
                    </div>
                    <div className='mt-0.5 flex min-w-0 items-center gap-1'>
                      <code
                        className='min-w-0 truncate text-xs text-muted-foreground'
                        title={`${key.prefix}…`}
                      >
                        {key.prefix}…
                      </code>
                      <span
                        title={
                          key.canCopy
                            ? t('apiKeys.viewAndCopy')
                            : t('apiKeys.copyUnavailable')
                        }
                      >
                        <Button
                          size={key.canCopy ? 'icon' : 'sm'}
                          variant='ghost'
                          className={
                            key.canCopy
                              ? 'size-6 shrink-0 text-muted-foreground'
                              : 'h-6 px-1 text-xs text-muted-foreground'
                          }
                          disabled={busy}
                          aria-label={t('apiKeys.copyNamed', {
                            name: key.name,
                          })}
                          onClick={() => {
                            if (!key.canCopy) {
                              setError(t('apiKeys.copyUnavailable'));
                              return;
                            }
                            setBusy(true);
                            setError(undefined);
                            void client
                              .request<{ data: { secret: string } }>({
                                path: `${path}/${key.id}/reveal`,
                                method: 'POST',
                              })
                              .then(async (response) => {
                                if (!(await copySecret(response.data.secret))) {
                                  setCreated({
                                    key,
                                    secret: response.data.secret,
                                  });
                                  setRevealed(true);
                                }
                              })
                              .catch(() => setError(t('apiKeys.revealFailed')))
                              .finally(() => setBusy(false));
                          }}
                        >
                          {key.canCopy ? (
                            <Copy className='size-3.5' />
                          ) : (
                            t('apiKeys.copyUnavailableLabel')
                          )}
                        </Button>
                      </span>
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    {key.allApps ? (
                      <div>
                        <span className='text-sm font-medium'>
                          {t('apiKeys.allAppsShort')}
                        </span>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {t('apiKeys.includesFutureApps')}
                        </p>
                      </div>
                    ) : (
                      <div className='flex flex-wrap items-center gap-1.5'>
                        {key.apps.slice(0, 2).map((app) => (
                          <span
                            key={app.id}
                            title={`${app.name} (${app.id})`}
                            className='block max-w-full truncate rounded bg-muted/60 px-2 py-1 text-xs leading-4'
                          >
                            {app.name}
                          </span>
                        ))}
                        {key.apps.length > 2 ? (
                          <details className='w-full text-xs'>
                            <summary className='cursor-pointer text-muted-foreground hover:text-foreground'>
                              {t('apiKeys.moreApps', {
                                count: key.apps.length - 2,
                              })}
                            </summary>
                            <div className='mt-2 flex flex-wrap gap-1.5'>
                              {key.apps.slice(2).map((app) => (
                                <span
                                  key={app.id}
                                  title={`${app.name} (${app.id})`}
                                  className='block max-w-full truncate rounded bg-muted/60 px-2 py-1 leading-4'
                                >
                                  {app.name}
                                </span>
                              ))}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='space-y-1'>
                      {key.scopes.map((scope) => (
                        <div
                          key={scope}
                          className='flex items-center gap-1.5 whitespace-nowrap text-xs leading-5'
                        >
                          <Check
                            aria-hidden='true'
                            className='size-3.5 shrink-0 text-muted-foreground'
                          />
                          {t(
                            scope === 'upload-release'
                              ? 'releases.upload'
                              : 'deployments.deploy',
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${key.status === 'active' ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}
                    >
                      <span
                        aria-hidden='true'
                        className={`size-1.5 rounded-full ${key.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/60'}`}
                      />
                      {t(`apiKeys.state.${key.status}`)}
                    </span>
                    <div
                      className='mt-1 text-xs leading-5 text-muted-foreground'
                      title={key.expiresAt ? date(key.expiresAt) : undefined}
                    >
                      {key.expiresAt
                        ? t('apiKeys.expiresOn', {
                            date: shortDate(key.expiresAt),
                          })
                        : t('apiKeys.never')}
                    </div>
                  </td>
                  <td className='px-4 py-3 text-xs leading-5'>
                    <div
                      className='truncate'
                      title={`${t('apiKeys.createdByName', { name: key.creatorName })} · ${date(key.createdAt)}`}
                    >
                      {key.creatorName}
                      <span
                        className='mx-1.5 text-muted-foreground'
                        aria-hidden='true'
                      >
                        ·
                      </span>
                      <time
                        dateTime={key.createdAt}
                        className='text-muted-foreground'
                      >
                        {shortDate(key.createdAt)}
                      </time>
                    </div>
                    <div
                      className='mt-1 text-muted-foreground'
                      title={key.lastUsedAt ? date(key.lastUsedAt) : undefined}
                    >
                      {key.lastUsedAt
                        ? t('apiKeys.lastUsedOn', {
                            date: shortDate(key.lastUsedAt),
                          })
                        : t('apiKeys.neverUsed')}
                    </div>
                  </td>
                  <td className='py-3 pr-2 text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size='icon'
                            variant='ghost'
                            className='size-8 text-muted-foreground'
                            disabled={busy}
                            aria-label={t('apiKeys.keyActions', {
                              name: key.name,
                            })}
                          >
                            <MoreHorizontal className='size-4' />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align='end' className='w-40'>
                        {key.status === 'active' ? (
                          <DropdownMenuItem
                            disabled={busy}
                            onClick={() =>
                              setConfirmation({ key, action: 'disable' })
                            }
                          >
                            <Ban className='size-4' />
                            {t('apiKeys.disable')}
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          className='text-destructive focus:text-destructive'
                          disabled={busy}
                          onClick={() =>
                            setConfirmation({ key, action: 'delete' })
                          }
                        >
                          <Trash2 className='size-4' />
                          {t('apiKeys.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {createOpen ? (
        <AppDialog
          title={t('apiKeys.create')}
          description={t('apiKeys.createDescription')}
          contentClassName='sm:max-w-2xl'
          onClose={() => {
            if (!busy) setCreateOpen(false);
          }}
          footer={
            <>
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => setCreateOpen(false)}
              >
                {t('apiKeys.cancel')}
              </Button>
              <Button
                disabled={
                  busy ||
                  !name.trim() ||
                  (customExpiry && !expiresAt) ||
                  (!allApps && !appIds.length) ||
                  !scopes.length ||
                  scopes.some((scope) => !allowedScopes.includes(scope))
                }
                onClick={() =>
                  void perform(async () => {
                    if (
                      expiresAt &&
                      (!Number.isFinite(new Date(expiresAt).getTime()) ||
                        new Date(expiresAt).getTime() <= Date.now())
                    ) {
                      setError(t('apiKeys.invalidExpiry'));
                      return;
                    }
                    const response = await client.request<{
                      data: CreatedHubApiKey;
                    }>({
                      path,
                      method: 'POST',
                      json: {
                        name,
                        scopes,
                        appIds: allApps ? [] : appIds,
                        allApps,
                        expiresAt: expiresAt
                          ? new Date(expiresAt).toISOString()
                          : null,
                      },
                    });
                    setCreateOpen(false);
                    setCreated(response.data);
                    setRevealed(false);
                    setCopied(false);
                  })
                }
              >
                {busy ? <LoaderCircle className='size-4 animate-spin' /> : null}
                {t('apiKeys.create')}
              </Button>
            </>
          }
        >
          <div className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='grid gap-2'>
                <span className='text-sm font-medium'>
                  {t('apiKeys.name')} <RequiredMarker />
                </span>
                <Input
                  autoFocus
                  aria-label={t('apiKeys.name')}
                  required
                  value={name}
                  maxLength={100}
                  disabled={busy}
                  placeholder='GitHub Actions'
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <div className='space-y-2'>
                <label className='grid gap-2'>
                  <span className='text-sm font-medium'>
                    {t('apiKeys.expiration')}
                    <span
                      aria-hidden='true'
                      className='ml-1 text-xs font-normal text-muted-foreground'
                    >
                      ({t('apiKeys.optional')})
                    </span>
                  </span>
                  <select
                    aria-label={t('apiKeys.expiration')}
                    className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'
                    value={customExpiry ? 'custom' : 'never'}
                    disabled={busy}
                    onChange={(event) => {
                      setCustomExpiry(event.target.value === 'custom');
                      setExpiresAt('');
                    }}
                  >
                    <option value='never'>{t('apiKeys.never')}</option>
                    <option value='custom'>{t('apiKeys.customExpiry')}</option>
                  </select>
                </label>
                {customExpiry ? (
                  <label className='block space-y-1'>
                    <span className='text-sm font-medium'>
                      {t('apiKeys.expiresAt')} <RequiredMarker />
                    </span>
                    <Input
                      type='datetime-local'
                      required
                      aria-label={t('apiKeys.expiresAt')}
                      value={expiresAt}
                      disabled={busy}
                      onChange={(event) => setExpiresAt(event.target.value)}
                    />
                    <span className='block text-xs text-muted-foreground'>
                      {t('apiKeys.localTime')}
                    </span>
                  </label>
                ) : null}
              </div>
            </div>
            <fieldset
              className='space-y-2'
              aria-describedby='api-key-apps-required'
            >
              <legend className='mb-2 text-sm font-medium'>
                {t('apiKeys.apps')} <RequiredMarker />
              </legend>
              <p id='api-key-apps-required' className='sr-only'>
                {t('apiKeys.appsRequired')}
              </p>
              <RadioGroup
                aria-label={t('apiKeys.apps')}
                aria-describedby='api-key-apps-required'
                className='grid gap-x-4 gap-y-3 sm:grid-cols-2'
                value={allApps ? 'all' : 'selected'}
                disabled={busy}
                onValueChange={(value) => {
                  const nextAllApps = value === 'all';
                  setAllApps(nextAllApps);
                  setScopes((current) =>
                    nextAllApps
                      ? current.filter((scope) => capabilities[scope])
                      : [],
                  );
                }}
              >
                <label className='flex cursor-pointer items-center gap-2 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-60'>
                  <RadioGroupItem value='selected' />
                  {t('apiKeys.selectedApps')}
                </label>
                <label className='flex cursor-pointer items-center gap-2 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-60'>
                  <RadioGroupItem
                    value='all'
                    aria-label={t('apiKeys.allApps')}
                    disabled={
                      busy || !scopeOptions.some((scope) => capabilities[scope])
                    }
                  />
                  <span>
                    {t('apiKeys.allAppsShort')}
                    <span className='ml-1 text-xs text-muted-foreground'>
                      {t('apiKeys.futureAppsNote')}
                    </span>
                  </span>
                </label>
              </RadioGroup>
              {allApps ? (
                <p className='pt-1 text-xs leading-relaxed text-muted-foreground'>
                  {t('apiKeys.allAppsHint')}
                </p>
              ) : null}
            </fieldset>
            <div className='space-y-4'>
              {!allApps ? (
                <div className='min-w-0 overflow-hidden rounded-lg border'>
                  <div className='flex items-center gap-3 border-b px-2 py-1.5'>
                    <div className='relative min-w-0 flex-1'>
                      <Search
                        aria-hidden='true'
                        className='pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground'
                      />
                      <Input
                        type='search'
                        className='h-8 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-1'
                        aria-label={t('apiKeys.searchApps')}
                        placeholder={t('apiKeys.searchApps')}
                        value={appSearch}
                        disabled={busy}
                        onChange={(event) => setAppSearch(event.target.value)}
                      />
                    </div>
                    <span
                      role='status'
                      className='shrink-0 text-xs text-muted-foreground'
                    >
                      {t('apiKeys.selectedCount', { count: appIds.length })}
                    </span>
                  </div>
                  <div
                    role='region'
                    aria-label={t('apiKeys.apps')}
                    tabIndex={0}
                    className='grid h-40 max-h-[30svh] min-h-0 auto-rows-max gap-x-2 overflow-x-hidden overflow-y-auto overscroll-contain p-2 [scrollbar-gutter:stable] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px] sm:grid-cols-2'
                  >
                    {visibleApps.length ? (
                      visibleApps.map((app) => (
                        <label
                          key={app.id}
                          title={`${app.name} (${app.id})`}
                          className='flex min-w-0 cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/50 has-checked:bg-muted/50'
                        >
                          <input
                            type='checkbox'
                            className='size-4 shrink-0 accent-primary'
                            disabled={busy}
                            checked={appIds.includes(app.id)}
                            onChange={(event) => {
                              const selected = event.target.checked
                                ? [...appIds, app.id]
                                : appIds.filter((id) => id !== app.id);
                              setAppIds(selected);
                              setScopes((current) =>
                                current.filter((scope) =>
                                  selected.every((id) =>
                                    apps
                                      .find((item) => item.id === id)
                                      ?.permissions.includes(scope),
                                  ),
                                ),
                              );
                            }}
                          />
                          <span className='min-w-0 flex-1 truncate'>
                            {app.name}
                          </span>{' '}
                          {app.name !== app.id ? (
                            <span className='ml-auto max-w-[40%] min-w-0 truncate text-xs text-muted-foreground'>
                              ({app.id})
                            </span>
                          ) : null}
                        </label>
                      ))
                    ) : (
                      <p className='px-3 py-5 text-center text-sm text-muted-foreground sm:col-span-2'>
                        {t(
                          apps.length
                            ? 'apiKeys.noMatchingApps'
                            : 'apiKeys.noApps',
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
              <fieldset
                className='min-w-0 space-y-2'
                aria-describedby='api-key-scopes-required'
              >
                <legend className='mb-2 text-sm font-medium'>
                  {t('apiKeys.scopes')} <RequiredMarker />
                </legend>
                <div className='grid gap-3 sm:grid-cols-2'>
                  {scopeOptions.map((scope) => (
                    <label
                      key={scope}
                      className='flex cursor-pointer items-start gap-2.5 rounded-md py-1 text-sm has-disabled:cursor-not-allowed has-disabled:text-muted-foreground'
                    >
                      <input
                        type='checkbox'
                        className='mt-0.5 size-4 shrink-0 accent-primary'
                        aria-label={t(
                          scope === 'upload-release'
                            ? 'releases.upload'
                            : 'deployments.deploy',
                        )}
                        checked={scopes.includes(scope)}
                        disabled={busy || !allowedScopes.includes(scope)}
                        onChange={(event) =>
                          setScopes(
                            event.target.checked
                              ? [...scopes, scope]
                              : scopes.filter((item) => item !== scope),
                          )
                        }
                      />
                      <span>
                        <span className='block font-medium'>
                          {t(
                            scope === 'upload-release'
                              ? 'releases.upload'
                              : 'deployments.deploy',
                          )}
                        </span>
                        <span className='mt-1 block text-xs leading-relaxed text-muted-foreground'>
                          {t(
                            scope === 'upload-release'
                              ? 'apiKeys.uploadHint'
                              : 'apiKeys.deployHint',
                          )}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <p
                  id='api-key-scopes-required'
                  className='text-xs font-normal text-muted-foreground'
                >
                  {t(
                    !allApps && !appIds.length
                      ? 'apiKeys.selectAppsFirst'
                      : allowedScopes.length < scopeOptions.length
                        ? 'apiKeys.unavailablePermissions'
                        : 'apiKeys.scopesRequired',
                  )}
                </p>
              </fieldset>
            </div>
          </div>
        </AppDialog>
      ) : null}
      {created ? (
        <AppDialog
          title={t(revealed ? 'apiKeys.viewAndCopy' : 'apiKeys.created')}
          description={t('apiKeys.storageHint')}
          onClose={() => setCreated(undefined)}
          footer={
            <Button onClick={() => setCreated(undefined)}>
              {t('apiKeys.done')}
            </Button>
          }
        >
          <div className='space-y-3'>
            <p className='text-sm font-medium'>{created.key.name}</p>
            <code className='block select-all break-all rounded-lg border bg-muted p-4 text-sm'>
              {created.secret}
            </code>
            <Button
              variant='outline'
              onClick={() => {
                setError(undefined);
                void copySecret(created.secret);
              }}
            >
              <Copy className='size-4' />
              {t(copied ? 'apiKeys.copied' : 'apiKeys.copy')}
            </Button>
          </div>
        </AppDialog>
      ) : null}
      {confirmation ? (
        <AppDialog
          title={t(`apiKeys.${confirmation.action}Title`, {
            name: confirmation.key.name,
          })}
          description={t(`apiKeys.${confirmation.action}Description`)}
          onClose={() => {
            if (!busy) setConfirmation(undefined);
          }}
          footer={
            <>
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => setConfirmation(undefined)}
              >
                {t('apiKeys.cancel')}
              </Button>
              <Button
                variant='destructive'
                disabled={busy}
                onClick={() =>
                  void perform(async () => {
                    await client.request({
                      path: `${path}/${confirmation.key.id}${confirmation.action === 'disable' ? '/disable' : ''}`,
                      method:
                        confirmation.action === 'disable' ? 'POST' : 'DELETE',
                    });
                    setConfirmation(undefined);
                  })
                }
              >
                {t(`apiKeys.${confirmation.action}`)}
              </Button>
            </>
          }
        ></AppDialog>
      ) : null}
    </section>
  );
}

function RequiredMarker(): ReactElement {
  return (
    <span className='text-destructive' aria-hidden='true'>
      *
    </span>
  );
}
