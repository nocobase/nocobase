import type { ReactElement } from 'react';

import { PasswordForm } from './profile-forms.js';

/**
 * `/account/security`: changing the password. Signed-in sessions and devices will join it here.
 */
export default function AccountSecurity(): ReactElement {
  return <PasswordForm />;
}
