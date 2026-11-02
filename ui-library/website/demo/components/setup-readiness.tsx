import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { Button } from '#components/ui/button';
import {
  SetupReadiness,
  type SetupReadinessLabels,
} from '#components/setup-readiness';
import { useSetupReadiness } from '#components/setup-readiness-state';

const labels: SetupReadinessLabels = {
  title: 'Feature prerequisites',
  checking: 'Checking current configuration…',
  checkAgain: 'Check again',
  ready: 'The checked prerequisites are ready.',
  missing: 'Review the configuration items below.',
  unknown: {
    unavailable: 'Unable to check right now. Try again.',
    signIn: 'Sign in again to check configuration.',
    forbidden: 'You do not have access to inspect this configuration.',
    invalid: 'Ask the application maintainer to check this declaration.',
  },
};

/** Local fixtures illustrate presentation, not an application's setup or permissions. */
export function SetupReadinessDemo(): ReactElement {
  const [configured, setConfigured] = useState(false);
  const checks = useMemo(
    () => [
      {
        id: 'reviewer',
        title: 'Finance reviewer',
        description:
          'Assign an enabled reviewer before high-value requests can be reviewed.',
        action: (
          <Button
            variant='outline'
            size='sm'
            onClick={() => setConfigured(true)}
          >
            Configure demo reviewer
          </Button>
        ),
      },
    ],
    [],
  );
  const inspect = useCallback(
    async () => ({
      reviewer: {
        status: configured ? ('ready' as const) : ('missing' as const),
      },
    }),
    [configured],
  );
  const state = useSetupReadiness(checks, inspect);
  return (
    <div className='flex flex-col gap-4 bg-background p-6 text-foreground'>
      <h1 className='text-xl font-semibold'>Contextual setup readiness</h1>
      <p className='text-sm text-muted-foreground'>
        Local demonstration data. Applications connect real authorized reads and
        existing configuration pages. Initial all-ready checks show no banner.
      </p>
      <SetupReadiness state={state} labels={labels} />
      {configured && (
        <Button variant='outline' onClick={() => setConfigured(false)}>
          Reset demo configuration
        </Button>
      )}
    </div>
  );
}
