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
import type { Executor } from '../../../../shared/issues.js';
import { PmExecutorToolStatus } from '../../../components/pm-executor-tool-status.js';
import { useExecutorTools } from '../../../hooks/use-executor-tools.js';
import { PmExecutorToolSelect } from '../../../components/pm-executor-tool-select.js';

export interface StartRequest {
  readonly executor?: Executor;
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
  readonly onDecide: (start: boolean, executor?: Executor) => void;
  readonly onCancel: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const kindLabel = useKindLabel();
  // The last request stays rendered while the dialog animates closed, so the text does not flicker.
  const [shown, setShown] = useState<StartRequest | null>(request);
  const [previous, setPrevious] = useState(request);
  if (request && request !== previous) {
    setPrevious(request);
    setShown(request);
  }
  const kind = shown ? kindLabel(shown.kind) : '';
  const toolState = useExecutorTools(shown?.executor ?? null);
  function decide(start: boolean): void {
    if (shown?.executor) onDecide(start, shown.executor);
    else onDecide(start);
  }

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
                {shown?.executor?.tool
                  ? ` · ${toolState.selected?.name ?? shown.executor.tool}`
                  : null}
              </li>
            ))}
          </ul>
          {shown?.executor ? (
            <>
              <PmExecutorToolSelect
                executor={shown.executor}
                onChange={(executor) => setShown({ ...shown, executor })}
              />
              <PmExecutorToolStatus executor={shown.executor} />
            </>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => decide(false)}>
            {t('start.later')}
          </Button>
          <Button onClick={() => decide(true)}>{t('start.start')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
