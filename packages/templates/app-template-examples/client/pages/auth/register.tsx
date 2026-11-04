import { useSignUpAvailable } from '@nocobase/app-plugin-authentication/client';
import { usePasswordRegistration } from '@nocobase/app-plugin-authentication/client/actions';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link, Navigate } from 'react-router';

import { PasswordRegistrationForm } from '#extensions/nocobase-auth-forms/password-registration-form';
import { AuthFormStatus } from '#extensions/nocobase-auth-forms/form-parts';

import { AuthPage } from './shared.js';

export default function RegisterPage(): ReactElement {
  const { t } = useTranslation();
  const registration = usePasswordRegistration();
  const signUpAvailable = useSignUpAvailable();
  // The page stays so registration can be turned back on; while the server refuses sign-up it only redirects.
  if (!signUpAvailable) return <Navigate replace to='/login' />;

  return (
    <AuthPage
      description={registration.isSuccess ? '' : t('auth.registerDescription')}
      title={t(
        registration.isSuccess
          ? 'auth.registrationAccepted'
          : 'auth.registerTitle',
      )}
    >
      {registration.isSuccess ? (
        <div className='space-y-4'>
          <AuthFormStatus type='success'>
            {t('auth.registrationGuidance')}
          </AuthFormStatus>
          <p className='flex justify-center gap-4 text-sm'>
            <Link to='/login'>{t('auth.signIn')}</Link>
            <Link to='/forgot-password'>{t('auth.forgotLink')}</Link>
          </p>
        </div>
      ) : (
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
      )}
    </AuthPage>
  );
}
