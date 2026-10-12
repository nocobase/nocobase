import { expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';

import { VariableSchema } from '../server/routes/schemas.js';
import type {
  EnqueueRequest,
  EnqueueResult,
  RunEnqueued,
  RunRequestPending,
  RunService,
} from '../server/tokens.js';
import type { RunRepo, RunWait } from '../shared/runs.js';
import type { Variable } from '../shared/variables.js';

// Checked by tsconfig.type-tests.json as well as Vitest: applications may still construct the previous shapes.
const wait: RunWait = {
  reason: 'next',
  position: 1,
  agentPosition: 1,
  until: null,
  tool: null,
  missing: [],
  detail: null,
};

const variable: Variable = {
  name: 'TOKEN',
  updatedAt: '2026-10-09T00:00:00.000Z',
  updatedById: null,
  updatedByName: null,
};

// Applications can keep their existing repository view schemas while adopting the new plugin.
const legacyRepoSchema: z.ZodType<RunRepo> = z.object({
  url: z.string(),
  branch: z.string(),
  pushed: z.boolean(),
  headSha: z.string().nullable(),
  updatedAt: z.string(),
});

const repo: RunRepo = {
  url: 'https://github.com/acme/app.git',
  branch: 'agent/PM-1',
  pushed: true,
  headSha: null,
  updatedAt: '2026-10-09T00:00:00.000Z',
};

it('accepts legacy repository reports and schemas without push failure details', () => {
  expect(legacyRepoSchema.parse(repo)).toEqual(repo);
  expect(repo.failure ?? null).toBeNull();
});

it('accepts a wait constructed without variable details', () => {
  expect(wait.variables ?? []).toEqual([]);
});

it('accepts variable metadata without a team-only mark', () => {
  expect(VariableSchema.parse(variable)).toEqual(variable);
  expect(variable.teamRunnersOnly ?? false).toBe(false);
});

async function enqueueApplicationWork(
  runs: Pick<RunService, 'enqueue'>,
  request: Omit<EnqueueRequest, 'responsibleUserId'>,
) {
  const result = await runs.enqueue(request);
  expectTypeOf(result).toEqualTypeOf<EnqueueResult>();
  // Applications guard a pending request before reporting a started run.
  if (result.runId === null) {
    expectTypeOf(result).toEqualTypeOf<RunRequestPending>();
    return { started: false, requestId: result.requestId };
  }
  expectTypeOf(result).toEqualTypeOf<RunEnqueued>();
  const started: { readonly started: boolean; readonly runId?: string } = {
    started: true,
    runId: result.runId,
  };
  const unowned = await runs.enqueue({ ...request, responsibleUserId: null });
  expectTypeOf(unowned).toEqualTypeOf<EnqueueResult>();
  const responsible = await runs.enqueue({
    ...request,
    responsibleUserId: 'alice',
  });
  expectTypeOf(responsible).toEqualTypeOf<EnqueueResult>();
  const dynamic: EnqueueRequest = { ...request };
  const unknown = await runs.enqueue(dynamic);
  expectTypeOf(unknown).toEqualTypeOf<EnqueueResult>();
  return started;
}

it('lets applications guard a pending request and report a queued run', async () => {
  const queued: RunEnqueued = {
    outcome: 'created',
    runId: 'queued-run',
    inputId: 'input',
    status: 'queued',
  };
  expect(
    await enqueueApplicationWork(
      { enqueue: () => Promise.resolve(queued) },
      {
        agentId: 'agent',
        subject: { kind: 'sample', id: '1' },
        actorUserId: 'bob',
        input: {
          type: 'comment',
          actor: { kind: 'user', id: 'bob', name: 'Bob' },
          text: 'Start work.',
        },
      },
    ),
  ).toEqual({ started: true, runId: 'queued-run' });
  const pending: RunRequestPending = {
    outcome: 'pending',
    runId: null,
    inputId: null,
    status: 'pending',
    requestId: 'pending-request',
  };
  expect(
    await enqueueApplicationWork(
      { enqueue: () => Promise.resolve(pending) },
      {
        agentId: 'agent',
        subject: { kind: 'sample', id: '1' },
        input: {
          type: 'comment',
          actor: { kind: 'user', id: 'bob', name: 'Bob' },
          text: 'Start work.',
        },
      },
    ),
  ).toEqual({ started: false, requestId: 'pending-request' });
});
