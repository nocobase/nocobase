import { KeyRound } from 'lucide-react';
import { siGithub, siGitlab, siGoogle } from 'simple-icons';

import type { AuthSsoProvider } from '#extensions/nocobase-auth-methods/auth-methods';

import { SimpleIconGlyph } from './simple-icon.js';

/** Sample single sign-on providers; an application starts each one's sign-in in onClick or links to it with href. */
export const providers: readonly AuthSsoProvider[] = [
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

export const moreProviders: readonly AuthSsoProvider[] = [
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
