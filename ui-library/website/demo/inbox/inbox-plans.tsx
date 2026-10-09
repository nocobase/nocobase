import { ClipboardListIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '#components/ui/button';
import { InboxDetailHeader } from '#extensions/nocobase-inbox/inbox-detail';
import { cn } from 'cn';

import { demoPlans } from './inbox-data.js';

export function DemoPlanGroup({
  selectedId,
  onSelect,
}: {
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}): ReactElement {
  return (
    <section aria-label='Plans' className='flex flex-col gap-1'>
      <h3 className='px-2 text-xs font-medium text-muted-foreground'>Plans</h3>
      <ul className='flex flex-col gap-0.5'>
        {demoPlans.map((plan) => (
          <li key={plan.id}>
            <button
              type='button'
              aria-current={plan.id === selectedId ? 'true' : undefined}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted',
                plan.id === selectedId && 'bg-muted',
              )}
              onClick={() => onSelect(plan.id)}
            >
              <ClipboardListIcon className='size-4 shrink-0 text-amber-600 dark:text-amber-400' />
              <span className='truncate'>{plan.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A plan in the detail pane, under the same header as every inbox item: the title opens it, its decision under it. */
export function DemoPlanDetail({
  id,
  onBack,
}: {
  readonly id: string | null;
  readonly onBack: () => void;
}): ReactElement {
  const [decided, setDecided] = useState<string | null>(null);
  const plan = demoPlans.find((candidate) => candidate.id === id);
  if (!plan)
    return (
      <p className='flex h-full items-center justify-center p-6 text-sm text-muted-foreground'>
        Select a plan to see its changes
      </p>
    );
  return (
    <article
      className='flex min-h-full flex-col'
      aria-labelledby='demo-plan-title'
    >
      <InboxDetailHeader
        titleId='demo-plan-title'
        icon={
          <ClipboardListIcon className='size-4 shrink-0 text-muted-foreground' />
        }
        kind='Plan'
        status={decided ?? undefined}
        title={plan.title}
        href={`/plans/${plan.id}`}
        openLabel='Open plan'
        meta={
          <>
            <span>{`${plan.rows.length} changes`}</span>
            <span>{`Proposed by ${plan.proposer}`}</span>
          </>
        }
        actions={
          decided ? null : (
            <>
              <Button onClick={() => setDecided('Executed')}>Execute</Button>
              <Button variant='outline'>Edit</Button>
              <Button variant='outline' onClick={() => setDecided('Voided')}>
                Void
              </Button>
            </>
          )
        }
        onBack={onBack}
        backLabel='Back to the list'
      />
      <ol className='flex flex-col gap-2 p-5 text-sm md:px-6'>
        {plan.rows.map((row) => (
          <li key={row} className='rounded-lg border bg-card px-3 py-2'>
            {row}
          </li>
        ))}
      </ol>
    </article>
  );
}
