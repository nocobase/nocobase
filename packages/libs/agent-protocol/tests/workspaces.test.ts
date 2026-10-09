import { describe, expect, it } from 'vitest';

import {
  HeartbeatResponseSchema,
  MAX_WORKSPACES_PER_REPORT,
  RUNNER_ROUTES,
  WorkspacesRequestSchema,
  WorkspacesResponseSchema,
} from '../src/index.js';

const workspace = {
  runId: 'r1',
  workDir: '/home/runner/.nocobase-runner-work/acme/issue-1',
  sizeBytes: 2048,
  unpushed: false,
  lastUsedAt: '2026-10-09T00:00:00.000Z',
};

describe('workspace reports', () => {
  it('is sent under the runner namespace', () => {
    expect(RUNNER_ROUTES.workspaces).toBe('/api/agents/runners/workspaces');
  });

  it('reads a report and its answer', () => {
    expect(
      WorkspacesRequestSchema.parse({
        workspaces: [workspace],
        limitBytes: 40 * 1024 ** 3,
        totalBytes: 2048,
      }),
    ).toMatchObject({ workspaces: [workspace] });
    expect(WorkspacesRequestSchema.safeParse({ workspaces: [] }).success).toBe(
      true,
    );
    expect(
      WorkspacesRequestSchema.safeParse({
        workspaces: [{ ...workspace, sizeBytes: -1 }],
      }).success,
    ).toBe(false);
    expect(
      WorkspacesRequestSchema.safeParse({
        workspaces: Array.from(
          { length: MAX_WORKSPACES_PER_REPORT + 1 },
          () => workspace,
        ),
      }).success,
    ).toBe(false);
    expect(
      WorkspacesResponseSchema.parse({ remove: ['r1'], keep: [] }),
    ).toEqual({ remove: ['r1'], keep: [] });
  });

  it('is announced in a heartbeat answer, which still reads without it', () => {
    const answer = {
      ok: true,
      serverTime: '2026-10-09T00:00:00.000Z',
      cancelRequested: [],
      release: [],
    };
    expect(HeartbeatResponseSchema.parse(answer)).not.toHaveProperty(
      'workspaces',
    );
    expect(
      HeartbeatResponseSchema.parse({
        ...answer,
        workspaces: { intervalMs: 600_000 },
      }).workspaces,
    ).toEqual({ intervalMs: 600_000 });
  });
});
