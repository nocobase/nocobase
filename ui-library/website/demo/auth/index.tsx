import type { ReactElement } from 'react';

import { AuthCenteredLayoutDemo } from './auth-centered-layout.js';
import { AuthFormsDemo, type AuthView } from './auth-forms.js';
import { AuthMethodsDemo } from './auth-methods.js';
import { AuthSplitLayoutDemo } from './auth-split-layout.js';

const authViews: readonly AuthView[] = [
  'login',
  'register',
  'forgot-password',
  'reset-password',
];

/** `/demo/auth/<item>/<view>`: each item's demo, rendered the way an application page renders it. */
export function AuthenticationDemo(): ReactElement {
  const [, , , item, variant] = window.location.pathname.split('/');
  if (item === 'auth-centered-layout') return <AuthCenteredLayoutDemo />;
  if (item === 'auth-split-layout') return <AuthSplitLayoutDemo />;
  if (item === 'auth-methods')
    return <AuthMethodsDemo many={variant === 'many'} />;
  return (
    <AuthFormsDemo
      initial={authViews.find((view) => view === variant) ?? 'login'}
    />
  );
}
