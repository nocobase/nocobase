import { siGithub, siGitlab, siGoogle } from 'simple-icons';
import { KeyRound } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import { PasswordLoginForm } from '../../../registry/auth/auth-forms/password-login-form';
import { PasswordRegistrationForm } from '../../../registry/auth/auth-forms/password-registration-form';
import { PasswordResetForm } from '../../../registry/auth/auth-forms/password-reset-form';
import { PasswordResetRequestForm } from '../../../registry/auth/auth-forms/password-reset-request-form';
import { AuthCenteredLayout } from '../../../registry/auth/auth-centered-layout/auth-centered-layout';
import { AuthSplitLayout } from '../../../registry/auth/auth-split-layout/auth-split-layout';
import {
  AuthMethods,
  type AuthSsoProvider,
} from '../../../registry/auth/auth-methods/auth-methods';
import { SimpleIconGlyph } from './simple-icon';

// The demos stand in for an application page: the forms are presentational, so each one is wired here to a fake
// submission that waits briefly and then fails or succeeds, the way a page wires it to the authentication plugin.
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

type View = 'login' | 'register' | 'forgot-password' | 'reset-password';
type Go = (view: View) => void;

const views: readonly View[] = [
  'login',
  'register',
  'forgot-password',
  'reset-password',
];

const titles: Record<View, { title: string; description: string }> = {
  login: {
    title: 'Welcome back',
    description: 'Sign in with your username or email.',
  },
  register: {
    title: 'Create an account',
    description: 'Fill in your details to get started.',
  },
  'forgot-password': {
    title: 'Forgot password',
    description: 'We will email you a reset link.',
  },
  'reset-password': {
    title: 'Reset password',
    description: 'Choose a new password.',
  },
};

/** A link that switches the demo's own view, so a demo never navigates out of its frame. */
function ViewLink({
  children,
  go,
  to,
}: {
  readonly children: ReactNode;
  readonly go: Go;
  readonly to: View;
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

function LoginForm({
  go,
  ldap = false,
}: {
  readonly go: Go;
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
function OtherForm({
  go,
  view,
}: {
  readonly go: Go;
  readonly view: View;
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

const providers: readonly AuthSsoProvider[] = [
  {
    icon: <SimpleIconGlyph icon={siGoogle} />,
    id: 'google',
    label: 'Google',
    onClick: () => undefined,
  },
  {
    icon: <SimpleIconGlyph icon={siGithub} />,
    id: 'github',
    label: 'GitHub',
    onClick: () => undefined,
  },
];

const moreProviders: readonly AuthSsoProvider[] = [
  ...providers,
  {
    icon: <SimpleIconGlyph icon={siGitlab} />,
    id: 'gitlab',
    label: 'GitLab',
    onClick: () => undefined,
  },
  {
    icon: <KeyRound />,
    id: 'oidc',
    label: 'Company SSO',
    onClick: () => undefined,
  },
];

const logo = (
  <>
    <img alt='' className='dark:hidden' src='/assets/logo-mark.png' />
    <img
      alt=''
      className='hidden dark:block'
      src='/assets/logo-mark-dark.png'
    />
  </>
);

/** `/demo/auth/<item>/<view>`: each item's demo, rendered the way an application page renders it. */
export function AuthenticationDemo(): ReactElement {
  const [, , , item, variant] = window.location.pathname.split('/');
  if (item === 'auth-centered-layout') return <LayoutDemo split={false} />;
  if (item === 'auth-split-layout') return <LayoutDemo split />;
  if (item === 'auth-methods') return <MethodsDemo many={variant === 'many'} />;
  return (
    <FormsDemo initial={views.find((view) => view === variant) ?? 'login'} />
  );
}

function Frame({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className='flex min-h-svh items-center justify-center bg-background p-6 text-foreground'>
      <div className='w-full max-w-sm'>{children}</div>
    </div>
  );
}

function FormsDemo({ initial }: { readonly initial: View }): ReactElement {
  const [view, setView] = useState<View>(initial);
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

function MethodsDemo({ many }: { readonly many: boolean }): ReactElement {
  const [view, setView] = useState<View>('login');
  return (
    <Frame>
      {view === 'login' ? (
        <AuthMethods
          methods={[
            {
              content: <LoginForm go={setView} />,
              id: 'password',
              label: 'Password',
            },
            {
              content: <LoginForm go={setView} ldap />,
              id: 'ldap',
              label: 'LDAP',
            },
          ]}
          providers={many ? moreProviders : providers}
        />
      ) : (
        <OtherForm go={setView} key={view} view={view} />
      )}
    </Frame>
  );
}

function LayoutDemo({ split }: { readonly split: boolean }): ReactElement {
  const [view, setView] = useState<View>('login');
  const shared = {
    ...titles[view],
    footer: (
      <>
        By continuing, you agree to the <a href='#terms'>Terms of Service</a>.
      </>
    ),
    logo,
    name: 'NocoBase',
  };
  const form =
    view === 'login' ? (
      <AuthMethods
        methods={[
          {
            content: <LoginForm go={setView} />,
            id: 'password',
            label: 'Password',
          },
        ]}
        providers={providers}
      />
    ) : (
      <OtherForm go={setView} key={view} view={view} />
    );
  return split ? (
    <AuthSplitLayout
      {...shared}
      aside={<ExampleAside />}
      asideLabel='About NocoBase'
    >
      {form}
    </AuthSplitLayout>
  ) : (
    <AuthCenteredLayout {...shared}>{form}</AuthCenteredLayout>
  );
}

function ExampleAside(): ReactElement {
  return (
    <div className='flex h-full flex-col justify-center gap-6 p-12'>
      <p className='max-w-md font-heading text-3xl font-semibold tracking-tight'>
        Let AI build freely. NocoBase keeps it reliable.
      </p>
      <p className='max-w-md text-sm text-muted-foreground'>
        The aside holds the application&apos;s own content, such as a product
        screenshot, a few highlights or a quote.
      </p>
    </div>
  );
}
