/**
 * `/account/git`: the person's own account on each code host. Every connection they can link (an app's installations
 * once; never a demo one), or have linked even if it no longer allows it, is a row
 * with its provider's icon, its name, host and account, and one way to connect first ("Connect {provider}"): the app's
 * OAuth web flow when it offers one (back through `/oauth/git/callback`, which returns here with `connected=1` or
 * `error=<code>`), else its device flow (a code entered on the host, polled here until it is). The other ways it
 * offers wait in "Other ways": the device flow beside the web flow, and a personal access token (checked by the server
 * against the host, with the permissions it needs). A connected row shows the account, how it was
 * connected, when it expires (warned a week ahead) and Disconnect. Tokens never reach the browser. With nothing to link
 * the page says personal linking is not available yet, and tells whoever manages Git connections what to turn on in
 * Settings › Git. The
 * dialog's section heading carries the page's description; the rows sit directly under it, separated by dividers.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon, ExternalLinkIcon, GitBranchIcon } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import {
  compareConnectionAge,
  type GitConnectionChoice,
  type GitDeviceAuthorization,
  type GitDevicePoll,
  type GitPersonalHost,
  type GitPersonalMethod,
} from '../../../shared/git.js';
import { useNotify } from '../../access/notify.js';
import { gitKeys, useGitApi, useGitMe, useGitStatus } from '../../git/api.js';
import { ProviderIcon } from '../../git/connection-dialogs.js';
import { expiryOf, hostOf } from '../../git/connections-model.js';
import { providerOf } from '../../git/providers.js';

interface Pending {
  readonly type: 'device' | 'token';
  readonly connection: GitConnectionChoice;
}

export default function AccountGit(): ReactElement {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const query = useGitMe();
  const canManage = useGitStatus().data?.canManage === true;
  const [params, setParams] = useSearchParams();
  const [pending, setPending] = useState<Pending | null>(null);
  useEffect(() => {
    const error = params.get('error');
    if (params.get('connected'))
      notify.success(t('studioGit.personal.connectedNotice'));
    else if (error)
      notify.error(null, t('studioGit.personal.failed', { code: error }));
    if (params.has('connected') || params.has('error'))
      setParams({}, { replace: true });
  }, [notify, params, setParams, t]);
  const connect = useMutation({
    mutationFn: (connectionId: string) => api.authorize(connectionId),
    onSuccess: (url) => window.location.assign(url),
    onError: (error) => notify.error(error),
  });
  const disconnect = useMutation({
    mutationFn: (connectionId: string) => api.disconnect(connectionId),
    onSuccess: () => notify.success(t('studioGit.personal.disconnected')),
    onError: (error) => notify.error(error),
    onSettled: () => queryClient.invalidateQueries({ queryKey: gitKeys.me }),
  });
  if (!query.data)
    return (
      <p className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Spinner />
      </p>
    );
  const hosts = [...query.data.hosts].sort((a, b) =>
    compareConnectionAge(a.connection, b.connection),
  );
  const start = (
    method: GitPersonalMethod,
    connection: GitConnectionChoice,
  ): void => {
    if (method === 'oauth') connect.mutate(connection.id);
    else setPending({ type: method, connection });
  };
  return (
    <>
      {hosts.length === 0 ? (
        <Empty
          data-git-personal-empty
          className='min-h-40 border border-dashed p-6 md:p-6'
        >
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <GitBranchIcon />
            </EmptyMedia>
            <EmptyTitle>{t('studioGit.personal.emptyTitle')}</EmptyTitle>
            <EmptyDescription>
              {canManage
                ? t('studioGit.personal.emptyDescriptionManage')
                : t('studioGit.personal.emptyDescription')}
            </EmptyDescription>
          </EmptyHeader>
          {canManage ? (
            <EmptyContent>
              <Button
                variant='outline'
                nativeButton={false}
                render={<Link to='/config/git' />}
              >
                {t('studioGit.personal.openSettings')}
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <ul className='divide-y border-y'>
          {hosts.map((host) => (
            <HostRow
              key={host.connection.id}
              host={host}
              busy={connect.isPending || disconnect.isPending}
              onStart={(method) => start(method, host.connection)}
              onDisconnect={() => disconnect.mutate(host.connection.id)}
            />
          ))}
        </ul>
      )}
      <DeviceDialog
        connection={pending?.type === 'device' ? pending.connection : null}
        onClose={() => setPending(null)}
      />
      <TokenDialog
        connection={pending?.type === 'token' ? pending.connection : null}
        onClose={() => setPending(null)}
      />
    </>
  );
}

/** The other ways, as "Other ways" names them. */
const METHOD_ACTIONS: Readonly<Record<GitPersonalMethod, string>> = {
  oauth: 'studioGit.personal.connectBrowser',
  device: 'studioGit.personal.connectDevice',
  token: 'studioGit.personal.useToken',
};

/** The way offered first: signing in when the app allows it, else a code; a personal token only when it is all. */
function primaryOf(
  methods: readonly GitPersonalMethod[],
): GitPersonalMethod | null {
  return (
    (['oauth', 'device', 'token'] as const).find((method) =>
      methods.includes(method),
    ) ?? null
  );
}

function HostRow({
  host,
  busy,
  onStart,
  onDisconnect,
}: {
  readonly host: GitPersonalHost;
  readonly busy: boolean;
  readonly onStart: (method: GitPersonalMethod) => void;
  readonly onDisconnect: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const { connection, methods, authorization } = host;
  const expiry = authorization ? expiryOf(authorization) : null;
  const date = (value: string): string =>
    new Date(value).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  return (
    <li
      className='flex flex-wrap items-center justify-between gap-3 py-3 text-sm'
      data-git-connection={connection.id}
    >
      <div className='flex min-w-0 items-start gap-2'>
        <ProviderIcon provider={connection.provider} className='mt-0.5' />
        <div className='min-w-0 space-y-0.5'>
          <div className='font-medium'>
            {t('studioGit.connections.sourceTitle', {
              provider: providerOf(connection.provider).label,
              name: connection.name,
            })}
          </div>
          <div className='text-xs text-muted-foreground'>
            {[hostOf(connection.webUrl), connection.account]
              .filter(Boolean)
              .join(' · ')}
          </div>
          {authorization ? (
            <div
              className='flex flex-wrap items-center gap-1.5 pt-1'
              data-git-authorization={authorization.method}
            >
              <span>
                {authorization.login}
                <span className='text-muted-foreground'>
                  {` (${authorization.email})`}
                </span>
              </span>
              <Badge variant='secondary'>
                {t(`studioGit.personal.method.${authorization.method}`)}
              </Badge>
              {expiry === 'expired' ? (
                <Badge
                  variant='destructive'
                  data-expiry={expiry}
                  title={t('studioGit.personal.expiredHint')}
                >
                  {t('studioGit.personal.expired')}
                </Badge>
              ) : expiry && authorization.expiresAt ? (
                <Badge
                  variant='outline'
                  data-expiry={expiry}
                  className={
                    expiry === 'soon'
                      ? 'border-amber-500/50 text-amber-600 dark:text-amber-400'
                      : undefined
                  }
                >
                  {t('studioGit.personal.expires', {
                    date: date(authorization.expiresAt),
                  })}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-1.5'>
        {!authorization || expiry === 'expired' ? (
          methods.length === 0 ? (
            <span className='max-w-xs text-xs text-muted-foreground'>
              {t('studioGit.personal.unavailable')}
            </span>
          ) : (
            <ConnectActions
              provider={providerOf(connection.provider).label}
              methods={methods}
              emphasized={!authorization}
              busy={busy}
              onStart={onStart}
            />
          )
        ) : null}
        {authorization ? (
          <Button
            size='sm'
            variant='outline'
            disabled={busy}
            onClick={onDisconnect}
          >
            {t('studioGit.personal.disconnect')}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

/** "Connect {provider}" by the first way offered, and the others in "Other ways". */
function ConnectActions({
  provider,
  methods,
  emphasized,
  busy,
  onStart,
}: {
  readonly provider: string;
  readonly methods: readonly GitPersonalMethod[];
  readonly emphasized: boolean;
  readonly busy: boolean;
  readonly onStart: (method: GitPersonalMethod) => void;
}): ReactElement | null {
  const { t } = useTranslation();
  const primary = primaryOf(methods);
  if (!primary) return null;
  const others = methods.filter((method) => method !== primary);
  const variant = emphasized ? 'default' : 'outline';
  const main = (
    <Button
      size='sm'
      variant={variant}
      disabled={busy}
      data-git-method={primary}
      onClick={() => onStart(primary)}
    >
      {primary === 'token'
        ? t(METHOD_ACTIONS.token)
        : t('studioGit.personal.connect', { provider })}
    </Button>
  );
  if (others.length === 0) return main;
  return (
    <>
      {main}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size='sm' variant='ghost' disabled={busy} />}
        >
          {t('studioGit.personal.otherWays')}
          <ChevronDownIcon data-icon='inline-end' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-auto min-w-40'>
          {others.map((method) => (
            <DropdownMenuItem
              key={method}
              data-git-method={method}
              onClick={() => onStart(method)}
            >
              {t(METHOD_ACTIONS[method])}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

/** The device flow: the code to enter on the host, polled until the person has. */
function DeviceDialog({
  connection,
  onClose,
}: {
  readonly connection: GitConnectionChoice | null;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  // A new code is a new flow: `DeviceFlow` starts again from nothing.
  const [attempt, setAttempt] = useState(0);
  return (
    <Dialog
      open={connection !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {t('studioGit.personal.device.title', {
              name: connection?.name ?? '',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('studioGit.personal.device.description')}
          </DialogDescription>
        </DialogHeader>
        {connection ? (
          <DeviceFlow
            key={`${connection.id}:${attempt}`}
            connection={connection}
            onClose={onClose}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DeviceFlow({
  connection,
  onClose,
  onRetry,
}: {
  readonly connection: GitConnectionChoice;
  readonly onClose: () => void;
  readonly onRetry: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [code, setCode] = useState<GitDeviceAuthorization | null>(null);
  const [over, setOver] = useState<'expired' | 'denied' | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    api.startDeviceFlow(connection.id).then(
      (started) => {
        if (live) setCode(started);
      },
      (error: unknown) => {
        if (!live) return;
        setFailed(true);
        notify.error(error);
      },
    );
    return () => {
      live = false;
    };
  }, [api, connection.id, notify]);

  useEffect(() => {
    if (!code || over || failed) return undefined;
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let interval = code.interval;
    const settle = (answer: GitDevicePoll): void => {
      if (!live) return;
      if (answer.status === 'connected') {
        notify.success(t('studioGit.personal.connectedNotice'));
        void queryClient.invalidateQueries({ queryKey: gitKeys.me });
        onClose();
      } else if (answer.status === 'expired' || answer.status === 'denied')
        setOver(answer.status);
      else {
        // The host asks for a longer wait with `slowDown`.
        if (answer.status === 'slowDown')
          interval = answer.interval ?? interval + 5;
        poll();
      }
    };
    const poll = (): void => {
      timer = setTimeout(() => {
        api.pollDeviceFlow(connection.id, code.handle).then(settle, (error) => {
          if (!live) return;
          setFailed(true);
          notify.error(error);
        });
      }, interval * 1000);
    };
    poll();
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [api, code, connection.id, failed, notify, onClose, over, queryClient, t]);

  return (
    <div className='space-y-4'>
      {code ? (
        <div className='flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-4'>
          <code
            className='font-mono text-2xl font-semibold tracking-widest'
            data-git-user-code
          >
            {code.userCode}
          </code>
          <Button
            size='sm'
            variant='outline'
            nativeButton={false}
            render={
              <a href={code.verificationUri} target='_blank' rel='noreferrer' />
            }
          >
            {t('studioGit.personal.device.open', {
              host: hostOf(code.verificationUri),
            })}
            <ExternalLinkIcon data-icon='inline-end' />
          </Button>
        </div>
      ) : failed ? null : (
        <div className='flex justify-center p-4'>
          <Spinner />
        </div>
      )}
      <p className='text-xs text-muted-foreground'>
        {t(`studioGit.providers.${providerOf(connection.provider).id}.device`)}
      </p>
      {over ? (
        <p className='text-sm text-destructive'>
          {t(`studioGit.personal.device.${over}`)}
        </p>
      ) : code && !failed ? (
        <p className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Spinner className='size-3' />
          {t('studioGit.personal.device.waiting')}
        </p>
      ) : null}
      <DialogFooter>
        <Button type='button' variant='outline' onClick={onClose}>
          {t('studioGit.connections.cancel')}
        </Button>
        {over || failed ? (
          <Button type='button' onClick={onRetry}>
            {t('studioGit.personal.device.retry')}
          </Button>
        ) : null}
      </DialogFooter>
    </div>
  );
}

/** A personal access token: pasted, checked by the server against the host, never shown again. */
function TokenDialog({
  connection,
  onClose,
}: {
  readonly connection: GitConnectionChoice | null;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const close = (): void => {
    setToken('');
    onClose();
  };
  const save = useMutation({
    mutationFn: (input: { connectionId: string; token: string }) =>
      api.savePersonalToken(input.connectionId, input.token),
    onSuccess: () => {
      notify.success(t('studioGit.personal.token.saved'));
      close();
    },
    onError: (error) => notify.error(error),
    onSettled: () => queryClient.invalidateQueries({ queryKey: gitKeys.me }),
  });
  const provider = connection ? providerOf(connection.provider) : null;
  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (connection && token.trim())
      save.mutate({ connectionId: connection.id, token: token.trim() });
  };
  return (
    <Dialog
      open={connection !== null}
      onOpenChange={(open) => {
        if (!open && !save.isPending) close();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {t('studioGit.personal.token.title', {
              name: connection?.name ?? '',
            })}
          </DialogTitle>
          {provider ? (
            <DialogDescription>
              {t(`studioGit.providers.${provider.id}.personalToken`)}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        {connection && provider ? (
          <form onSubmit={submit} noValidate className='space-y-4'>
            <a
              href={provider.newTokenUrl(connection.webUrl)}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline'
            >
              {t(`studioGit.providers.${provider.id}.personalTokenLink`)}
              <ExternalLinkIcon className='size-3' aria-hidden='true' />
            </a>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='git-personal-token'>
                  {t('studioGit.personal.token.label')}
                </FieldLabel>
                <Input
                  id='git-personal-token'
                  type='password'
                  autoComplete='off'
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                />
                <FieldDescription>
                  {t('studioGit.personal.token.note')}
                </FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                disabled={save.isPending}
                onClick={close}
              >
                {t('studioGit.connections.cancel')}
              </Button>
              <Button type='submit' disabled={save.isPending || !token.trim()}>
                {save.isPending ? <Spinner data-icon='inline-start' /> : null}
                {t('studioGit.personal.token.save')}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
