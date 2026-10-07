import { useState, type ReactElement } from 'react';

import { AuthMethods } from '@/extensions/nocobase-auth-methods/auth-methods';

import { Frame, LoginForm, OtherForm, type AuthView } from './auth-forms.js';
import { moreProviders, providers } from './sso-providers.js';

/** A password and an LDAP method in tabs, with two single sign-on providers below them, or four as icon buttons. */
export function AuthMethodsDemo({
  many = false,
}: {
  readonly many?: boolean;
}): ReactElement {
  const [view, setView] = useState<AuthView>('login');
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
