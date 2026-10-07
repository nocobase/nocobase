import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';

import type { Plan } from '../../../shared/plans.js';
import { PmTag } from '../../components/pm-tag.js';
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
import { flagsOf, riskyRows, rowViews, type RowView } from './model.js';
import { FLAG_TONE, rowTitle } from './plan-text.js';

type Asking =
  | {
      readonly kind: 'execute';
      readonly plan: Plan;
      readonly risky: readonly RowView[];
      readonly views: readonly RowView[];
      readonly run: () => void;
    }
  | { readonly kind: 'void'; readonly run: () => void };

export interface PlanConfirm {
  /**
   * Runs `run` to execute `plan`: at once, or after a second confirmation listing the rows that carry a risk flag
   * (they start a run, close an issue, change an owner, create a project or make an agent the executor).
   */
  execute(plan: Plan, run: () => void): void;
  /** Asks before voiding. */
  void(run: () => void): void;
  readonly dialog: ReactElement;
}

/** The second confirmations of plan actions, and the dialog that asks them. */
export function usePlanConfirm(): PlanConfirm {
  const { t } = useTranslation();
  const [asking, setAsking] = useState<Asking | null>(null);

  const dialog = (
    <AlertDialog
      open={asking !== null}
      onOpenChange={(open) => {
        if (!open) setAsking(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {asking?.kind === 'void'
              ? t('plans.voidTitle')
              : t('plans.executeTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {asking?.kind === 'void'
              ? t('plans.voidDescription')
              : t('plans.executeDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {asking?.kind === 'execute' ? (
          <ul className='space-y-1.5 text-sm' data-testid='plan-risky-rows'>
            {asking.risky.map((view) => (
              <li key={view.row.id} className='space-y-1'>
                <p className='wrap-anywhere'>
                  <span className='text-muted-foreground'>
                    {t(`plans.ops.${view.row.op}`)} ·{' '}
                  </span>
                  {rowTitle(view, asking.views, t)}
                </p>
                <p className='flex flex-wrap gap-1'>
                  {flagsOf(view).map((flag) => (
                    <PmTag key={flag} tone={FLAG_TONE[flag]}>
                      {t(`plans.flags.${flag}`)}
                    </PmTag>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant={asking?.kind === 'void' ? 'destructive' : 'default'}
            onClick={() => {
              const run = asking?.run;
              setAsking(null);
              run?.();
            }}
          >
            {asking?.kind === 'void' ? t('plans.void') : t('plans.execute')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    execute(plan, run) {
      const views = rowViews(plan.rows);
      const risky = riskyRows(views);
      if (risky.length === 0) run();
      else setAsking({ kind: 'execute', plan, risky, views, run });
    },
    void(run) {
      setAsking({ kind: 'void', run });
    },
    dialog,
  };
}
