import { ListRecoveryError } from '#hooks/use-table-url-state';
import { ApiClientError } from '@nocobase/app-client';
import { Link } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Skeleton } from '#components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';

export function SettingsError({
  error,
  retry,
  inline = false,
}: {
  readonly error: unknown;
  readonly retry?: () => void;
  readonly inline?: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
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
              ? 'settings.invalidRequest'
              : status === 401
                ? 'settings.sessionEnded'
                : status === 403
                  ? 'settings.denied'
                  : status === 404
                    ? 'settings.missing'
                    : status === 409
                      ? error instanceof ApiClientError &&
                        error.reason === 'USER_IDENTITY_CONFLICT'
                        ? 'settings.identityConflict'
                        : 'settings.conflict'
                      : 'settings.failed',
          )}
      {status === 401 && (
        <Button
          variant='outline'
          nativeButton={false}
          render={<Link to='/login' />}
        >
          {t('settings.signInAgain')}
        </Button>
      )}
      {retry && ![400, 401, 403, 404, 409].includes(Number(status)) && (
        <Button variant='outline' size='sm' onClick={retry}>
          {t('settings.retry')}
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
  const { t } = useTranslation();
  return (
    <div aria-label={t('settings.loading')} className='flex flex-col gap-3'>
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
  const { t } = useTranslation();
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
            {t('settings.cancel')}
          </AlertDialogCancel>
          <Button variant='destructive' disabled={busy} onClick={onConfirm}>
            {busy
              ? t('settings.saving')
              : (confirmLabel ?? t('settings.confirm'))}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
