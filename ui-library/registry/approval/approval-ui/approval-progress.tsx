import { useTranslation } from '@nocobase/i18n/client';
import { Check, Circle, CircleDot, Clock, Minus, Undo2, X } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { Badge } from '#components/ui/badge';
import { cn } from 'cn';

import type {
  ApprovalCopy,
  ApprovalStep,
  ApprovalStepState,
  ApprovalStepTask,
  ApprovalTally,
  ApprovalTallyTone,
} from './types.js';
import { useApprovalUi } from './use-approval-ui.js';

const STEP_ICONS: Readonly<Record<ApprovalStepState, ReactNode>> = {
  done: <Check className='size-3.5' />,
  current: <CircleDot className='size-3.5' />,
  rejected: <X className='size-3.5' />,
  returned: <Undo2 className='size-3.5' />,
  ended: <Minus className='size-3.5' />,
  upcoming: <Circle className='size-3' />,
  skipped: <Minus className='size-3.5' />,
};

const STEP_CLASSES: Readonly<Record<ApprovalStepState, string>> = {
  done: 'border-primary bg-primary text-primary-foreground',
  current: 'border-primary bg-background text-primary ring-3 ring-primary/20',
  rejected: 'border-destructive bg-destructive/10 text-destructive',
  returned: 'border-foreground/40 bg-muted text-foreground',
  ended: 'border-border bg-muted text-muted-foreground',
  upcoming: 'border-dashed border-border bg-background text-muted-foreground',
  skipped: 'border-border bg-background text-muted-foreground',
};

/** The word beside a step's title; a step done or ahead needs none. */
const STEP_WORDS: Readonly<Record<ApprovalStepState, string>> = {
  done: '',
  upcoming: '',
  current: 'in progress',
  rejected: 'rejected',
  returned: 'returned',
  ended: 'ended',
  skipped: 'skipped',
};

function TaskLine({ task }: { readonly task: ApprovalStepTask }): ReactElement {
  const ui = useApprovalUi();
  return (
    <li className='flex flex-wrap items-center gap-x-2 gap-y-1'>
      {ui.renderAvatar(task.personId)}
      <span className='text-sm'>{ui.personName(task.personId)}</span>
      {task.badges.map((badge) => (
        <Badge key={badge.label} variant={badge.variant ?? 'outline'}>
          {badge.label}
        </Badge>
      ))}
      {task.due ? (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs text-muted-foreground',
            task.due.overdue && 'font-medium text-destructive',
          )}
        >
          <Clock className='size-3' />
          {task.due.label}
        </span>
      ) : null}
      {task.notes?.map((note) => (
        <span key={note} className='text-xs text-muted-foreground'>
          {note}
        </span>
      ))}
      {task.comment ? (
        <span className='w-full text-xs text-muted-foreground'>
          “{task.comment}”
        </span>
      ) : null}
    </li>
  );
}

const TALLY_CLASSES: Readonly<Record<ApprovalTallyTone, string>> = {
  positive: 'bg-primary',
  negative: 'bg-destructive',
  neutral: 'bg-muted-foreground/40',
};

/**
 * A count of answers against everyone who has a say: a bar split by kind
 * of answer, a mark where the step is carried, and the rules in words.
 */
function TallyBar({ tally }: { readonly tally: ApprovalTally }): ReactElement {
  const { t } = useTranslation();
  const answered = tally.counts.reduce((sum, each) => sum + each.count, 0);
  const total = Math.max(tally.total, answered, 1);
  return (
    <div className='space-y-1.5'>
      <div
        role='img'
        aria-label={t('approvalUi.progress.tally.answered', {
          count: answered,
          total: tally.total,
          defaultValue: '{{count}} of {{total}} answered',
        })}
        className='relative flex h-1.5 w-full max-w-72 overflow-hidden rounded-full bg-muted'
      >
        {tally.counts.map((each) =>
          each.count ? (
            <span
              key={each.key}
              className={TALLY_CLASSES[each.tone]}
              style={{ width: `${(each.count / total) * 100}%` }}
            />
          ) : null,
        )}
        {tally.needed ? (
          <span
            aria-hidden='true'
            className='absolute inset-y-0 w-0.5 bg-foreground'
            style={{
              left: `calc(${(Math.min(tally.needed, total) / total) * 100}% - 1px)`,
            }}
          />
        ) : null}
      </div>
      <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
        <span className='font-medium text-foreground tabular-nums'>
          {t('approvalUi.progress.tally.answered', {
            count: answered,
            total: tally.total,
            defaultValue: '{{count}} of {{total}} answered',
          })}
        </span>
        {tally.counts.map((each) => (
          <span key={each.key} className='inline-flex items-center gap-1'>
            <span
              aria-hidden='true'
              className={cn('size-2 rounded-full', TALLY_CLASSES[each.tone])}
            />
            {each.label}
            <span className='tabular-nums'>{each.count}</span>
          </span>
        ))}
        {tally.needed ? (
          <span>
            {t('approvalUi.progress.tally.needed', {
              count: tally.needed,
              defaultValue: '{{count}} needed to pass',
            })}
          </span>
        ) : null}
      </div>
      {tally.rules?.length ? (
        <ul className='flex flex-wrap gap-1.5'>
          {tally.rules.map((rule) => (
            <li
              key={rule}
              className='rounded-md border px-1.5 py-0.5 text-xs text-muted-foreground'
            >
              {rule}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export interface ApprovalProgressProps {
  /** Every stage the request went through, the one it is in, then the ones ahead. */
  readonly steps: readonly ApprovalStep[];
  /** Whom it was copied to, listed apart from the decisions. */
  readonly copies?: readonly ApprovalCopy[];
  /** Something to say above the steps, such as why nobody can act on the request. */
  readonly notice?: ReactNode;
  readonly className?: string;
}

/**
 * Where a request stands: each stage with who decides it and what they
 * answered, the stage it waits in, the ones still ahead, then whom it was
 * copied to. States read by icon as well as colour.
 */
export function ApprovalProgress({
  steps,
  copies = [],
  notice,
  className,
}: ApprovalProgressProps): ReactElement {
  const { t } = useTranslation();
  const ui = useApprovalUi();
  if (!steps.length)
    return (
      <div className={cn('space-y-3', className)}>
        {notice}
        <p className='text-sm text-muted-foreground'>
          {t('approvalUi.progress.empty', {
            defaultValue: 'No approval has started yet.',
          })}
        </p>
      </div>
    );
  return (
    <div className={cn('space-y-4', className)}>
      {notice}
      <ol>
        {steps.map((step, index) => (
          <li
            key={step.key}
            className='relative flex gap-3 pb-4 last:pb-0'
            aria-current={step.state === 'current' ? 'step' : undefined}
          >
            {index < steps.length - 1 ? (
              <span
                aria-hidden='true'
                className={cn(
                  'absolute top-6 bottom-0 left-2.5 w-px -translate-x-1/2 bg-border',
                  steps[index + 1]?.state === 'upcoming' &&
                    'border-l border-dashed bg-transparent',
                )}
              />
            ) : null}
            <span
              aria-hidden='true'
              className={cn(
                'relative z-10 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border',
                STEP_CLASSES[step.state],
              )}
            >
              {STEP_ICONS[step.state]}
            </span>
            <div className='min-w-0 flex-1 space-y-2'>
              <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
                <span
                  className={cn(
                    'text-sm font-medium',
                    (step.state === 'upcoming' || step.state === 'skipped') &&
                      'font-normal text-muted-foreground',
                    step.state === 'skipped' && 'line-through',
                  )}
                >
                  {step.title}
                </span>
                {STEP_WORDS[step.state] ? (
                  <span className='text-xs text-muted-foreground'>
                    {t(`approvalUi.progress.step.${step.state}`, {
                      defaultValue: STEP_WORDS[step.state],
                    })}
                  </span>
                ) : null}
                {step.policy ? (
                  <span className='text-xs text-muted-foreground'>
                    {step.policy}
                  </span>
                ) : null}
                {step.at ? (
                  <time
                    dateTime={step.at}
                    className='ml-auto text-xs text-muted-foreground'
                  >
                    {ui.formatDateTime(step.at)}
                  </time>
                ) : null}
              </div>
              {step.because ? (
                <p className='text-xs text-muted-foreground'>{step.because}</p>
              ) : null}
              {step.tally ? <TallyBar tally={step.tally} /> : null}
              {step.tasks.length ? (
                <ul className='space-y-1.5'>
                  {step.tasks.map((task) => (
                    <TaskLine key={task.key} task={task} />
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {copies.length ? (
        <div className='flex flex-wrap items-center gap-2 border-t pt-3 text-xs text-muted-foreground'>
          {t('approvalUi.progress.copies', { defaultValue: 'Copied to' })}
          {copies.map((copy) => (
            <span key={copy.key} className='inline-flex items-center gap-1'>
              {ui.renderAvatar(copy.personId)}
              <span className='text-foreground'>
                {ui.personName(copy.personId)}
              </span>
              <Badge variant={copy.read ? 'secondary' : 'outline'}>
                {copy.read
                  ? t('approvalUi.progress.read', { defaultValue: 'read' })
                  : t('approvalUi.progress.unread', { defaultValue: 'unread' })}
              </Badge>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
