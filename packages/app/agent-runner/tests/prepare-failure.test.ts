import { describe, expect, it } from 'vitest';

import { PrepareError, stepFailure } from '../src/agent/prepare/index.ts';
import { WorkspaceBusyError } from '../src/core/checkout.ts';

const step = { failure: 'checkoutFailed' as const };

describe('stepFailure', () => {
  it('reports a lock another process holds as workspaceBusy when the application accepts it', () => {
    const busy = new WorkspaceBusyError('/work/x.lock is held by process 42');
    expect(stepFailure(step, busy, ['workspaceBusy'])).toBe('workspaceBusy');
    expect(
      stepFailure({ failure: 'setupFailed' }, busy, ['workspaceBusy']),
    ).toBe('workspaceBusy');
  });

  it('falls back to the announced fallback for an application that does not accept it', () => {
    const busy = new WorkspaceBusyError('/work/x.lock is held by process 42');
    expect(stepFailure(step, busy, [])).not.toBe('workspaceBusy');
  });

  it("keeps a PrepareError's own reason and the step's failure otherwise", () => {
    expect(
      stepFailure(step, new PrepareError('repoAccessDenied', 'no'), []),
    ).toBe('repoAccessDenied');
    expect(stepFailure(step, new Error('boom'), ['workspaceBusy'])).toBe(
      'checkoutFailed',
    );
  });
});
