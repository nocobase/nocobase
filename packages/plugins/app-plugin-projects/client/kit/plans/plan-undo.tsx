/**
 * Undoing an executed plan in one step: the dialog first asks the server what undoing would do now (`dryRun`), lists
 * what will be reverted and what is left alone because someone changed it since, with why, and confirming undoes it
 * at once. Nothing else is created: there is no separate plan to execute afterwards.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Undo2Icon } from 'lucide-react';
import type { ReactElement } from 'react';

import type { Plan, PlanUndoRevert } from '../../../shared/plans.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import { Spinner } from '../../components/ui/spinner.js';
import { useNotify } from '../../hooks/use-notify.js';
import { planObjectLabel as label } from './model.js';
import { usePlanMutations, usePlanUndoPreview } from './use-plan.js';

export function PlanUndoDialog({
  plan,
  open,
  onOpenChange,
  onUndone,
}: {
  readonly plan: Plan;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onUndone?: (plan: Plan) => void;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const mutations = usePlanMutations();
  const preview = usePlanUndoPreview(plan.id, open);
  const revert = preview.data?.revert ?? [];
  const skipped = preview.data?.skipped ?? [];

  const what = (row: PlanUndoRevert): string => {
    const target = label(row.target) ?? t('plans.unknownIssue');
    if (row.op === 'issue.update') {
      const fields = Object.keys(row.restore ?? {})
        .map((field) => t(`plans.fields.${field}`, { defaultValue: field }))
        .join(t('plans.undoPreview.separator'));
      return t('plans.undoPreview.restore', { target, fields });
    }
    return t(`plans.undoPreview.ops.${row.op}`, {
      target,
      defaultValue: target,
    });
  };

  const confirm = () =>
    void mutations
      .undo(plan)
      .then((next) => {
        notify.success(t('plans.undoDone'));
        onOpenChange(false);
        onUndone?.(next);
      })
      .catch((error: unknown) => {
        notify.error(error);
        if (error instanceof ApiClientError && error.reason === 'UNDO_STALE')
          void preview.refetch();
        else onOpenChange(false);
      });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid='plan-undo-dialog'>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('plans.undoPreview.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('plans.undoPreview.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {preview.isPending && open ? (
          <div className='space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </div>
        ) : preview.isError ? (
          <p className='text-sm text-destructive'>
            {preview.error instanceof ApiClientError
              ? t(`errors.${preview.error.reason ?? ''}`, {
                  defaultValue: preview.error.message,
                })
              : t('plans.undoPreview.failed')}
          </p>
        ) : (
          <div className='max-h-80 space-y-3 overflow-y-auto text-sm'>
            {revert.length > 0 ? (
              <section className='space-y-1'>
                <h3 className='font-medium'>
                  {t('plans.undoPreview.revertTitle', {
                    count: revert.length,
                  })}
                </h3>
                <ul
                  className='list-disc space-y-0.5 pl-5'
                  data-testid='plan-undo-revert'
                >
                  {revert.map((row) => (
                    <li
                      key={`${row.rowId}:${row.op}`}
                      className='wrap-anywhere'
                    >
                      {what(row)}
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className='text-muted-foreground'>
                {t('plans.undoPreview.nothing')}
              </p>
            )}
            {skipped.length > 0 ? (
              <section className='space-y-1'>
                <h3 className='font-medium'>
                  {t('plans.undoPreview.skippedTitle', {
                    count: skipped.length,
                  })}
                </h3>
                <ul
                  className='list-disc space-y-0.5 pl-5 text-muted-foreground'
                  data-testid='plan-undo-skipped'
                >
                  {skipped.map((skip) => (
                    <li key={skip.rowId} className='wrap-anywhere'>
                      {t('plans.undoPreview.skippedRow', {
                        position: skip.position + 1,
                        reason: t(`plans.skipped.${skip.reason}`),
                      })}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutations.busy}>
            {t('actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={
              mutations.busy || preview.isPending || revert.length === 0
            }
            data-testid='plan-undo-confirm'
            onClick={(event) => {
              // Stay open until the server answered.
              event.preventDefault();
              confirm();
            }}
          >
            {mutations.busy ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <Undo2Icon data-icon='inline-start' />
            )}
            {t('plans.undoPreview.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
