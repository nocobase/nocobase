import { usePasswordReset } from '@nocobase/app-plugin-authentication/client/actions';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';

import { PasswordResetForm } from '@/extensions/nocobase-auth-forms/password-reset-form';

import { AuthPage } from './shared.js';

export default function ResetPasswordPage(): ReactElement {
  const { t } = useTranslation();
  const reset = usePasswordReset();
  const [searchParams] = useSearchParams();
  // The link in the reset email carries the token; without one the form cannot do anything.
  const token = searchParams.get('token') ?? '';

  return (
    <AuthPage
      description={t('auth.resetDescription')}
      title={t('auth.resetTitle')}
    >
      <PasswordResetForm
        disabled={!token}
        error={token ? reset.error?.message : t('auth.invalidResetLink')}
        footer={<Link to='/login'>{t('auth.backToSignIn')}</Link>}
        labels={{
          confirmPassword: t('auth.confirmNewPassword'),
          password: t('auth.newPassword'),
          passwordMismatch: t('auth.passwordMismatch'),
          submit: t('auth.resetTitle'),
          submitting: t('auth.resetting'),
        }}
        onSubmit={({ password }) => reset.submit({ password, token })}
        submitting={reset.isPending}
      />
    </AuthPage>
  );
}
