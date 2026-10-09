import { usePasswordResetRequest } from '@nocobase/app-plugin-authentication/client/actions';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { PasswordResetRequestForm } from '#extensions/nocobase-auth-forms/password-reset-request-form';

import { AuthPage } from './shared.js';

export default function ForgotPasswordPage(): ReactElement {
  const { t } = useTranslation();
  const request = usePasswordResetRequest();

  return (
    <AuthPage
      description={t('auth.forgotDescription')}
      title={t('auth.forgotTitle')}
    >
      <PasswordResetRequestForm
        error={request.error?.message}
        footer={
          <>
            {t('auth.rememberPassword')}{' '}
            <Link to='/login'>{t('auth.signIn')}</Link>
          </>
        }
        labels={{
          email: t('auth.email'),
          submit: t('auth.sendResetLink'),
          submitting: t('auth.sending'),
          success: t('auth.resetSent'),
        }}
        onSubmit={request.submit}
        submitting={request.isPending}
        success={request.isSuccess}
      />
    </AuthPage>
  );
}
