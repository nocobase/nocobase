import { USERS_NAMESPACE } from '../../namespace.js';
import { ListRecoveryError } from '../../hooks/use-table-url-state.js';
import { ApiClientError } from '@nocobase/app-client';
import { Link } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';
import { Button } from '../../components/ui/button.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '../../components/ui/alert-dialog.js';

export function SettingsError({
  error,
  retry,
  inline = false,
}: {
  readonly error: unknown;
  readonly retry?: () => void;
  readonly inline?: boolean;
}): ReactElement | null {
  const { t } = useTranslation(USERS_NAMESPACE);
  if (!error) return null;
  const status: unknown =
    typeof error === 'object' && error !== null
      ? Reflect.get(error, 'status')
      : undefined;
  const content = (
    <>
      {error instanceof ListRecoveryError
        ? error.message
        : t(
            status === 400
              ? 'management.invalidRequest'
              : status === 401
                ? 'management.sessionEnded'
                : status === 403
                  ? 'management.denied'
                  : status === 404
                    ? 'management.missing'
                    : status === 409
                      ? error instanceof ApiClientError &&
                        error.reason === 'USER_IDENTITY_CONFLICT'
                        ? 'management.identityConflict'
                        : 'management.conflict'
                      : 'management.failed',
          )}
      {status === 401 && (
        <Button
          variant='outline'
          nativeButton={false}
          render={<Link to='/login' />}
        >
          {t('management.signInAgain')}
        </Button>
      )}
      {retry && ![400, 401, 403, 404, 409].includes(Number(status)) && (
        <Button variant='outline' size='sm' onClick={retry}>
          {t('management.retry')}
        </Button>
      )}
    </>
  );
  return inline ? (
    content
  ) : (
    <Alert variant='destructive'>
      <AlertDescription>{content}</AlertDescription>
    </Alert>
  );
}
export function SettingsLoading(): ReactElement {
  const { t } = useTranslation(USERS_NAMESPACE);
  return (
    <div aria-label={t('management.loading')} className='flex flex-col gap-3'>
      <Skeleton className='h-10 w-full' />
      <Skeleton className='h-20 w-full' />
      <Skeleton className='h-20 w-full' />
    </div>
  );
}
export function ConfirmAction({
  open,
  title,
  description,
  confirmLabel,
  error,
  busy,
  onCancel,
  onConfirm,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly description: ReactNode;
  readonly confirmLabel?: string;
  readonly error?: ReactNode;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}): ReactElement {
  const { t } = useTranslation(USERS_NAMESPACE);
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          {error}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t('management.cancel')}
          </AlertDialogCancel>
          <Button variant='destructive' disabled={busy} onClick={onConfirm}>
            {busy
              ? t('management.saving')
              : (confirmLabel ?? t('management.confirm'))}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
