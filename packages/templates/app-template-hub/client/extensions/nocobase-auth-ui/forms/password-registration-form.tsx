import { useTranslation } from '@nocobase/i18n/client';
import { usePasswordRegistration } from '@nocobase/app-plugin-authentication/client/actions';
import { useState, type FormEvent, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { FormStatus } from '../components/form-status.js';

export interface PasswordRegistrationAction {
  readonly error?: { readonly message: string };
  readonly isPending: boolean;
  readonly submit: (input: {
    readonly email: string;
    readonly name: string;
    readonly password: string;
    readonly username: string;
  }) => Promise<void>;
}

export interface PasswordRegistrationFormProps {
  readonly action?: PasswordRegistrationAction;
  readonly className?: string;
  readonly submitLabel?: string;
  readonly pendingLabel?: string;
}

export function PasswordRegistrationForm(
  inputProps: PasswordRegistrationFormProps = {},
): ReactElement {
  const { t } = useTranslation();
  const {
    action: actionOverride,
    className,
    submitLabel = t('auth.createAccount', { defaultValue: 'Create account' }),
    pendingLabel = t('auth.creatingAccount', {
      defaultValue: 'Creating account…',
    }),
  } = inputProps;

  const [confirmation, setConfirmation] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const validationError = passwordMismatch
    ? t('auth.passwordMismatch', { defaultValue: "Passwords don't match." })
    : undefined;
  const defaultAction = usePasswordRegistration();
  const action = actionOverride ?? defaultAction;
  const errorMessage = validationError ?? action.error?.message;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (password !== confirmation) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    void action.submit({ email, name, password, username });
  };

  return (
    <form className={className ?? 'space-y-5'} onSubmit={handleSubmit}>
      <div className='space-y-2'>
        <Label htmlFor='name'>{t('auth.name', { defaultValue: 'Name' })}</Label>
        <Input
          id='name'
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='username'>
          {t('auth.username', { defaultValue: 'Username' })}
        </Label>
        <Input
          id='username'
          autoComplete='username'
          onChange={(event) => setUsername(event.target.value)}
          required
          value={username}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='register-email'>
          {t('auth.email', { defaultValue: 'Email' })}
        </Label>
        <Input
          id='register-email'
          autoComplete='email'
          onChange={(event) => setEmail(event.target.value)}
          required
          type='email'
          value={email}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='register-password'>
          {t('auth.password', { defaultValue: 'Password' })}
        </Label>
        <Input
          id='register-password'
          autoComplete='new-password'
          onChange={(event) => setPassword(event.target.value)}
          required
          type='password'
          value={password}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='confirm-password'>
          {t('auth.confirmPassword', { defaultValue: 'Confirm password' })}
        </Label>
        <Input
          id='confirm-password'
          autoComplete='new-password'
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type='password'
          value={confirmation}
        />
      </div>
      {errorMessage ? (
        <FormStatus type='error'>{errorMessage}</FormStatus>
      ) : null}
      <Button className='w-full' disabled={action.isPending} type='submit'>
        {action.isPending ? pendingLabel : submitLabel}
      </Button>
      <div className='pt-3 text-sm'>
        <p className='text-center text-muted-foreground'>
          {t('auth.existingAccount', {
            defaultValue: 'Already have an account?',
          })}{' '}
          <a
            className='font-semibold text-foreground underline underline-offset-4'
            href='login'
          >
            {t('auth.signIn', { defaultValue: 'Sign in' })}
          </a>
        </p>
      </div>
    </form>
  );
}
