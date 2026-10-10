// @vitest-environment node
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import { describe, expect, it, vi } from 'vitest';

import type { StudioInboxPort } from '../../server/inbox/port.js';
import { settleFailedRunCards } from '../../server/agents/notices.js';

describe('settling failed run cards on retry', () => {
  it('only reads queued issue runs and resolves only a retry of an issue run', async () => {
    let changed:
      ((event: { runId: string; status: string }) => void) | undefined;
    let run: Run = {
      id: 'retry',
      retryOfRunId: null,
      subject: { kind: 'issue', id: 'issue-1' },
    } as Run;
    const get = vi.fn(async () => run);
    const agents = {
      events: {
        on: (
          _name: string,
          listener: (event: { runId: string; status: string }) => void,
        ) => {
          changed = listener;
          return () => undefined;
        },
      },
      runs: { get },
    } as unknown as Pick<Agents, 'events' | 'runs'>;
    const projects = {
      events: { on: () => () => undefined },
    } as unknown as Pick<Projects, 'events' | 'issueContext' | 'tx'>;
    const resolve = vi.fn(async () => undefined);
    const inbox = { resolve } as unknown as StudioInboxPort;

    settleFailedRunCards(
      agents,
      () => projects,
      () => inbox,
      () => undefined,
    );
    changed!({ runId: 'retry', status: 'running' });
    await Promise.resolve();
    expect(get).not.toHaveBeenCalled();

    changed!({ runId: 'retry', status: 'queued' });
    await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(resolve).not.toHaveBeenCalled();

    run = {
      ...run,
      retryOfRunId: 'old-issue-run',
      subject: { kind: 'consultation', id: 'consultation-1' },
    } as Run;
    changed!({ runId: 'retry', status: 'queued' });
    await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(resolve).not.toHaveBeenCalled();

    run = {
      ...run,
      subject: { kind: 'issue', id: 'issue-1' },
    } as Run;
    changed!({ runId: 'retry', status: 'queued' });
    await vi.waitFor(() =>
      expect(resolve).toHaveBeenCalledWith({
        source: 'projects',
        decisionKey: 'agents:run-failed:old-issue-run',
        outcome: 'retried',
      }),
    );
  });
});
