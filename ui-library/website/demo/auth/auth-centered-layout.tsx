import type { ReactElement } from 'react';

import { AuthCenteredLayout } from '#extensions/nocobase-auth-centered-layout/auth-centered-layout';

import { useAuthPage } from './auth-page.js';

/** A sign-in page in the centered layout: the brand above the form's card. */
export function AuthCenteredLayoutDemo(): ReactElement {
  const { shared, form } = useAuthPage();
  return <AuthCenteredLayout {...shared}>{form}</AuthCenteredLayout>;
}
