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
  unpushed: false,
  lastUsedAt: '2026-10-09T00:00:00.000Z',
};

describe('workspace reports', () => {
  it('accepts optional legacy directory decisions and rejects invalid commit evidence', () => {
    const request = {
      workspaces: [],
      reportId: 'report',
      directories: [
        {
          workDir: workspace.workDir,
          subjectKey: 'task',
          unpushed: true,
          lastUsedAt: workspace.lastUsedAt,
        },
      ],
    };
    expect(WorkspacesRequestSchema.parse(request)).toEqual(request);
    const decision = {
      reportId: 'report',
      workDir: workspace.workDir,
      lastUsedAt: workspace.lastUsedAt,
      settled: true,
      reason: 'settled',
      commits: [
        { repository: 'https://example.com/repo.git', headSha: 'a'.repeat(40) },
      ],
    };
    expect(
      WorkspacesResponseSchema.parse({
        remove: [],
        keep: [],
        decisions: [decision],
      }).decisions,
    ).toEqual([decision]);
    expect(
      WorkspacesResponseSchema.safeParse({
        remove: [],
        keep: [],
        decisions: [
          { ...decision, commits: [{ repository: 'repo', headSha: '--help' }] },
        ],
      }).success,
    ).toBe(false);
  });
  it('is sent under the runner namespace', () => {
    expect(RUNNER_ROUTES.workspaces).toBe('/api/agents/runners/workspaces');
  });

  it('reads a report and its answer', () => {
    expect(
      WorkspacesRequestSchema.parse({
        workspaces: [workspace],
        disk: {
          freeBytes: 20 * 1024 ** 3,
          totalBytes: 200 * 1024 ** 3,
          minFreeBytes: 20 * 1024 ** 3,
        },
      }),
    ).toMatchObject({
      workspaces: [workspace],
      disk: { freeBytes: 20 * 1024 ** 3 },
    });
    // An earlier runner still sends each directory's size.
    expect(
      WorkspacesRequestSchema.parse({
        workspaces: [{ ...workspace, sizeBytes: 2048 }],
      }).workspaces[0],
    ).toMatchObject({ sizeBytes: 2048 });
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
