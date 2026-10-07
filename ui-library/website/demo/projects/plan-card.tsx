import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';

import { PlanCard } from '@/extensions/nocobase-plan-card/plan-card';

/**
 * Operation plans as an application shows them, read and acted on through the projects plugin's hooks (answered from
 * memory in this preview): one waiting for the viewer, with risky rows that ask again before executing and an Edit
 * button that opens the editor; one executed that can still be undone; and one whose execution failed.
 */
export function PlanCardDemo(): ReactElement {
  return (
    <MemoryRouter>
      <div className='min-h-svh bg-background p-6 text-foreground'>
        <div className='mx-auto max-w-3xl space-y-6'>
          <section className='space-y-2'>
            <h2 className='text-sm font-medium text-muted-foreground'>
              Waiting for you
            </h2>
            <PlanCard planId='plan-pending' />
          </section>
          <section className='space-y-2'>
            <h2 className='text-sm font-medium text-muted-foreground'>
              Executed, can be undone
            </h2>
            <PlanCard planId='plan-executed' />
          </section>
          <section className='space-y-2'>
            <h2 className='text-sm font-medium text-muted-foreground'>
              Failed
            </h2>
            <PlanCard planId='plan-failed' />
          </section>
        </div>
      </div>
    </MemoryRouter>
  );
}
