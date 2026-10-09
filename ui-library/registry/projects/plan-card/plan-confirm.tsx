/** The second confirmations of plan actions, and the dialog that asks them. */
import { usePlanRowTitle } from '@nocobase/app-plugin-projects/client/kit';
import {
  PLAN_FLAG_TONE,
  flagsOf,
  riskyRows,
  rowViews,
  type RowView,
} from '@nocobase/app-plugin-projects/client/plan-model';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import { useState, type ReactElement } from 'react';

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

import { PlanTag } from './plan-tag.js';
import { usePlanCardText } from './plan-text.js';

type Asking =
  | {
      readonly kind: 'execute';
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
  /** The dialog; render it once beside the buttons. */
  readonly dialog: ReactElement;
}

export function usePlanConfirm(): PlanConfirm {
  const { t } = usePlanCardText();
  const rowTitle = usePlanRowTitle();
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
              ? t('planCard.voidTitle')
              : t('planCard.executeTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {asking?.kind === 'void'
              ? t('planCard.voidDescription')
              : t('planCard.executeDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {asking?.kind === 'execute' ? (
          <ul className='space-y-1.5 text-sm' data-testid='plan-risky-rows'>
            {asking.risky.map((view) => (
              <li key={view.row.id} className='space-y-1'>
                <p className='wrap-anywhere'>
                  <span className='text-muted-foreground'>
                    {t(`planCard.ops.${view.row.op}`)} ·{' '}
                  </span>
                  {rowTitle(view, asking.views)}
                </p>
                <p className='flex flex-wrap gap-1'>
                  {flagsOf(view).map((flag) => (
                    <PlanTag key={flag} tone={PLAN_FLAG_TONE[flag]}>
                      {t(`planCard.flags.${flag}`)}
                    </PlanTag>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{t('planCard.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant={asking?.kind === 'void' ? 'destructive' : 'default'}
            onClick={() => {
              const run = asking?.run;
              setAsking(null);
              run?.();
            }}
          >
            {asking?.kind === 'void'
              ? t('planCard.void')
              : t('planCard.execute')}
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
      else setAsking({ kind: 'execute', risky, views, run });
    },
    void(run) {
      setAsking({ kind: 'void', run });
    },
    dialog,
  };
}
