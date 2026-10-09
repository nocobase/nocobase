import { useState, type ReactElement, type ReactNode } from 'react';

import { PasswordLoginForm } from '#extensions/nocobase-auth-forms/password-login-form';
import { PasswordRegistrationForm } from '#extensions/nocobase-auth-forms/password-registration-form';
import { PasswordResetForm } from '#extensions/nocobase-auth-forms/password-reset-form';
import { PasswordResetRequestForm } from '#extensions/nocobase-auth-forms/password-reset-request-form';

// The demos stand in for an application page: the forms are presentational, so each one is wired here to a fake
// submission that waits briefly and then fails or succeeds, the way a page wires it to the authentication plugin's
// actions (`@nocobase/app-plugin-authentication/client/actions`).
function useFakeSubmit(outcome: 'error' | 'success' = 'success') {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'error' | 'success'>();
  const submit = async (): Promise<void> => {
    setSubmitting(true);
    setResult(undefined);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setSubmitting(false);
    setResult(outcome);
  };
  return { result, submit, submitting };
}

export type AuthView =
  'login' | 'register' | 'forgot-password' | 'reset-password';
export type GoToView = (view: AuthView) => void;

/** A link that switches the demo's own view, so a demo never navigates out of its frame. */
function ViewLink({
  children,
  go,
  to,
}: {
  readonly children: ReactNode;
  readonly go: GoToView;
  readonly to: AuthView;
}): ReactElement {
  return (
    <a
      href={`#${to}`}
      onClick={(event) => {
        event.preventDefault();
        go(to);
      }}
    >
      {children}
    </a>
  );
}

export function LoginForm({
  go,
  ldap = false,
}: {
  readonly go: GoToView;
  readonly ldap?: boolean;
}): ReactElement {
  const { result, submit, submitting } = useFakeSubmit('error');
  return (
    <PasswordLoginForm
      error={result === 'error' ? 'Invalid username or password.' : undefined}
      footer={
        ldap ? (
          'LDAP sign-in is configured by your administrator.'
        ) : (
          <>
            Don&apos;t have an account?{' '}
            <ViewLink go={go} to='register'>
              Sign up
            </ViewLink>
          </>
        )
      }
      forgotPasswordLink={
        ldap ? undefined : (
          <ViewLink go={go} to='forgot-password'>
            Forgot password?
          </ViewLink>
        )
      }
      labels={
        ldap
          ? { identifier: 'LDAP username', submit: 'Sign in with LDAP' }
          : undefined
      }
      onSubmit={submit}
      submitting={submitting}
    />
  );
}

/** The form of every view but sign-in, which each demo renders its own way. */
export function OtherForm({
  go,
  view,
}: {
  readonly go: GoToView;
  readonly view: AuthView;
}): ReactElement {
  const request = useFakeSubmit();
  const other = useFakeSubmit('error');
  const signInLine = (
    <>
      Already have an account?{' '}
      <ViewLink go={go} to='login'>
        Sign in
      </ViewLink>
    </>
  );
  if (view === 'register') {
    return (
      <PasswordRegistrationForm
        error={
          other.result === 'error'
            ? 'This username is already taken.'
            : undefined
        }
        footer={signInLine}
        onSubmit={other.submit}
        submitting={other.submitting}
      />
    );
  }
  if (view === 'forgot-password') {
    return (
      <PasswordResetRequestForm
        footer={
          <>
            Remember your password?{' '}
            <ViewLink go={go} to='login'>
              Sign in
            </ViewLink>
          </>
        }
        onSubmit={request.submit}
        submitting={request.submitting}
        success={request.result === 'success'}
      />
    );
  }
  return (
    <PasswordResetForm
      disabled
      error='This password reset link is invalid or has expired.'
      footer={
        <ViewLink go={go} to='login'>
          Back to sign in
        </ViewLink>
      }
      onSubmit={() => undefined}
    />
  );
}

/** Centers a form the way the demos without a layout show it. */
export function Frame({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='flex min-h-svh items-center justify-center bg-background p-6 text-foreground'>
      <div className='w-full max-w-sm'>{children}</div>
    </div>
  );
}

/** The four password forms, switching between each other through their links. */
export function AuthFormsDemo({
  initial = 'login',
}: {
  readonly initial?: AuthView;
}): ReactElement {
  const [view, setView] = useState<AuthView>(initial);
  return (
    <Frame>
      {view === 'login' ? (
        <LoginForm go={setView} />
      ) : (
        <OtherForm go={setView} key={view} view={view} />
      )}
    </Frame>
  );
}
