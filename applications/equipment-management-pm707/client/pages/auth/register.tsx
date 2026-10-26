import { useSignUpAvailable } from '@nocobase/app-plugin-authentication/client';
import { usePasswordRegistration } from '@nocobase/app-plugin-authentication/client/actions';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link, Navigate } from 'react-router';

import { PasswordRegistrationForm } from '#extensions/nocobase-auth-forms/password-registration-form';

import { AuthPage } from './shared.js';

export default function RegisterPage(): ReactElement {
  const { t } = useTranslation();
  const registration = usePasswordRegistration();
  const signUpAvailable = useSignUpAvailable();
  // The page stays so registration can be turned back on; while the server refuses sign-up it only redirects.
  if (!signUpAvailable) return <Navigate replace to='/login' />;

  return (
    <AuthPage
      description={t('auth.registerDescription')}
      title={t('auth.registerTitle')}
    >
      <PasswordRegistrationForm
        error={registration.error?.message}
        footer={
          <>
            {t('auth.existingAccount')}{' '}
            <Link to='/login'>{t('auth.signIn')}</Link>
          </>
        }
        labels={{
          confirmPassword: t('auth.confirmPassword'),
          email: t('auth.email'),
          name: t('auth.name'),
          password: t('auth.password'),
          passwordMismatch: t('auth.passwordMismatch'),
          submit: t('auth.createAccount'),
          submitting: t('auth.creatingAccount'),
          username: t('auth.username'),
        }}
        onSubmit={registration.submit}
        submitting={registration.isPending}
      />
    </AuthPage>
  );
}
