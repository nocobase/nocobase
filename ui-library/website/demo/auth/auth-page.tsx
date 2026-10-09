import { useState, type ReactElement, type ReactNode } from 'react';

import { AuthMethods } from '#extensions/nocobase-auth-methods/auth-methods';

import { LoginForm, OtherForm, type AuthView } from './auth-forms.js';
import { providers } from './sso-providers.js';

const titles: Record<AuthView, { title: string; description: string }> = {
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

export interface AuthPageContent {
  /** The props both layouts take: the view's title and description, the brand, and the footer. */
  readonly shared: {
    readonly title: string;
    readonly description: string;
    readonly footer: ReactNode;
    readonly logo: ReactNode;
    readonly name: string;
  };
  /** The current view's form, the children of either layout. */
  readonly form: ReactNode;
}

/** What an application's sign-in page passes a layout, switching between the views through the forms' links. */
export function useAuthPage(): AuthPageContent {
  const [view, setView] = useState<AuthView>('login');
  const shared = {
    ...titles[view],
    footer: (
      <>
        By continuing, you agree to the <a href='#terms'>Terms of Service</a>.
      </>
    ),
    logo: (
      <>
        <img alt='' className='dark:hidden' src='/assets/logo-mark.png' />
        <img
          alt=''
          className='hidden dark:block'
          src='/assets/logo-mark-dark.png'
        />
      </>
    ),
    name: 'NocoBase',
  };
  const form: ReactElement =
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
  return { shared, form };
}
