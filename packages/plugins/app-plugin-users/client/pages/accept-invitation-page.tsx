import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { Spinner } from '../components/ui/spinner.js';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { usePasswordLogin } from '@nocobase/app-plugin-authentication/client/actions';
import { useTranslation } from '@nocobase/i18n/client';
import {
  type FormEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';
import { UsersClient, type PublicUserInvitation } from '../user-client.js';

const NS = '@nocobase/app-plugin-users';
const MIN_PASSWORD = 8;

/** The `accept.errors.*` key for a lookup or acceptance refusal. */
function errorKey(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.reason === 'INVITATION_NOT_FOUND') return 'notFound';
    if (error.reason === 'INVITATION_EXPIRED') return 'expired';
    if (error.reason === 'INVITATION_ACCEPTED') return 'accepted';
    if (error.reason === 'INVITATION_REVOKED') return 'revoked';
    if (error.reason === 'INVITATION_EMAIL_VERIFICATION_REQUIRED')
      return 'verificationRequired';
    if (error.reason === 'INVITATION_VERIFICATION_RATE_LIMITED')
      return 'verificationRateLimited';
    if (error.reason?.startsWith('PASSWORD_')) return 'password';
    if (error.reason?.endsWith('_CONFLICT')) return 'accountConflict';
  }
  return 'failed';
}

/**
 * The link just accepted. Signing in briefly unmounts the page while the session loads, so this lives in the tab's
 * session storage rather than in component state; storage that cannot be used only costs the redirect.
 */
const JOINED_KEY = 'nocobase:invitation-joined';

function joinedToken(): string | null {
  try {
    return window.sessionStorage.getItem(JOINED_KEY);
  } catch {
    return null;
  }
}

function rememberJoined(token: string | null): void {
  try {
    if (token) window.sessionStorage.setItem(JOINED_KEY, token);
    else window.sessionStorage.removeItem(JOINED_KEY);
  } catch {
    // The redirect after signing in is a convenience.
  }
}

type Lookup =
  | { readonly state: 'loading' }
  | { readonly state: 'failed'; readonly error: string }
  | { readonly state: 'open'; readonly invitation: PublicUserInvitation };

/**
 * `/invite/:token`, the page an invitation email links to. It shows who invited the visitor, takes a name and a
 * password, creates the account and signs in. Existing accounts accept only from their matching session; visitors
 * signed in as another account must sign out first. Applications may replace it (`INVITE_ROUTE_ID`) to match their
 * own sign-in pages.
 */
export default function AcceptInvitationPage(): ReactElement {
  const { t } = useTranslation(NS);
  const api = useApiClient();
  const users = useMemo(() => new UsersClient(api), [api]);
  const { token = '' } = useParams();
  const location = useLocation();
  const emailVerificationToken =
    new URLSearchParams(location.hash.slice(1)).get('verification') ??
    undefined;
  const navigate = useNavigate();
  const { session } = useAuthentication();
  const [lookup, setLookup] = useState<Lookup>({ state: 'loading' });
  const [joined, setJoined] = useState(() => joinedToken() === token);
  // Signing in replaces the API client; the invitation is looked up once per link all the same, and not at all once
  // accepted, since a lookup would then report that instead of letting the new member in.
  const lookUp = useEffectEvent((value: string) =>
    users.lookupInvitation(value),
  );

  useEffect(() => {
    if (joined) return;
    let active = true;
    lookUp(token).then(
      (invitation) => active && setLookup({ state: 'open', invitation }),
      (error: unknown) =>
        active && setLookup({ state: 'failed', error: errorKey(error) }),
    );
    return () => {
      active = false;
    };
  }, [token, joined]);

  // Once the new account's session arrives, go in.
  useEffect(() => {
    if (!joined || !session) return;
    rememberJoined(null);
    void navigate('/', { replace: true });
  }, [joined, session, navigate]);

  let body: ReactNode;
  if (joined)
    body = (
      <p
        role='status'
        className='flex items-center gap-2 text-sm text-muted-foreground'
      >
        <Spinner aria-hidden='true' />
        {t('accept.submitting')}
      </p>
    );
  else if (lookup.state === 'loading')
    body = (
      <p
        role='status'
        className='flex items-center gap-2 text-sm text-muted-foreground'
      >
        <Spinner aria-hidden='true' />
        {t('accept.loading')}
      </p>
    );
  else if (lookup.state === 'failed')
    body = (
      <div className='space-y-5'>
        <Problem>{t(`accept.errors.${lookup.error}`)}</Problem>
        {lookup.error === 'accepted' ? <LoginLink /> : null}
      </div>
    );
  else
    body = (
      <AcceptForm
        token={token}
        emailVerificationToken={emailVerificationToken}
        users={users}
        invitation={lookup.invitation}
        onJoined={() => {
          rememberJoined(token);
          setJoined(true);
        }}
      />
    );

  return (
    <main className='flex min-h-svh items-center justify-center p-4'>
      <div className='w-full max-w-sm space-y-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm'>
        <header className='space-y-2'>
          <h1 className='text-xl font-semibold'>{t('accept.title')}</h1>
          {lookup.state === 'open' ? (
            <>
              <p className='text-sm text-muted-foreground'>
                {t('accept.description', {
                  inviter: lookup.invitation.inviterName,
                })}
              </p>
              {lookup.invitation.summary.length ? (
                <p className='text-sm text-muted-foreground'>
                  {t('accept.summary', {
                    items: lookup.invitation.summary.join(', '),
                  })}
                </p>
              ) : null}
            </>
          ) : null}
        </header>
        {body}
      </div>
    </main>
  );
}

function Problem({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <p
      role='alert'
      className='rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'
    >
      {children}
    </p>
  );
}

function LoginLink({ redirect }: { readonly redirect?: string }): ReactElement {
  const { t } = useTranslation(NS);
  return (
    <Button
      className='w-full'
      nativeButton={false}
      render={
        <Link
          to={
            redirect
              ? `/login?redirect=${encodeURIComponent(redirect)}`
              : '/login'
          }
        />
      }
    >
      {t('accept.goToLogin')}
    </Button>
  );
}

function AcceptForm({
  token,
  emailVerificationToken,
  users,
  invitation,
  onJoined,
}: {
  readonly token: string;
  readonly emailVerificationToken?: string;
  readonly users: UsersClient;
  readonly invitation: PublicUserInvitation;
  /** The account was created and is signing in. */
  readonly onJoined: () => void;
}): ReactElement {
  const { t } = useTranslation(NS);
  const toaster = useToaster();
  const { session, client, refresh } = useAuthentication();
  const login = usePasswordLogin();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCooling, setVerificationCooling] = useState(false);
  useEffect(() => {
    if (!verificationCooling) return;
    const timer = setTimeout(() => setVerificationCooling(false), 60_000);
    return () => clearTimeout(timer);
  }, [verificationCooling]);
  const [done, setDone] = useState<'signedUp' | 'existing'>();
  const canRegister =
    !!emailVerificationToken || invitation.emailVerificationRequired === false;
  const invitedSession =
    session?.user.email.toLowerCase() === invitation.email.toLowerCase();

  if (session && !invitedSession && !done) {
    const signOut = async (): Promise<void> => {
      // Better Auth reports failures as data rather than throwing.
      const result = await client.signOut().catch(() => ({ error: true }));
      if (result.error) {
        toaster.show({ type: 'error', title: t('accept.signOutFailed') });
        return;
      }
      await refresh();
    };
    return (
      <div className='space-y-5'>
        <p className='text-sm'>
          {t('accept.signedIn', {
            name: session.user.name || session.user.email,
          })}
        </p>
        <Button
          className='w-full'
          variant='outline'
          onClick={() => {
            signOut().catch(() => {
              toaster.show({ type: 'error', title: t('accept.signOutFailed') });
            });
          }}
        >
          {t('accept.signOut')}
        </Button>
      </div>
    );
  }

  if (done === 'existing')
    return (
      <div className='space-y-5'>
        <p className='text-sm'>{t('accept.existingAccount')}</p>
        <LoginLink redirect={`/invite/${encodeURIComponent(token)}`} />
      </div>
    );

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!invitedSession && !name.trim())
      return setProblem(t('accept.nameRequired'));
    if (!invitedSession && password.length < MIN_PASSWORD)
      return setProblem(t('accept.passwordTooShort', { min: MIN_PASSWORD }));
    setProblem(undefined);
    setSaving(true);
    try {
      const accepted = await users.acceptInvitation({
        token,
        emailVerificationToken,
        name: invitedSession
          ? session?.user.name || invitation.email
          : name.trim(),
        password: invitedSession ? '' : password,
      });
      setDone('signedUp');
      onJoined();
      if (!accepted.existingAccount)
        await login.submit({ identifier: accepted.email, password });
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.reason === 'INVITATION_SIGN_IN_REQUIRED'
      )
        setDone('existing');
      else setProblem(t(`accept.errors.${errorKey(error)}`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className='space-y-5'
      onSubmit={(event) => {
        submit(event).catch((error: unknown) => {
          setProblem(t(`accept.errors.${errorKey(error)}`));
        });
      }}
    >
      <div className='space-y-2'>
        <Label htmlFor='invite-email'>{t('accept.email')}</Label>
        <Input id='invite-email' readOnly value={invitation.email} />
      </div>
      {!invitedSession && canRegister ? (
        <>
          <div className='space-y-2'>
            <Label htmlFor='invite-name'>{t('accept.name')}</Label>
            <Input
              id='invite-name'
              autoComplete='name'
              autoFocus
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='invite-password'>{t('accept.password')}</Label>
            <Input
              id='invite-password'
              type='password'
              autoComplete='new-password'
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </>
      ) : null}
      {!invitedSession &&
      invitation.emailVerificationRequired !== false &&
      (!emailVerificationToken || problem) ? (
        <div className='space-y-3'>
          <p className='text-sm text-muted-foreground'>
            {t('accept.verifyDescription')}
          </p>
          {verificationSent ? (
            <p role='status' className='text-sm'>
              {t('accept.verificationSent')}
            </p>
          ) : null}
          <Button
            type='button'
            variant='outline'
            className='w-full'
            disabled={verifying || verificationCooling}
            onClick={() => {
              setVerifying(true);
              setProblem(undefined);
              users
                .verifyInvitationEmail(token)
                .then((result) => {
                  setVerificationCooling(true);
                  setVerificationSent(result.emailSent);
                  if (!result.emailSent)
                    setProblem(t('accept.errors.verificationDelivery'));
                })
                .catch((error: unknown) =>
                  setProblem(t(`accept.errors.${errorKey(error)}`)),
                )
                .finally(() => setVerifying(false));
            }}
          >
            {t(verifying ? 'accept.verificationSending' : 'accept.verifyEmail')}
          </Button>
        </div>
      ) : null}
      {!session ? (
        <LoginLink redirect={`/invite/${encodeURIComponent(token)}`} />
      ) : null}
      {problem ? <Problem>{problem}</Problem> : null}
      {done === 'signedUp' && login.error ? (
        <>
          <Problem>{login.error.message}</Problem>
          <LoginLink />
        </>
      ) : null}
      <Button
        className='w-full'
        type='submit'
        disabled={
          saving ||
          login.isPending ||
          done === 'signedUp' ||
          (!invitedSession && !canRegister)
        }
      >
        {saving || login.isPending ? (
          <Spinner data-icon='inline-start' aria-label={t('page.loading')} />
        ) : null}
        {saving || login.isPending
          ? t('accept.submitting')
          : t(invitedSession ? 'accept.join' : 'accept.submit')}
      </Button>
    </form>
  );
}
