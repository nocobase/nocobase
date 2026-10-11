import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';

export interface AppStartupErrorProps {
  error: unknown;
}

export function AppStartupError({ error }: AppStartupErrorProps): ReactElement {
  const message =
    error instanceof Error ? error.message : 'Unknown startup error.';

  return (
    <main className='grid min-h-svh place-items-center px-6'>
      <section className='w-full max-w-lg space-y-4 text-center'>
        <h1 className='text-xl font-semibold'>Unable to start application</h1>
        <p className='text-sm text-muted-foreground'>{message}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </section>
    </main>
  );
}
