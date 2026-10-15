/** The session task panel, loaded the first time a task opens beside a conversation. */
import type { LinkPanelProps } from '@nocobase/app-plugin-agent-sessions/client';
import { lazy, Suspense, type ReactElement } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

const Panel = lazy(() => import('./session-task-panel.js'));

export function SessionTaskPanel(props: LinkPanelProps): ReactElement {
  return (
    <Suspense
      fallback={
        <div className='flex flex-col gap-3 p-6'>
          <Skeleton className='h-7 w-3/4' />
          <Skeleton className='h-24 w-full' />
        </div>
      }
    >
      <Panel {...props} />
    </Suspense>
  );
}
