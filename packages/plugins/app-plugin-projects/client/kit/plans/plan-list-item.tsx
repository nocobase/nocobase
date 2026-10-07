import { useTranslation } from '@nocobase/i18n/client';
import { ClipboardListIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link, type To } from 'react-router';

import type { Plan } from '../../../shared/plans.js';
import { usePmFormatters } from '../../lib/format.js';
import { cn } from 'cn';
import { planHref } from './model.js';
import { PlanStatusTag } from './plan-card.js';
import { usePlanSource, usePlanWording } from './plan-text.js';

export interface PlanListItemProps {
  readonly plan: Plan;
  /** Selects the plan instead of following the link to its page. */
  readonly onSelect?: (plan: Plan) => void;
  /** Where the link goes, such as the plan over the issue page it is listed on; the plan's own page by default. */
  readonly to?: To;
  readonly selected?: boolean;
  readonly className?: string;
}

/**
 * One plan in a list: its title, status, where it comes from, who proposed it and when. It links to the plan's page
 * (or `to`), or selects the plan when `onSelect` is given (a master–detail list).
 */
export function PlanListItem({
  plan,
  onSelect,
  to,
  selected = false,
  className,
}: PlanListItemProps): ReactElement {
  const { t } = useTranslation();
  const format = usePmFormatters();
  const source = usePlanSource();
  const { title } = usePlanWording()(plan);
  const body: ReactNode = (
    <>
      <ClipboardListIcon
        className='mt-0.5 size-4 shrink-0 text-muted-foreground'
        aria-hidden='true'
      />
      <span className='block min-w-0 flex-1 space-y-1'>
        <span className='block truncate text-sm font-medium'>{title}</span>
        <span className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
          <PlanStatusTag plan={plan} />
          <span>{source(plan)}</span>
          {plan.proposerName ? (
            <span>{t('plans.proposedBy', { name: plan.proposerName })}</span>
          ) : null}
          <time
            className='ml-auto shrink-0 tabular-nums'
            dateTime={plan.createdAt}
            title={format.dateTime(plan.createdAt)}
          >
            {format.relative(plan.createdAt)}
          </time>
        </span>
      </span>
    </>
  );
  const classes = cn(
    'flex w-full min-w-0 items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
    selected ? 'border-border bg-card shadow-xs' : 'hover:bg-accent/60',
    className,
  );
  return onSelect ? (
    <button
      type='button'
      aria-current={selected ? 'true' : undefined}
      className={classes}
      data-plan-id={plan.id}
      onClick={() => onSelect(plan)}
    >
      {body}
    </button>
  ) : (
    <Link
      to={to ?? planHref(plan.id)}
      className={classes}
      data-plan-id={plan.id}
    >
      {body}
    </Link>
  );
}
