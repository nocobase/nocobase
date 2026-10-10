import { useTranslation } from '@nocobase/i18n/client';
import { AlertTriangleIcon } from 'lucide-react';
import { useRef, type ReactElement } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Confirms that the existing repository key will stop authenticating CI immediately. */
export function CiKeyReplacementDialog({
  open,
  lastUsedAt,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  readonly open: boolean;
  readonly lastUsedAt: string | null;
  readonly isPending: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => Promise<unknown>;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const submittingRef = useRef(false);
  const confirm = async () => {
    if (isPending || submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // The caller reports the error; keep the dialog open so they can retry.
    } finally {
      submittingRef.current = false;
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('ciSetup.key.confirmReplacement.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('ciSetup.key.confirmReplacement.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {lastUsedAt ? (
          <p className='text-sm text-muted-foreground'>
            {t('ciSetup.key.confirmReplacement.lastUsed', {
              date: new Date(lastUsedAt).toLocaleString(i18n.language),
            })}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t('ciSetup.key.confirmReplacement.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={isPending}
            onClick={() => void confirm()}
          >
            <AlertTriangleIcon data-icon='inline-start' />
            {t('ciSetup.key.confirmReplacement.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
