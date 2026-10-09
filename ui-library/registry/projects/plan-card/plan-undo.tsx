/**
 * Undoing an executed plan in one step: the dialog first asks what undoing would do now (`usePlanUndoPreview`), lists
 * what will be reverted and what is left alone because someone changed it since, with why, and confirming undoes it
 * at once. Nothing else is created: there is no separate plan to execute afterwards.
 */
import {
  planErrorReason,
  usePlanErrorText,
  usePlanMutations,
  usePlanUndoPreview,
} from '@nocobase/app-plugin-projects/client/kit';
import { planObjectLabel } from '@nocobase/app-plugin-projects/client/plan-model';
import type {
  Plan,
  PlanUndoRevert,
} from '@nocobase/app-plugin-projects/shared/plans';
import { Undo2Icon } from 'lucide-react';
import type { ReactElement } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';

import {
  fieldLabel,
  usePlanCardText,
  usePlanNotify,
  type PlanCardKey,
} from './plan-text.js';

const UNDO_OPS: ReadonlySet<string> = new Set([
  'issue.retract',
  'comment.retract',
  'project.retract',
  'dependency',
]);

export interface PlanUndoDialogProps {
  readonly plan: Plan;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** With the plan, undone. */
  readonly onUndone?: (plan: Plan) => void;
}

export function PlanUndoDialog({
  plan,
  open,
  onOpenChange,
  onUndone,
}: PlanUndoDialogProps): ReactElement {
  const { t } = usePlanCardText();
  const errors = usePlanErrorText();
  const notify = usePlanNotify();
  const mutations = usePlanMutations();
  const preview = usePlanUndoPreview(plan.id, open);
  const revert = preview.data?.revert ?? [];
  const skipped = preview.data?.skipped ?? [];

  const what = (row: PlanUndoRevert): string => {
    const target = planObjectLabel(row.target) ?? t('planCard.unknownIssue');
    if (row.op === 'issue.update') {
      const fields = Object.keys(row.restore ?? {})
        .map((field) => fieldLabel(t, field))
        .join(t('planCard.undoPreview.separator'));
      return t('planCard.undoPreview.restore', { target, fields });
    }
    return UNDO_OPS.has(row.op)
      ? t(`planCard.undoPreview.ops.${row.op}` as PlanCardKey, { target })
      : target;
  };

  const confirm = () =>
    void mutations
      .undo(plan)
      .then((next) => {
        notify.success(t('planCard.undoDone'));
        onOpenChange(false);
        onUndone?.(next);
      })
      .catch((error: unknown) => {
        notify.error(error);
        if (planErrorReason(error) === 'UNDO_STALE') void preview.refetch();
        else onOpenChange(false);
      });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid='plan-undo-dialog'>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('planCard.undoPreview.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('planCard.undoPreview.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {preview.isPending && open ? (
          <div className='space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </div>
        ) : preview.isError ? (
          <p className='text-sm text-destructive'>
            {errors.request(preview.error, t('planCard.undoPreview.failed'))}
          </p>
        ) : (
          <div className='max-h-80 space-y-3 overflow-y-auto text-sm'>
            {revert.length > 0 ? (
              <section className='space-y-1'>
                <h3 className='font-medium'>
                  {t('planCard.undoPreview.revertTitle', {
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
                {t('planCard.undoPreview.nothing')}
              </p>
            )}
            {skipped.length > 0 ? (
              <section className='space-y-1'>
                <h3 className='font-medium'>
                  {t('planCard.undoPreview.skippedTitle', {
                    count: skipped.length,
                  })}
                </h3>
                <ul
                  className='list-disc space-y-0.5 pl-5 text-muted-foreground'
                  data-testid='plan-undo-skipped'
                >
                  {skipped.map((skip) => (
                    <li key={skip.rowId} className='wrap-anywhere'>
                      {t('planCard.undoPreview.skippedRow', {
                        position: skip.position + 1,
                        reason: t(`planCard.skipped.${skip.reason}`),
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
            {t('planCard.cancel')}
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
            {t('planCard.undoPreview.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
