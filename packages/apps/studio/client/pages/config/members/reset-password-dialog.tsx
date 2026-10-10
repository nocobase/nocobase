import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { UsersClient } from '@nocobase/app-plugin-users/client/user-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { KeyRoundIcon } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { RouteDialog } from '@/components/route-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { PasswordInput } from '@/extensions/nocobase-auth-forms/password-input';
import { useNotify } from '../../../access/notify.js';
import { studioKeys, useStudioApi } from '../../../access/api.js';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';

export default function ResetPasswordDialog(): ReactElement {
  const { t } = useTranslation();
  const { userId = '' } = useParams();
  const navigate = useNavigate();
  const api = useStudioApi();
  const viewer = useViewer();
  const notify = useNotify();
  const client = useApiClient();
  const users = useMemo(() => new UsersClient(client), [client]);
  const members = useQuery({
    queryKey: studioKeys.members,
    queryFn: () => api.members(),
  });
  const member = members.data?.find((item) => item.userId === userId);
  const access = useCan({
    resource: { type: 'user', id: userId },
    action: 'reset-password',
  });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [failure, setFailure] = useState('');
  const [passwordFailure, setPasswordFailure] = useState('');
  const [confirmFailure, setConfirmFailure] = useState('');
  const [pending, setPending] = useState(false);
  const own = viewer?.userId === userId;
  const close = () => navigate('/config/members', { replace: true });
  const beforeClose = () => !pending;

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setFailure('');
    setPasswordFailure('');
    setConfirmFailure('');
    if (!password) {
      setPasswordFailure(t('auth.passwordRequired'));
      return;
    }
    if (password !== confirm) {
      setConfirmFailure(t('auth.passwordMismatch'));
      return;
    }
    setPending(true);
    try {
      await users.resetPassword(userId, password);
      notify.success(
        t('members.passwordResetSuccess', { name: member?.name ?? '' }),
      );
      setPassword('');
      setConfirm('');
      await close();
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        ['PASSWORD_TOO_SHORT', 'PASSWORD_TOO_LONG'].includes(error.reason ?? '')
      ) {
        setPasswordFailure(
          t(
            error.reason === 'PASSWORD_TOO_SHORT'
              ? 'profile.passwordTooShort'
              : 'profile.passwordTooLong',
          ),
        );
      } else if (error instanceof ApiClientError && error.status === 403) {
        setFailure(t('common.forbidden'));
      } else if (error instanceof ApiClientError && error.status === 404) {
        setFailure(t('members.memberNotFound'));
      } else {
        setFailure(t('common.requestFailed'));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <RouteDialog
      title={t('members.resetPassword')}
      description={
        member ? `${member.name} · ${member.email ?? ''}` : undefined
      }
      className='sm:max-w-md'
      closeTo='/config/members'
      beforeClose={beforeClose}
      footer={
        <>
          <Button
            variant='outline'
            disabled={pending}
            onClick={() => void close()}
          >
            {t('common.cancel')}
          </Button>
          <Button
            form='reset-member-password'
            type='submit'
            disabled={pending || !access.can || !member}
          >
            {pending
              ? t('members.resettingPassword')
              : t('members.resetPassword')}
          </Button>
        </>
      }
    >
      {own ? (
        <div className='text-sm'>
          {t('members.changeOwnPasswordInstead')}{' '}
          <Link to='/account' className='underline'>
            {t('members.accountLink')}
          </Link>
        </div>
      ) : !access.can ? (
        <div className='text-sm text-muted-foreground'>
          {access.isPending ? t('status.loading') : t('status.denied')}
        </div>
      ) : member ? (
        <form
          id='reset-member-password'
          onSubmit={(event) => void submit(event)}
          className='space-y-4'
        >
          <Alert>
            <KeyRoundIcon />
            <AlertDescription>
              {t('members.resetPasswordSessionsNotice')}
            </AlertDescription>
          </Alert>
          {failure ? (
            <Alert variant='destructive'>
              <AlertDescription>{failure}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <Field data-invalid={passwordFailure ? true : undefined}>
              <FieldLabel htmlFor='member-new-password'>
                {t('auth.newPassword')}
              </FieldLabel>
              <PasswordInput
                id='member-new-password'
                autoComplete='new-password'
                showLabel={t('auth.showPassword')}
                hideLabel={t('auth.hidePassword')}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {passwordFailure ? (
                <FieldError>{passwordFailure}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={confirmFailure ? true : undefined}>
              <FieldLabel htmlFor='member-confirm-password'>
                {t('auth.confirmNewPassword')}
              </FieldLabel>
              <PasswordInput
                id='member-confirm-password'
                autoComplete='new-password'
                showLabel={t('auth.showPassword')}
                hideLabel={t('auth.hidePassword')}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
              {confirmFailure ? (
                <FieldError>{confirmFailure}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
        </form>
      ) : members.isSuccess ? (
        <div className='text-sm text-muted-foreground'>
          {t('members.memberNotFound')}
        </div>
      ) : (
        <div className='text-sm text-muted-foreground'>
          {members.isError ? t('members.loadFailed') : t('status.loading')}
        </div>
      )}
    </RouteDialog>
  );
}
