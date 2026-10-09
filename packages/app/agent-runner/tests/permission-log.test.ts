import { describe, expect, it } from 'vitest';

import { permissionDenialLog } from '../src/agent/permission-log.ts';
import { createRedactor } from '../src/protocol/index.ts';
import type { AdapterEvent } from '../src/agent/adapters/types.ts';

describe('permission denial logs', () => {
  const denial: AdapterEvent = {
    at: '2026-01-01T00:00:00Z',
    type: 'permission',
    tool: 'Write',
    input: { file_path: '/work/result.txt', content: 'private file body' },
    meta: {
      decision: 'deny',
      reason: 'outside work directory',
      toolUseId: 't1',
    },
  };

  it('names the tool, input path and reason without copying file bodies', () => {
    const log = permissionDenialLog(denial, createRedactor([]));
    expect(log).toContain('Write');
    expect(log).toContain('/work/result.txt');
    expect(log).toContain('outside work directory');
    expect(log).not.toContain('private file body');
  });

  it('redacts before truncation, including field names and reasons', () => {
    const secret = 'sensitive-test-value';
    const log = permissionDenialLog(
      {
        ...denial,
        tool: secret,
        input: {
          command: `cat ${secret} ${'x'.repeat(4000)}`,
          [secret]: 'ignored',
        },
        meta: { decision: 'deny', reason: secret },
      },
      createRedactor([secret]),
    );
    expect(log).not.toContain(secret);
    expect(log).toContain('[REDACTED]');
    expect(log).toContain('[truncated]');
    expect(log!.length).toBeLessThan(2100);
  });

  it('omits allowed calls and non-permission events', () => {
    const redactor = createRedactor([]);
    expect(
      permissionDenialLog({ ...denial, meta: { decision: 'allow' } }, redactor),
    ).toBeUndefined();
    expect(
      permissionDenialLog({ ...denial, type: 'toolUse' }, redactor),
    ).toBeUndefined();
  });
});
