/** The profile page's forms: the viewer's name and username, and their password. */
import { useToaster } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useEffect, type ReactElement } from 'react';

import { studioKeys } from '../../access/api.js';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type ProfileValues = { name: string; username: string };
type PasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmation: string;
};

export function ProfileForm({
  user,
}: {
  readonly user: {
    id: string;
    name: string;
    username?: string | null;
    email: string;
  };
}): ReactElement {
  const { t } = useTranslation();
  const { client, refresh } = useAuthentication();
  const cache = useQueryClient();
  const toaster = useToaster();
  const form = useForm<ProfileValues>({
    mode: 'onTouched',
    defaultValues: { name: user.name, username: user.username ?? '' },
  });
  const { errors, isSubmitting } = form.formState;
  useEffect(() => {
    if (!isSubmitting && errors.username?.type === 'server')
      form.setFocus('username');
  }, [isSubmitting, errors.username, form]);
  const submit = form.handleSubmit(async (values) => {
    form.clearErrors();
    const input = {
      name: values.name.trim(),
      username: values.username.trim().toLowerCase(),
    };
    try {
      const result = await client.updateUser(input);
      if (result.error) {
        const code = result.error.code ?? '';
        if (
          code === 'USERNAME_IS_ALREADY_TAKEN' ||
          code === 'INVALID_USERNAME' ||
          code === 'USERNAME_TOO_SHORT' ||
          code === 'USERNAME_TOO_LONG'
        ) {
          form.setError(
            'username',
            {
              type: 'server',
              message: t(
                code === 'USERNAME_IS_ALREADY_TAKEN'
                  ? 'profile.usernameTaken'
                  : 'profile.usernameInvalid',
              ),
            },
            { shouldFocus: true },
          );
        } else {
          form.setError('root', {
            message: t(
              result.error.status === 401
                ? 'profile.signInAgain'
                : 'profile.saveFailed',
            ),
          });
        }
        return;
      }
    } catch {
      form.setError('root', { message: t('profile.saveFailed') });
      return;
    }
    form.reset(input);
    toaster.show({ type: 'success', title: t('profile.saved') });
    // A failed refresh must not misreport an already committed write as a failed save.
    try {
      await refresh();
      await cache.invalidateQueries({ queryKey: studioKeys.all });
      await cache.invalidateQueries({ queryKey: ['account-profile', user.id] });
    } catch {
      toaster.show({ type: 'error', title: t('profile.refreshFailed') });
    }
  });
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <fieldset disabled={isSubmitting} className='space-y-6'>
        {errors.root && (
          <Alert variant='destructive'>
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}
        <FieldGroup className='max-w-2xl'>
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor='profile-name'>
              {t('profile.name')} *
            </FieldLabel>
            <Input
              id='profile-name'
              autoComplete='name'
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'profile-name-error' : undefined}
              {...form.register('name', {
                validate: (value) =>
                  Boolean(value.trim()) || t('profile.nameRequired'),
              })}
            />
            <FieldDescription>
              {t('profile.detailsDescription')}
            </FieldDescription>
            {errors.name && (
              <FieldError id='profile-name-error'>
                {errors.name.message}
              </FieldError>
            )}
          </Field>
          <Field data-invalid={Boolean(errors.username)}>
            <FieldLabel htmlFor='profile-username'>
              {t('auth.username')} *
            </FieldLabel>
            <Input
              id='profile-username'
              autoComplete='username'
              aria-invalid={Boolean(errors.username)}
              aria-describedby={
                errors.username ? 'profile-username-error' : undefined
              }
              {...form.register('username', {
                validate: (value) =>
                  /^[a-zA-Z0-9_.]{3,30}$/.test(value.trim()) ||
                  t('profile.usernameInvalid'),
              })}
            />
            {errors.username && (
              <FieldError id='profile-username-error'>
                {errors.username.message}
              </FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor='profile-email'>{t('auth.email')}</FieldLabel>
            <Input
              id='profile-email'
              type='email'
              value={user.email}
              readOnly
            />
          </Field>
        </FieldGroup>
        <div className='flex justify-end'>
          <Button type='submit' disabled={isSubmitting}>
            {t(isSubmitting ? 'profile.saving' : 'profile.save')}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

export function PasswordForm(): ReactElement {
  const { t } = useTranslation();
  const { client, refresh } = useAuthentication();
  const toaster = useToaster();
  const form = useForm<PasswordValues>({
    mode: 'onTouched',
    defaultValues: { currentPassword: '', newPassword: '', confirmation: '' },
  });
  const { errors, isSubmitting } = form.formState;
  useEffect(() => {
    if (isSubmitting) return;
    if (errors.currentPassword?.type === 'server')
      form.setFocus('currentPassword');
    else if (errors.newPassword?.type === 'server')
      form.setFocus('newPassword');
  }, [isSubmitting, errors.currentPassword, errors.newPassword, form]);
  const submit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    form.clearErrors();
    try {
      const result = await client.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        const code = result.error.code;
        if (code === 'INVALID_PASSWORD') {
          form.setError(
            'currentPassword',
            { type: 'server', message: t('profile.wrongPassword') },
            { shouldFocus: true },
          );
        } else if (
          code === 'PASSWORD_TOO_SHORT' ||
          code === 'PASSWORD_TOO_LONG'
        ) {
          form.setError(
            'newPassword',
            {
              type: 'server',
              message: t(
                code === 'PASSWORD_TOO_SHORT'
                  ? 'profile.passwordTooShort'
                  : 'profile.passwordTooLong',
              ),
            },
            { shouldFocus: true },
          );
        } else {
          form.setError('root', {
            message: t(
              result.error.status === 401 || code === 'SESSION_EXPIRED'
                ? 'profile.signInAgain'
                : code === 'CREDENTIAL_ACCOUNT_NOT_FOUND'
                  ? 'profile.noPassword'
                  : 'profile.saveFailed',
            ),
          });
        }
        return;
      }
    } catch {
      form.setError('root', { message: t('profile.saveFailed') });
      return;
    }
    form.reset();
    toaster.show({ type: 'success', title: t('profile.passwordChanged') });
    try {
      await refresh();
    } catch {
      toaster.show({ type: 'error', title: t('profile.refreshFailed') });
    }
  });
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <fieldset disabled={isSubmitting} className='space-y-6'>
        {errors.root && (
          <Alert variant='destructive'>
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}
        <FieldGroup className='max-w-2xl'>
          <Field data-invalid={Boolean(errors.currentPassword)}>
            <FieldLabel htmlFor='profile-current-password'>
              {t('profile.currentPassword')} *
            </FieldLabel>
            <Input
              id='profile-current-password'
              type='password'
              autoComplete='current-password'
              aria-invalid={Boolean(errors.currentPassword)}
              aria-describedby={
                errors.currentPassword ? 'profile-current-error' : undefined
              }
              {...form.register('currentPassword', {
                required: t('profile.passwordRequired'),
              })}
            />
            {errors.currentPassword && (
              <FieldError id='profile-current-error'>
                {errors.currentPassword.message}
              </FieldError>
            )}
          </Field>
          <Field data-invalid={Boolean(errors.newPassword)}>
            <FieldLabel htmlFor='profile-new-password'>
              {t('auth.newPassword')} *
            </FieldLabel>
            <Input
              id='profile-new-password'
              type='password'
              autoComplete='new-password'
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={
                errors.newPassword ? 'profile-new-error' : undefined
              }
              {...form.register('newPassword', {
                required: t('profile.passwordRequired'),
                deps: ['confirmation'],
              })}
            />
            <FieldDescription>
              {t('profile.passwordDescription')}
            </FieldDescription>
            {errors.newPassword && (
              <FieldError id='profile-new-error'>
                {errors.newPassword.message}
              </FieldError>
            )}
          </Field>
          <Field data-invalid={Boolean(errors.confirmation)}>
            <FieldLabel htmlFor='profile-confirm-password'>
              {t('auth.confirmNewPassword')} *
            </FieldLabel>
            <Input
              id='profile-confirm-password'
              type='password'
              autoComplete='new-password'
              aria-invalid={Boolean(errors.confirmation)}
              aria-describedby={
                errors.confirmation ? 'profile-confirm-error' : undefined
              }
              {...form.register('confirmation', {
                required: t('profile.passwordRequired'),
                validate: (value) =>
                  value === form.getValues('newPassword') ||
                  t('auth.passwordMismatch'),
              })}
            />
            {errors.confirmation && (
              <FieldError id='profile-confirm-error'>
                {errors.confirmation.message}
              </FieldError>
            )}
          </Field>
        </FieldGroup>
        <div className='flex justify-end'>
          <Button variant='outline' type='submit' disabled={isSubmitting}>
            {t(isSubmitting ? 'profile.saving' : 'profile.changePassword')}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
