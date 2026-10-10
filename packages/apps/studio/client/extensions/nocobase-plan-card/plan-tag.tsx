/**
 * The plan card's tags: a pill in one of the projects plugin's hues (`PlanTone`), and a plan's status as one.
 */
import {
  PLAN_STATUS_TONE,
  effectiveStatus,
  type PlanTone,
} from '@nocobase/app-plugin-projects/client/plan-model';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import type { ReactElement, ReactNode } from 'react';

import { cn } from 'cn';

import { usePlanCardText } from './plan-text.js';

/**
 * A pale tint of the hue behind a darker ink of it; in dark mode a dim wash and a lighter ink. Written out in full so
 * the application's Tailwind build finds every class.
 */
const TONE_CLASS: Readonly<Record<PlanTone, string>> = {
  grey: 'bg-[oklch(0.955_0.004_264)] text-[oklch(0.46_0.015_264)] dark:bg-[oklch(0.72_0.01_264/0.14)] dark:text-[oklch(0.8_0.01_264)]',
  blue: 'bg-[oklch(0.95_0.035_245)] text-[oklch(0.5_0.15_250)] dark:bg-[oklch(0.65_0.13_250/0.2)] dark:text-[oklch(0.8_0.1_250)]',
  violet:
    'bg-[oklch(0.95_0.035_295)] text-[oklch(0.5_0.17_295)] dark:bg-[oklch(0.65_0.14_295/0.2)] dark:text-[oklch(0.8_0.11_295)]',
  amber:
    'bg-[oklch(0.96_0.05_85)] text-[oklch(0.52_0.12_65)] dark:bg-[oklch(0.75_0.13_75/0.18)] dark:text-[oklch(0.84_0.12_80)]',
  green:
    'bg-[oklch(0.955_0.04_155)] text-[oklch(0.5_0.12_155)] dark:bg-[oklch(0.65_0.12_155/0.2)] dark:text-[oklch(0.8_0.12_155)]',
  slate:
    'bg-[oklch(0.935_0.008_264)] text-[oklch(0.42_0.02_264)] dark:bg-[oklch(0.6_0.02_264/0.2)] dark:text-[oklch(0.72_0.015_264)]',
  red: 'bg-[oklch(0.955_0.03_25)] text-[oklch(0.52_0.18_27)] dark:bg-[oklch(0.62_0.18_25/0.2)] dark:text-[oklch(0.78_0.13_25)]',
  orange:
    'bg-[oklch(0.955_0.045_60)] text-[oklch(0.55_0.15_50)] dark:bg-[oklch(0.7_0.15_55/0.2)] dark:text-[oklch(0.82_0.12_60)]',
};

export interface PlanTagProps {
  readonly tone: PlanTone;
  /** A dot of the ink before the text, as a status shows. */
  readonly dot?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

/** A small pill in one of the plan hues. */
export function PlanTag({
  tone,
  dot = false,
  className,
  children,
  ...rest
}: PlanTagProps & { readonly 'data-testid'?: string }): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0 text-xs leading-4 font-medium whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
      data-tone={tone}
      {...rest}
    >
      {dot ? (
        <span
          aria-hidden='true'
          className='size-1.5 shrink-0 rounded-full bg-current'
        />
      ) : null}
      {children}
    </span>
  );
}

/** The status tag of a plan (an open plan past its expiry reads as expired), with a voided plan's reason. */
export function PlanStatusTag({ plan }: { readonly plan: Plan }): ReactElement {
  const { t } = usePlanCardText();
  const status = effectiveStatus(plan);
  return (
    <PlanTag tone={PLAN_STATUS_TONE[status]} dot>
      {status === 'voided' && plan.voidReason === 'superseded'
        ? t('planCard.superseded')
        : t(`planCard.status.${status}`)}
    </PlanTag>
  );
}
