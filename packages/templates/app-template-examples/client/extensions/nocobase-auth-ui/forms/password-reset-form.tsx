import { useTranslation } from '@nocobase/i18n/client';
import { usePasswordReset } from '@nocobase/app-plugin-authentication/client/actions';
import { useState, type FormEvent, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { FormStatus } from '../components/form-status.js';

export interface PasswordResetFormProps {
  readonly action?: PasswordResetAction;
  readonly className?: string;
  readonly token: string;
  readonly submitLabel?: string;
  readonly pendingLabel?: string;
}

export interface PasswordResetAction {
  readonly error?: { readonly message: string };
  readonly isPending: boolean;
  readonly submit: (input: {
    readonly password: string;
    readonly token: string;
  }) => Promise<void>;
}

export function PasswordResetForm(
  inputProps: PasswordResetFormProps,
): ReactElement {
  const { t } = useTranslation();
  const {
    action: actionOverride,
    className,
    token,
    submitLabel = t('auth.resetTitle', { defaultValue: 'Reset password' }),
    pendingLabel = t('auth.resetting', { defaultValue: 'Resetting…' }),
  } = inputProps;

  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const validationError = passwordMismatch
    ? t('auth.passwordMismatch', { defaultValue: "Passwords don't match." })
    : undefined;
  const defaultAction = usePasswordReset();
  const action = actionOverride ?? defaultAction;
  const errorMessage =
    validationError ??
    (!token
      ? t('auth.invalidResetLink', {
          defaultValue: 'This password reset link is invalid or has expired.',
        })
      : undefined) ??
    action.error?.message;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!token) return;
    if (password !== confirmation) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    void action.submit({ password, token });
  };

  return (
    <form className={className ?? 'space-y-5'} onSubmit={handleSubmit}>
      <div className='space-y-2'>
        <Label htmlFor='new-password'>
          {t('auth.newPassword', { defaultValue: 'New password' })}
        </Label>
        <Input
          id='new-password'
          autoComplete='new-password'
          disabled={!token}
          onChange={(event) => setPassword(event.target.value)}
          required
          type='password'
          value={password}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='confirm-new-password'>
          {t('auth.confirmNewPassword', {
            defaultValue: 'Confirm new password',
          })}
        </Label>
        <Input
          id='confirm-new-password'
          autoComplete='new-password'
          disabled={!token}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type='password'
          value={confirmation}
        />
      </div>
      {errorMessage ? (
        <FormStatus type='error'>{errorMessage}</FormStatus>
      ) : null}
      <Button
        className='w-full'
        disabled={!token || action.isPending}
        type='submit'
      >
        {action.isPending ? pendingLabel : submitLabel}
      </Button>
      <div className='pt-3 text-sm'>
        <p className='text-center text-muted-foreground'>
          {t('auth.returnTo', { defaultValue: 'Return to' })}{' '}
          <a
            className='font-semibold text-foreground underline underline-offset-4'
            href='login'
          >
            {t('auth.signInLink', { defaultValue: 'sign in' })}
          </a>
        </p>
      </div>
    </form>
  );
}
