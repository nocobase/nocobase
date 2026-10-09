import { useTranslation } from '@nocobase/i18n/client';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import type { ReactElement } from 'react';

import { Badge } from '#components/ui/badge';
import { cn } from 'cn';

import type { ApprovalBranch, ApprovalStepState } from './types.js';
import { useApprovalUi } from './use-approval-ui.js';

const FINISHED: ReadonlySet<ApprovalStepState> = new Set([
  'done',
  'ended',
  'skipped',
]);

const DOT_CLASSES: Readonly<Record<ApprovalStepState, string>> = {
  done: 'bg-primary',
  current: 'bg-primary/40 ring-2 ring-primary/30',
  rejected: 'bg-destructive',
  returned: 'bg-foreground/40',
  ended: 'bg-muted-foreground/40',
  upcoming: 'border border-dashed border-muted-foreground bg-transparent',
  skipped: 'bg-muted-foreground/40',
};

export interface ApprovalBranchesProps {
  readonly branches: readonly ApprovalBranch[];
  /** Opens a branch on its own, when the page can show it. */
  readonly onOpen?: (key: string) => void;
  readonly className?: string;
}

/**
 * A request split into parallel parts, seen as a whole: how many of the
 * parts the request waits for are finished, and for each part who has it
 * now, the step it is at, and whether it is the one holding things up.
 */
export function ApprovalBranches({
  branches,
  onOpen,
  className,
}: ApprovalBranchesProps): ReactElement {
  const { t } = useTranslation();
  const ui = useApprovalUi();
  const required = branches.filter((branch) => branch.required !== false);
  const finished = required.filter((branch) => FINISHED.has(branch.state));
  const percent = required.length
    ? Math.round((finished.length / required.length) * 100)
    : 100;
  return (
    <div className={cn('space-y-3', className)}>
      <div className='space-y-1.5'>
        <div className='flex items-baseline justify-between gap-2 text-xs text-muted-foreground'>
          <span className='font-medium text-foreground tabular-nums'>
            {t('approvalUi.branches.done', {
              count: finished.length,
              total: required.length,
              defaultValue: '{{count}} of {{total}} finished',
            })}
          </span>
          <span className='tabular-nums'>{percent}%</span>
        </div>
        <div
          role='progressbar'
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className='h-1.5 overflow-hidden rounded-full bg-muted'
        >
          <span
            className='block h-full bg-primary transition-[width]'
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <ul className='grid gap-2 sm:grid-cols-2'>
        {branches.map((branch) => {
          const body = (
            <>
              <div className='flex min-w-0 items-center gap-2'>
                <span
                  aria-hidden='true'
                  className={cn(
                    'size-2.5 shrink-0 rounded-full',
                    DOT_CLASSES[branch.state],
                  )}
                />
                <span className='truncate text-sm font-medium'>
                  {branch.title}
                </span>
                {branch.required === false ? (
                  <span className='text-xs text-muted-foreground'>
                    {t('approvalUi.preview.optional', {
                      defaultValue: 'Optional',
                    })}
                  </span>
                ) : null}
                <span className='ml-auto flex shrink-0 items-center gap-1'>
                  {branch.badge ? (
                    <Badge variant={branch.badge.variant ?? 'outline'}>
                      {branch.badge.label}
                    </Badge>
                  ) : null}
                  {onOpen ? (
                    <ChevronRight className='size-4 text-muted-foreground' />
                  ) : null}
                </span>
              </div>
              {branch.step || branch.ownerIds.length ? (
                <div className='flex flex-wrap items-center gap-x-2 gap-y-1 pl-4.5 text-xs text-muted-foreground'>
                  {branch.step ? <span>{branch.step}</span> : null}
                  {branch.ownerIds.map((id) => (
                    <span key={id} className='inline-flex items-center gap-1'>
                      {ui.renderAvatar(id)}
                      <span className='text-foreground'>
                        {ui.personName(id)}
                      </span>
                    </span>
                  ))}
                </div>
              ) : null}
              {branch.blocked ? (
                <div className='flex items-center gap-1 pl-4.5 text-xs font-medium text-destructive'>
                  <TriangleAlert className='size-3' />
                  {t('approvalUi.branches.blocked', {
                    defaultValue: 'Holding the request up',
                  })}
                </div>
              ) : null}
              {branch.note ? (
                <div className='pl-4.5 text-xs text-muted-foreground'>
                  {branch.note}
                </div>
              ) : null}
            </>
          );
          const frame = cn(
            'flex w-full flex-col gap-1.5 rounded-lg border p-3 text-left',
            branch.blocked && 'border-destructive/50 bg-destructive/5',
          );
          return (
            <li key={branch.key}>
              {onOpen ? (
                <button
                  type='button'
                  onClick={() => onOpen(branch.key)}
                  className={cn(frame, 'transition-colors hover:bg-muted/50')}
                >
                  {body}
                </button>
              ) : (
                <div className={frame}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
