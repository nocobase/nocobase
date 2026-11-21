import { TriangleAlertIcon, CheckIcon, XIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';

import { Button } from '../components/ui/button.js';
import { Spinner } from '../components/ui/spinner.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs.js';
import {
  useAuthenticationSettings,
  type AuthenticationSettings,
  type AuthenticationSignInMethod,
  type ConfigOrigin,
} from '../settings/data.js';
import {
  HowToChange,
  Panel,
  SettingHeader,
  SettingRow,
  SettingsPage,
  SourceBadge,
  StatusBadge,
} from './shared.js';
import { useAuthenticationTranslation, useDuration } from './i18n.js';

const TABS = ['methods', 'registration', 'password', 'session'] as const;
type Tab = (typeof TABS)[number];

const ISSUE_TABS: Record<
  AuthenticationSettings['issues'][number]['code'],
  Tab
> = {
  passwordResetUnavailable: 'password',
  publicOriginMissing: 'password',
  registrationFeedback: 'registration',
};

/**
 * System settings › Accounts › Sign-in and authentication: the effective sign-in settings, where each comes from and
 * what to fix. Read-only: every change is made in configuration and takes effect after a restart.
 */
export default function AuthenticationSettingsPage(): ReactElement {
  const { t } = useAuthenticationTranslation();
  const settings = useAuthenticationSettings();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: Tab = TABS.includes(requested as Tab)
    ? (requested as Tab)
    : 'methods';
  const select = (next: Tab): void =>
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (next === 'methods') copy.delete('tab');
        else copy.set('tab', next);
        return copy;
      },
      { replace: true },
    );

  return (
    <SettingsPage
      title={t('settings.title')}
      description={t('settings.description')}
    >
      {settings.isPending ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : settings.data ? (
        <>
          <Issues settings={settings.data} onOpen={select} />
          <Tabs value={tab} onValueChange={(value) => select(value as Tab)}>
            <div className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
              <TabsList variant='line'>
                {TABS.map((name) => (
                  <TabsTrigger key={name} value={name}>
                    {t(`settings.tabs.${name}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value='methods' className='mt-4 space-y-4'>
              <MethodsTab settings={settings.data} />
            </TabsContent>
            <TabsContent value='registration' className='mt-4 space-y-4'>
              <RegistrationTab settings={settings.data} />
            </TabsContent>
            <TabsContent value='password' className='mt-4 space-y-4'>
              <PasswordTab settings={settings.data} />
            </TabsContent>
            <TabsContent value='session' className='mt-4 space-y-4'>
              <SessionTab settings={settings.data} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div
          role='alert'
          className='flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm'
        >
          {t('settings.loadFailed')}
          <Button size='sm' variant='outline' onClick={settings.refetch}>
            {t('settings.retry')}
          </Button>
        </div>
      )}
    </SettingsPage>
  );
}

function Issues({
  settings,
  onOpen,
}: {
  readonly settings: AuthenticationSettings;
  readonly onOpen: (tab: Tab) => void;
}): ReactElement | null {
  const { t } = useAuthenticationTranslation();
  if (!settings.issues.length) return null;
  return (
    <div
      role='status'
      className='rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200'
    >
      <div className='flex items-center gap-2 font-semibold'>
        <TriangleAlertIcon className='size-4' aria-hidden />
        {t('settings.issues.title', { count: settings.issues.length })}
      </div>
      <ul className='mt-2 space-y-1.5'>
        {settings.issues.map((issue) => (
          <li
            key={issue.code}
            className='flex flex-wrap items-baseline gap-x-2'
          >
            <span>{t(`settings.issues.${issue.code}`)}</span>
            <button
              type='button'
              className='font-medium underline underline-offset-2'
              onClick={() => onOpen(ISSUE_TABS[issue.code])}
            >
              {t('settings.issues.view')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function methodText(
  t: ReturnType<typeof useAuthenticationTranslation>['t'],
  text: AuthenticationSignInMethod['title'] | undefined,
): string {
  return text
    ? t(text.key, { ns: text.ns, defaultValue: text.defaultValue })
    : '';
}

function MethodsTab({
  settings,
}: {
  readonly settings: AuthenticationSettings;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  const page = settings.signInPage;
  return (
    <>
      <Panel>
        <div className='hidden gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_8rem_9rem_7rem]'>
          <div>{t('settings.columns.method')}</div>
          <div>{t('settings.columns.config')}</div>
          <div>{t('settings.columns.status')}</div>
          <div>{t('settings.columns.source')}</div>
          <div />
        </div>
        {settings.methods.map((method) => (
          <div
            key={method.id}
            data-testid={`sign-in-method-${method.id}`}
            className='grid gap-2 border-t px-4 py-3 first:border-t-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_8rem_9rem_7rem] lg:items-center lg:gap-4'
          >
            <div className='min-w-0'>
              <div className='text-sm font-semibold'>
                {methodText(t, method.title)}
              </div>
              {method.description ? (
                <div className='text-xs text-muted-foreground'>
                  {methodText(t, method.description)}
                </div>
              ) : null}
              {method.providers.length ? (
                <div className='mt-1 text-xs text-muted-foreground'>
                  {method.providers.join(', ')}
                </div>
              ) : null}
            </div>
            <div className='min-w-0'>
              {method.config ? (
                <code className='rounded bg-muted px-1.5 py-0.5 text-xs break-words'>
                  {method.config}
                </code>
              ) : null}
            </div>
            <div className='flex flex-wrap items-center gap-2 lg:contents'>
              <div>
                <StatusBadge on={method.status === 'enabled'}>
                  {t(`settings.status.${method.status}`)}
                </StatusBadge>
              </div>
              <div>
                {method.origin ? (
                  <SourceBadge origin={method.origin} />
                ) : (
                  <span className='text-muted-foreground'>—</span>
                )}
              </div>
            </div>
            <div className='lg:text-right'>
              {method.detailsPath ? (
                <Button
                  size='sm'
                  variant='outline'
                  render={<Link to={method.detailsPath} />}
                  nativeButton={false}
                >
                  {t('settings.methods.details')}
                </Button>
              ) : method.status === 'notConfigured' &&
                (method.guide === 'sso' || method.guide === 'social') ? (
                <Button
                  size='sm'
                  variant='outline'
                  render={<Link to={`sso?type=${method.guide}`} />}
                  nativeButton={false}
                >
                  {t('settings.methods.howToEnable')}
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </Panel>
      <Panel title={t('settings.signInPage.title')}>
        <div className='flex flex-wrap gap-2 px-4 py-3'>
          <Entry on={page.password}>{t('settings.signInPage.password')}</Entry>
          <Entry on={page.signUp}>{t('settings.signInPage.signUp')}</Entry>
          <Entry on={page.forgotPassword}>
            {t('settings.signInPage.forgotPassword')}
          </Entry>
          <Entry on={page.providers.length > 0}>
            {page.providers.length
              ? t('settings.signInPage.providers', {
                  names: page.providers.join(', '),
                })
              : t('settings.signInPage.noProviders')}
          </Entry>
        </div>
      </Panel>
      <ul className='list-disc space-y-1 pl-5 text-sm text-muted-foreground'>
        <li>{t('settings.methods.noteRedeploy')}</li>
        <li>{t('settings.methods.noteUsers')}</li>
      </ul>
    </>
  );
}

function Entry({
  on,
  children,
}: {
  readonly on: boolean;
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  return (
    <span
      className={
        on
          ? 'rounded-full border px-3 py-0.5 text-sm'
          : 'rounded-full border border-dashed px-3 py-0.5 text-sm text-muted-foreground'
      }
    >
      {children}
      {on ? null : ` (${t('settings.signInPage.hidden')})`}
    </span>
  );
}

function yesNo(
  t: ReturnType<typeof useAuthenticationTranslation>['t'],
  value: boolean,
): string {
  return value ? t('settings.yes') : t('settings.no');
}

/** A YAML snippet, with a note for each value an environment variable sets, which `config.yml` cannot override. */
function snippet(yaml: string, origins: readonly ConfigOrigin[]): string {
  const variables = origins.filter((origin) => origin.env);
  return [
    '# config.yml',
    yaml,
    ...variables.map(
      (origin) => `# ${origin.path} is set by ${origin.env}; change it there.`,
    ),
  ].join('\n');
}

function RegistrationTab({
  settings,
}: {
  readonly settings: AuthenticationSettings;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  const registration = settings.registration;
  return (
    <>
      <Panel>
        <SettingHeader title={t('settings.registration.title')} />
        <SettingRow
          label={t('settings.registration.selfSignUp')}
          hint={t('settings.registration.selfSignUpHint')}
          value={
            <StatusBadge on={registration.selfSignUp.value}>
              {registration.selfSignUp.value
                ? t('settings.registration.allowed')
                : t('settings.registration.notAllowed')}
            </StatusBadge>
          }
          origin={registration.selfSignUp.origin}
        />
        <SettingRow
          label={t('settings.registration.autoSignIn')}
          value={yesNo(t, registration.autoSignIn.value)}
          origin={registration.autoSignIn.origin}
        />
        <SettingRow
          label={t('settings.registration.requireEmailVerification')}
          hint={t('settings.registration.requireEmailVerificationHint')}
          value={
            registration.requireEmailVerification.value
              ? t('settings.registration.required')
              : t('settings.registration.notRequired')
          }
          origin={registration.requireEmailVerification.origin}
        />
        <HowToChange
          snippet={snippet(
            [
              'auth:',
              '  emailAndPassword:',
              '    disableSignUp: true # invitation only',
              '    autoSignIn: true',
            ].join('\n'),
            [registration.selfSignUp.origin, registration.autoSignIn.origin],
          )}
        />
      </Panel>
      <Panel
        title={t('settings.registration.invite')}
        actions={
          <Button
            size='sm'
            variant='outline'
            render={<Link to='/settings/users' />}
            nativeButton={false}
          >
            {t('settings.registration.inviteAction')}
          </Button>
        }
      >
        <p className='px-4 py-3 text-sm text-muted-foreground'>
          {t('settings.registration.inviteDescription')}
        </p>
      </Panel>
      <ul className='list-disc space-y-1 pl-5 text-sm text-muted-foreground'>
        <li>{t('settings.registration.noteDisable')}</li>
        <li>{t('settings.registration.noteFeedback')}</li>
      </ul>
    </>
  );
}

function PasswordTab({
  settings,
}: {
  readonly settings: AuthenticationSettings;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  const { password, passwordReset: reset, app } = settings;
  const sender = reset.sender;
  const senderName =
    sender.kind === 'mailer'
      ? t('settings.reset.senderMailer', { name: sender.mailer })
      : sender.kind === 'inline'
        ? t('settings.reset.senderInline', { provider: sender.provider ?? '' })
        : t(`settings.reset.sender_${sender.kind}`);
  const mailer =
    sender.kind === 'mailer' && sender.mailer ? sender.mailer : 'system';
  return (
    <>
      <Panel>
        <SettingHeader title={t('settings.password.title')} />
        <SettingRow
          label={t('settings.password.length')}
          value={t('settings.password.lengthValue', {
            min: password.minLength.value,
            max: password.maxLength.value,
          })}
          origin={password.minLength.origin}
        />
        {password.username ? (
          <SettingRow
            label={t('settings.password.username')}
            value={t('settings.password.usernameValue', {
              min: password.username.minLength,
              max: password.username.maxLength,
            })}
            origin={password.username.origin}
          />
        ) : null}
        <HowToChange
          snippet={snippet(
            ['auth:', '  emailAndPassword:', '    minPasswordLength: 10'].join(
              '\n',
            ),
            [password.minLength.origin],
          )}
        />
      </Panel>
      <Panel
        title={t('settings.reset.title')}
        meta={
          <StatusBadge on={reset.available} tone='warning'>
            {reset.available
              ? t('settings.status.enabled')
              : t('settings.reset.off')}
          </StatusBadge>
        }
      >
        <div className='space-y-3 px-4 py-3'>
          {reset.customSender ? (
            <p className='text-sm'>{t('settings.reset.custom')}</p>
          ) : (
            <ul className='space-y-3'>
              <Check
                ok={reset.enabled.value === true}
                title={t('settings.reset.enabled')}
                detail={
                  <>
                    <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>
                      auth.passwordReset.enabled
                    </code>{' '}
                    {reset.enabled.value === null
                      ? t('settings.reset.notSet')
                      : String(reset.enabled.value)}
                  </>
                }
                origin={reset.enabled.origin}
              />
              <Check
                ok={sender.configured}
                title={t('settings.reset.sender')}
                detail={senderName}
              />
              <Check
                ok={reset.publicOrigin}
                title={t('settings.reset.publicOrigin')}
                detail={
                  <>
                    <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>
                      app.publicOrigin
                    </code>{' '}
                    {app.publicOrigin.value ??
                      t('settings.reset.publicOriginMissing')}
                  </>
                }
                origin={app.publicOrigin.origin}
              />
            </ul>
          )}
          <p
            className={
              reset.available
                ? 'rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200'
                : 'rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200'
            }
          >
            {reset.available
              ? t('settings.reset.availableNote')
              : t('settings.reset.unavailableNote')}
          </p>
        </div>
        <HowToChange
          snippet={snippet(
            [
              'app:',
              '  publicOrigin: https://apps.example.com',
              'auth:',
              '  passwordReset:',
              '    enabled: true',
              `    mailer: ${mailer}`,
            ].join('\n'),
            [reset.enabled.origin, app.publicOrigin.origin],
          )}
        />
      </Panel>
      <ul className='list-disc space-y-1 pl-5 text-sm text-muted-foreground'>
        <li>{t('settings.reset.noteRateLimit')}</li>
        <li>{t('settings.reset.noteSessions')}</li>
      </ul>
    </>
  );
}

function Check({
  ok,
  title,
  detail,
  origin,
}: {
  readonly ok: boolean;
  readonly title: ReactNode;
  readonly detail: ReactNode;
  readonly origin?: ConfigOrigin;
}): ReactElement {
  return (
    <li className='flex items-start gap-3'>
      <span
        className={
          ok
            ? 'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : 'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300'
        }
      >
        {ok ? (
          <CheckIcon className='size-3.5' aria-label='OK' />
        ) : (
          <XIcon className='size-3.5' aria-label='Missing' />
        )}
      </span>
      <div className='min-w-0 flex-1'>
        <div className='text-sm font-semibold'>{title}</div>
        <div className='text-xs break-words text-muted-foreground'>
          {detail}
        </div>
      </div>
      {origin ? <SourceBadge origin={origin} /> : null}
    </li>
  );
}

function SessionTab({
  settings,
}: {
  readonly settings: AuthenticationSettings;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  const duration = useDuration();
  const { session, security } = settings;
  const keys = security.signingKeys;
  const older = keys.versions.filter(
    (version) => version !== keys.currentVersion,
  ).length;
  return (
    <>
      <Panel>
        <SettingHeader title={t('settings.session.title')} />
        <SettingRow
          label={t('settings.session.expiresIn')}
          hint={t('settings.session.expiresInHint')}
          value={duration(session.expiresIn.value)}
          origin={session.expiresIn.origin}
        />
        <SettingRow
          label={t('settings.session.updateAge')}
          value={t('settings.session.updateAgeValue', {
            duration: duration(session.updateAge.value),
          })}
          origin={session.updateAge.origin}
        />
        <SettingRow
          label={t('settings.session.storage')}
          hint={t('settings.session.storageHint')}
          value={t(`settings.session.storage_${session.storage.value}`)}
          origin={session.storage.origin}
        />
        <SettingRow
          label={t('settings.session.cookieCache')}
          hint={t('settings.session.cookieCacheHint')}
          value={yesNo(t, session.cookieCache.value)}
          origin={session.cookieCache.origin}
        />
        <SettingRow
          label={t('settings.session.cookie')}
          value={[
            session.cookie.secure
              ? t('settings.session.httpsOnly')
              : t('settings.session.httpAndHttps'),
            `SameSite=${session.cookie.sameSite[0]?.toUpperCase() ?? ''}${session.cookie.sameSite.slice(1)}`,
            ...(session.cookie.httpOnly ? ['HttpOnly'] : []),
          ].join(' · ')}
          origin={session.cookie.origin}
        />
        <HowToChange
          snippet={snippet(
            [
              'auth:',
              '  session:',
              '    expiresIn: 604800 # seconds, 7 days',
              '    updateAge: 86400 # seconds, 1 day',
            ].join('\n'),
            [session.expiresIn.origin, session.updateAge.origin],
          )}
        />
      </Panel>
      <Panel>
        <SettingHeader title={t('settings.security.title')} />
        <SettingRow
          label={t('settings.security.signingKeys')}
          hint={t('settings.security.signingKeysHint')}
          value={
            keys.kind === 'authSecret'
              ? t('settings.security.keys_authSecret')
              : t(`settings.security.keys_${keys.kind}`, {
                  version: keys.currentVersion ?? '—',
                  count: older,
                })
          }
          origin={keys.origin}
        />
        <SettingRow
          label={t('settings.security.oauthTokens')}
          value={
            security.encryptOAuthTokens.value
              ? t('settings.security.encrypted')
              : t('settings.security.notEncrypted')
          }
          origin={security.encryptOAuthTokens.origin}
        />
        <SettingRow
          label={t('settings.security.rateLimit')}
          value={
            security.rateLimit.enabled
              ? t('settings.security.rateLimitOn', {
                  max: security.rateLimit.max,
                  window: duration(security.rateLimit.window),
                })
              : t('settings.security.rateLimitOff')
          }
          origin={security.rateLimit.origin}
        />
        <HowToChange
          snippet={snippet(
            [
              'auth:',
              '  rateLimit:',
              '    enabled: true',
              '    window: 10',
              '    max: 100',
            ].join('\n'),
            [security.rateLimit.origin],
          )}
          note={t('settings.security.keysNote')}
        />
      </Panel>
      <Panel title={t('settings.blocked.title')}>
        <dl className='grid gap-x-4 gap-y-2 px-4 py-3 text-sm sm:grid-cols-[10rem_1fr]'>
          <dt className='text-muted-foreground'>
            {t('settings.blocked.disabled')}
          </dt>
          <dd>{t('settings.blocked.disabledDescription')}</dd>
          <dt className='text-muted-foreground'>
            {t('settings.blocked.service')}
          </dt>
          <dd>{t('settings.blocked.serviceDescription')}</dd>
        </dl>
      </Panel>
    </>
  );
}
