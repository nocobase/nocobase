import { describe, expect, it } from 'vitest';

import { denialMessage } from '../../src/agent/adapters/policy-denial.ts';

describe('runner policy feedback', () => {
  it.each([
    [
      'Read outside the work directory: ../full-test.log',
      'inside the working directories',
    ],
    ['Command is not in the allowlist: rm', 'allowed command or a file tool'],
    ['pushes must pass the push guard', 'normal git push'],
    ['The runner keeps credentials there', 'application CLI'],
    ['Downloading and running code is refused', 'pnpm exec'],
    ['Command substitution is not allowed', 'simple allowed calls'],
    ['The run is in plan mode; file edits are refused', 'read-only inspection'],
  ])('explains %s with a permitted alternative', (reason, alternative) => {
    const message = denialMessage(reason);
    expect(message).toContain(reason);
    expect(message).toContain('not a user instruction to stop');
    expect(message).toContain(alternative);
    expect(message).toContain('it does not end the task');
    expect(message).toContain('still do every other step');
    expect(message).toContain('do not ask for permission');
  });

  it('gives a useful fallback without a reason', () => {
    expect(denialMessage(undefined)).toContain('Denied by the runner policy');
    expect(denialMessage('')).toContain('Use an allowed tool');
  });
});
