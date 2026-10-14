import { Button } from '#components/ui/button';
import { AuthFormStatus } from '#extensions/nocobase-auth-forms/form-parts';
import { usePasswordResetCapability } from '@nocobase/app-plugin-authentication/client';
import { usePasswordReset } from '@nocobase/app-plugin-authentication/client/actions';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';

import { PasswordResetForm } from '#extensions/nocobase-auth-forms/password-reset-form';

import { AuthPage } from './shared.js';

export default function ResetPasswordPage(): ReactElement {
  const { t } = useTranslation();
  const reset = usePasswordReset();
  const capability = usePasswordResetCapability();
  const [searchParams] = useSearchParams();
  // The link in the reset email carries the token; without one the form cannot do anything.
  const token = searchParams.get('token') ?? '';

  return (
    <AuthPage
      description={t('auth.resetDescription')}
      title={t('auth.resetTitle')}
    >
      {capability.isPending ? (
        <div
          className='h-48 animate-pulse rounded-md bg-muted'
          aria-label={t('auth.loading')}
        />
      ) : capability.isError ? (
        <div className='space-y-4'>
          <AuthFormStatus type='error'>
            {t('auth.capabilityLoadFailed')}
          </AuthFormStatus>
          <Button variant='outline' onClick={() => void capability.refetch()}>
            {t('auth.retry')}
          </Button>
        </div>
      ) : capability.data?.passwordResetAvailable !== true ? (
        <div className='space-y-4'>
          <AuthFormStatus type='error'>
            {t('auth.passwordResetUnavailable')}
          </AuthFormStatus>
          <Link to='/login'>{t('auth.backToSignIn')}</Link>
        </div>
      ) : reset.isSuccess ? (
        <div className='space-y-4'>
          <AuthFormStatus type='success'>
            {t('auth.passwordResetSuccess')}
          </AuthFormStatus>
          <Link to='/login'>{t('auth.backToSignIn')}</Link>
        </div>
      ) : (
        <PasswordResetForm
          disabled={!token}
          error={token ? reset.error?.message : t('auth.invalidResetLink')}
          footer={
            <span className='flex flex-wrap justify-center gap-x-4 gap-y-2 [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary'>
              <Link to='/login'>{t('auth.backToSignIn')}</Link>
              {!token || reset.error ? (
                <Link to='/forgot-password'>
                  {t('auth.requestNewResetLink')}
                </Link>
              ) : null}
            </span>
          }
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
      )}
    </AuthPage>
  );
}
