import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';

import { PmKindIcon } from '../../../components/pm-kind-icon.js';
import { Button } from '../../../components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog.js';
import { useKindLabel } from '../../../lib/kinds.js';

export interface StartRequest {
  /** The kind of the executor the change hands the issue to (`agent`). */
  readonly kind: string;
  /** Who would start working. */
  readonly names: readonly string[];
  /** The issue, when it exists already. */
  readonly identifier?: string;
}

/**
 * "Start now?", before a change that hands an issue to an executor of another kind (an agent), as the old
 * NocoProject's `NpStartDialog` asked. "Start" and "Don't start now" both apply the change, the second with
 * `start: false`; closing the dialog drops the change.
 */
export function StartDialog({
  request,
  onDecide,
  onCancel,
}: {
  readonly request: StartRequest | null;
  readonly onDecide: (start: boolean) => void;
  readonly onCancel: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const kindLabel = useKindLabel();
  // The last request stays rendered while the dialog animates closed, so the text does not flicker.
  const [shown, setShown] = useState<StartRequest | null>(request);
  if (request && request !== shown) setShown(request);
  const kind = shown ? kindLabel(shown.kind) : '';

  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('start.title')}</DialogTitle>
          <DialogDescription>
            {shown?.identifier
              ? t('start.descriptionFor', {
                  identifier: shown.identifier,
                  kind,
                })
              : t('start.description', { kind })}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <p className='text-sm font-medium'>{t('start.workers', { kind })}</p>
          <ul className='space-y-1'>
            {(shown?.names ?? []).map((name) => (
              <li key={name} className='flex items-center gap-2 text-sm'>
                <PmKindIcon
                  kind={shown?.kind ?? ''}
                  className='size-4 text-muted-foreground'
                  aria-hidden='true'
                />
                {name}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onDecide(false)}>
            {t('start.later')}
          </Button>
          <Button onClick={() => onDecide(true)}>{t('start.start')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
