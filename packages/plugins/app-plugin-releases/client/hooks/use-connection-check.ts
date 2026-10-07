/** The state of a connection test: idle, running, what the driver reported, or why the request failed. */
import { useState } from 'react';

import type { EnvironmentCheckResult } from '../../shared/releases.js';

export type CheckOutcome =
  | { readonly state: 'idle' }
  | { readonly state: 'running' }
  | { readonly state: 'done'; readonly result: EnvironmentCheckResult }
  | { readonly state: 'error'; readonly error: unknown };

export function useConnectionCheck(): {
  readonly outcome: CheckOutcome;
  readonly run: (check: () => Promise<EnvironmentCheckResult>) => Promise<void>;
  readonly reset: () => void;
} {
  const [outcome, setOutcome] = useState<CheckOutcome>({ state: 'idle' });
  return {
    outcome,
    run: async (check) => {
      setOutcome({ state: 'running' });
      try {
        setOutcome({ state: 'done', result: await check() });
      } catch (error) {
        setOutcome({ state: 'error', error });
      }
    },
    reset: () => setOutcome({ state: 'idle' }),
  };
}
