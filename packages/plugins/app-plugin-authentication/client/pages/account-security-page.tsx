import { useClientApplication, useToaster } from '@nocobase/app-client';
import { useLocale } from '@nocobase/i18n/client';
import {
  KeyRoundIcon,
  LaptopIcon,
  SmartphoneIcon,
  TerminalIcon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';

import { useAuthenticationErrorResolver } from '../actions/errors.js';
import { useAuthentication } from '../auth-provider.js';
import type { AuthClient } from '../auth-client.js';
import { Button } from '../components/ui/button.js';
import { Checkbox } from '../components/ui/checkbox.js';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';
import { Spinner } from '../components/ui/spinner.js';
import {
  useAuthenticationProviders,
  type AuthenticationProviderSummary,
} from '../settings/data.js';
import { describeDevice } from './device.js';
import { canUnlink } from './linked-accounts.js';
import { Panel, SettingsPage } from './shared.js';
import { useAuthenticationTranslation } from './i18n.js';

interface DeviceSession {
  readonly id: string;
  readonly token: string;
  readonly userAgent?: string | null;
  readonly ipAddress?: string | null;
  readonly updatedAt: Date | string;
}

interface LinkedAccount {
  readonly id: string;
  readonly providerId: string;
  readonly accountId: string;
  readonly updatedAt?: Date | string;
}

/** A failed Better Auth call; `error` is its body, which `useAuthenticationErrorResolver` reads. */
class AuthCallError extends Error {
  public constructor(public readonly error: unknown) {
    super('Authentication request failed.');
  }
}

/** Better Auth's `{ data, error }`: the data, or an `AuthCallError`. */
async function unwrap<TData>(
  request: Promise<{ data: TData | null; error: unknown }>,
): Promise<TData> {
  const result = await request;
  if (result.error) throw new AuthCallError(result.error);
  return result.data as TData;
}

/** Loads a list from Better Auth and reloads it on demand. */
function useList<TItem>(load: () => Promise<readonly TItem[]>): {
  readonly items?: readonly TItem[];
  readonly failed: boolean;
  readonly reload: () => void;
} {
  const [state, setState] = useState<{
    items?: readonly TItem[];
    failed: boolean;
  }>({ failed: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    load().then(
      (items) => {
        if (active) setState({ items, failed: false });
      },
      () => {
        if (active) setState((current) => ({ ...current, failed: true }));
      },
    );
    return () => {
      active = false;
    };
    // `load` is stable for a client; `attempt` reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps
  }, [attempt]);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, reload };
}

/**
 * Personal settings › Account › Account and security: the signed-in person's sign-in details, password, signed-in
 * devices and linked accounts. Every request goes to Better Auth's own endpoints, which act only on the session's user.
 */
export default function AccountSecurityPage(): ReactElement {
  const { t } = useAuthenticationTranslation();
  const { client, session } = useAuthentication();
  const sessions = useList<DeviceSession>(() =>
    unwrap(
      client.listSessions() as Promise<{
        data: DeviceSession[] | null;
        error: unknown;
      }>,
    ),
  );
  const accounts = useList<LinkedAccount>(() =>
    unwrap(
      client.listAccounts() as Promise<{
        data: LinkedAccount[] | null;
        error: unknown;
      }>,
    ),
  );
  const user = session?.user as
    | {
        readonly email?: string;
        readonly username?: string | null;
        readonly name?: string;
      }
    | undefined;
  // Changing the password with "Sign out of other devices" replaces this device's session.
  const [renewedToken, setRenewedToken] = useState<string>();
  const currentToken = renewedToken ?? session?.session.token;
  const credential = accounts.items?.find(
    (account) => account.providerId === 'credential',
  );

  return (
    <SettingsPage
      title={t('account.title')}
      description={t('account.description')}
    >
      <Panel title={t('account.signIn.title')}>
        <dl className='grid gap-x-4 gap-y-2 px-4 py-3 text-sm grid-cols-[6rem_minmax(0,1fr)] sm:grid-cols-[8rem_1fr]'>
          {user?.username ? (
            <>
              <dt className='text-muted-foreground'>
                {t('account.signIn.username')}
              </dt>
              <dd className='break-all'>{user.username}</dd>
            </>
          ) : null}
          <dt className='text-muted-foreground'>{t('account.signIn.email')}</dt>
          <dd className='break-all'>{user?.email}</dd>
        </dl>
        <p className='border-t px-4 py-2 text-xs text-muted-foreground'>
          {t('account.signIn.contactAdmin')}
        </p>
      </Panel>
      <PasswordPanel
        client={client}
        hasPassword={accounts.items ? Boolean(credential) : true}
        changedAt={credential?.updatedAt}
        otherDevices={
          sessions.items
            ? sessions.items.filter((item) => item.token !== currentToken)
                .length
            : undefined
        }
        onChanged={(token) => {
          if (token) setRenewedToken(token);
          sessions.reload();
          accounts.reload();
        }}
      />
      <DevicesPanel
        client={client}
        currentToken={currentToken}
        sessions={sessions}
      />
      <LinkedAccountsPanel client={client} accounts={accounts} />
    </SettingsPage>
  );
}

function useDateTime(): (value: Date | string) => string {
  const { locale } = useLocale();
  return (value) =>
    new Date(value).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
}

function PasswordPanel({
  client,
  hasPassword,
  changedAt,
  otherDevices,
  onChanged,
}: {
  readonly client: AuthClient;
  readonly hasPassword: boolean;
  readonly changedAt?: Date | string;
  readonly otherDevices?: number;
  readonly onChanged: (token?: string) => void;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  const format = useDateTime();
  const [open, setOpen] = useState(false);
  return (
    <Panel
      title={t('account.password.title')}
      meta={
        changedAt
          ? t('account.password.changedAt', { date: format(changedAt) })
          : undefined
      }
      actions={
        hasPassword ? (
          <Button size='sm' variant='outline' onClick={() => setOpen(true)}>
            {t('account.password.change')}
          </Button>
        ) : undefined
      }
    >
      {hasPassword ? null : (
        <p className='px-4 py-3 text-sm text-muted-foreground'>
          {t('account.password.none')}
        </p>
      )}
      <ChangePasswordDialog
        client={client}
        open={open}
        onOpenChange={setOpen}
        otherDevices={otherDevices}
        onChanged={onChanged}
      />
    </Panel>
  );
}

function ChangePasswordDialog({
  client,
  open,
  onOpenChange,
  otherDevices,
  onChanged,
}: {
  readonly client: AuthClient;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly otherDevices?: number;
  readonly onChanged: (token?: string) => void;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  const resolveError = useAuthenticationErrorResolver();
  const toaster = useToaster();
  const currentId = useId();
  const nextId = useId();
  const confirmId = useId();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const reset = (): void => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(undefined);
    setRevokeOthers(true);
  };
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (next !== confirm) {
      setError(t('account.password.mismatch'));
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      const result = await unwrap(
        client.changePassword({
          currentPassword: current,
          newPassword: next,
          revokeOtherSessions: revokeOthers,
        }),
      );
      toaster.show({ type: 'success', title: t('account.password.changed') });
      onOpenChange(false);
      reset();
      // Signing out the other devices gives this one a new session.
      onChanged(result?.token ?? undefined);
    } catch (failure) {
      setError(resolveError(failure)?.message);
    } finally {
      setPending(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) reset();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <form className='grid gap-4' onSubmit={(event) => void submit(event)}>
          <DialogHeader>
            <DialogTitle>{t('account.password.change')}</DialogTitle>
          </DialogHeader>
          <div className='grid gap-2'>
            <Label htmlFor={currentId}>{t('account.password.current')}</Label>
            <Input
              id={currentId}
              type='password'
              autoComplete='current-password'
              required
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor={nextId}>{t('account.password.new')}</Label>
            <Input
              id={nextId}
              type='password'
              autoComplete='new-password'
              required
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor={confirmId}>{t('account.password.confirm')}</Label>
            <Input
              id={confirmId}
              type='password'
              autoComplete='new-password'
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
          <Label className='flex items-center gap-2 font-normal'>
            <Checkbox
              checked={revokeOthers}
              onCheckedChange={(value) => setRevokeOthers(value)}
            />
            {otherDevices === undefined
              ? t('account.password.revokeOthers')
              : t('account.password.revokeOthersCount', {
                  count: otherDevices,
                })}
          </Label>
          {error ? (
            <p role='alert' className='text-sm text-destructive'>
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              {t('account.cancel')}
            </Button>
            <Button type='submit' disabled={pending}>
              {pending ? <Spinner /> : null}
              {t('account.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DevicesPanel({
  client,
  currentToken,
  sessions,
}: {
  readonly client: AuthClient;
  readonly currentToken?: string;
  readonly sessions: ReturnType<typeof useList<DeviceSession>>;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  const format = useDateTime();
  const toaster = useToaster();
  const resolveError = useAuthenticationErrorResolver();
  const [busy, setBusy] = useState<string>();
  const items = [...(sessions.items ?? [])].sort((a, b) =>
    a.token === currentToken
      ? -1
      : b.token === currentToken
        ? 1
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const others = items.filter((item) => item.token !== currentToken).length;
  const run = async (
    key: string,
    action: () => Promise<unknown>,
    done: string,
  ): Promise<void> => {
    setBusy(key);
    try {
      await action();
      toaster.show({ type: 'success', title: done });
      sessions.reload();
    } catch (failure) {
      toaster.show({
        type: 'error',
        title: resolveError(failure)?.message ?? t('account.failed'),
      });
    } finally {
      setBusy(undefined);
    }
  };
  return (
    <Panel
      title={t('account.devices.title')}
      meta={
        sessions.items
          ? t('account.devices.count', { count: items.length })
          : undefined
      }
      actions={
        others ? (
          <Button
            size='sm'
            variant='outline'
            className='text-destructive'
            disabled={busy !== undefined}
            onClick={() =>
              void run(
                'others',
                () => unwrap(client.revokeOtherSessions()),
                t('account.devices.signedOutOthers'),
              )
            }
          >
            {t('account.devices.signOutOthers')}
          </Button>
        ) : undefined
      }
    >
      {sessions.items === undefined ? (
        <div className='flex justify-center py-6'>
          {sessions.failed ? (
            <Button size='sm' variant='outline' onClick={sessions.reload}>
              {t('settings.retry')}
            </Button>
          ) : (
            <Spinner />
          )}
        </div>
      ) : (
        <ul>
          {items.map((item) => {
            const device = describeDevice(item.userAgent);
            const current = item.token === currentToken;
            const Icon =
              device.kind === 'commandLine'
                ? TerminalIcon
                : device.mobile
                  ? SmartphoneIcon
                  : LaptopIcon;
            const name =
              device.kind === 'commandLine'
                ? t('account.devices.commandLine', {
                    client: device.client ?? 'CLI',
                  })
                : device.kind === 'browser'
                  ? [device.client, device.os].filter(Boolean).join(' · ')
                  : t('account.devices.unknown');
            return (
              <li
                key={item.id}
                data-testid='device-session'
                className='flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-3 first:border-t-0'
              >
                <Icon
                  className='size-5 shrink-0 text-muted-foreground'
                  aria-hidden
                />
                <div className='min-w-48 flex-1'>
                  <div className='text-sm font-semibold'>{name}</div>
                  <div className='text-xs text-muted-foreground'>
                    {item.ipAddress || t('account.devices.noAddress')}
                  </div>
                </div>
                {current ? (
                  <span className='rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300'>
                    {t('account.devices.current')}
                  </span>
                ) : (
                  <>
                    <span className='text-xs text-muted-foreground'>
                      {t('account.devices.lastUsed', {
                        date: format(item.updatedAt),
                      })}
                    </span>
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={busy !== undefined}
                      onClick={() =>
                        void run(
                          item.id,
                          () =>
                            unwrap(client.revokeSession({ token: item.token })),
                          t('account.devices.signedOut'),
                        )
                      }
                    >
                      {t('account.devices.signOut')}
                    </Button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className='border-t px-4 py-2 text-xs text-muted-foreground'>
        {t('account.devices.note')}
      </p>
    </Panel>
  );
}

function LinkedAccountsPanel({
  client,
  accounts,
}: {
  readonly client: AuthClient;
  readonly accounts: ReturnType<typeof useList<LinkedAccount>>;
}): ReactElement | null {
  const { t } = useAuthenticationTranslation();
  const providers = useAuthenticationProviders();
  const toaster = useToaster();
  const resolveError = useAuthenticationErrorResolver();
  const [busy, setBusy] = useState<string>();
  // Published by `defineAuthConfig`; absent reads as Better Auth's default, on.
  const publicConfig = useClientApplication().config.public;
  const passwordSignIn =
    !publicConfig.has('auth.emailAndPassword.enabled') ||
    publicConfig.get('auth.emailAndPassword.enabled') !== false;
  if (!providers.data?.length) return null;
  const linked = accounts.items ?? [];
  const available = {
    password: passwordSignIn,
    providers: providers.data.map((provider) => provider.id),
  };
  const link = async (
    provider: AuthenticationProviderSummary,
  ): Promise<void> => {
    setBusy(provider.id);
    try {
      const callbackURL = window.location.href;
      // A social provider links through `linkSocial`; one `genericOAuth()` configures is not among Better Auth's
      // social providers (`PROVIDER_NOT_FOUND`) and links through its `/oauth2/link`.
      const social = await client.linkSocial({
        provider: provider.id,
        callbackURL,
      });
      const result =
        social.error &&
        Reflect.get(social.error, 'code') === 'PROVIDER_NOT_FOUND'
          ? await unwrap(
              client.$fetch<{ url?: string }>('/oauth2/link', {
                method: 'POST',
                body: { providerId: provider.id, callbackURL },
              }) as Promise<{ data: { url?: string } | null; error: unknown }>,
            )
          : await unwrap(Promise.resolve(social));
      const url = (result as { url?: string } | null)?.url;
      if (url) window.location.assign(url);
    } catch (failure) {
      toaster.show({
        type: 'error',
        title: resolveError(failure)?.message ?? t('account.failed'),
      });
      setBusy(undefined);
    }
  };
  const unlink = async (
    provider: AuthenticationProviderSummary,
    account: LinkedAccount,
  ): Promise<void> => {
    setBusy(provider.id);
    try {
      await unwrap(client.unlinkAccount({ accountId: account.id }));
      toaster.show({ type: 'success', title: t('account.linked.unlinked') });
      accounts.reload();
    } catch (failure) {
      toaster.show({
        type: 'error',
        title: resolveError(failure)?.message ?? t('account.failed'),
      });
    } finally {
      setBusy(undefined);
    }
  };
  return (
    <Panel
      title={t('account.linked.title')}
      meta={t('account.linked.description')}
    >
      <ul>
        {providers.data.map((provider) => {
          const account = linked.find(
            (item) => item.providerId === provider.id,
          );
          return (
            <li
              key={provider.id}
              data-testid={`linked-account-${provider.id}`}
              className='flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-3 first:border-t-0'
            >
              <KeyRoundIcon
                className='size-4 text-muted-foreground'
                aria-hidden
              />
              <div className='min-w-32 flex-1 text-sm font-medium'>
                {provider.name}
              </div>
              <span className='text-sm text-muted-foreground'>
                {account
                  ? t('account.linked.linkedAs', { id: account.accountId })
                  : t('account.linked.notLinked')}
              </span>
              {account ? (
                <Button
                  size='sm'
                  variant='outline'
                  disabled={
                    busy !== undefined || !canUnlink(account, linked, available)
                  }
                  onClick={() => void unlink(provider, account)}
                >
                  {t('account.linked.unlink')}
                </Button>
              ) : (
                <Button
                  size='sm'
                  variant='outline'
                  disabled={busy !== undefined}
                  onClick={() => void link(provider)}
                >
                  {t('account.linked.link')}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <p className='border-t px-4 py-2 text-xs text-muted-foreground'>
        {t('account.linked.lastMethod')}
      </p>
    </Panel>
  );
}
