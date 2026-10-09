import { expect, expectTypeOf, it } from 'vitest';

import { VariableSchema } from '../server/routes/schemas.js';
import type {
  AgentsNotice,
  EnqueueRequest,
  EnqueueResult,
  RunnerNotice,
  RunEnqueued,
  RunService,
} from '../server/tokens.js';
import type { RunWait } from '../shared/runs.js';
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

it('accepts a wait constructed without variable details', () => {
  expect(wait.variables ?? []).toEqual([]);
});

it('accepts variable metadata without a team-only mark', () => {
  expect(VariableSchema.parse(variable)).toEqual(variable);
  expect(variable.teamRunnersOnly ?? false).toBe(false);
});

it('preserves the previous notice import for application listeners', () => {
  expectTypeOf<RunnerNotice>().toEqualTypeOf<AgentsNotice>();
});

async function enqueueApplicationWork(
  runs: Pick<RunService, 'enqueue'>,
  request: Omit<EnqueueRequest, 'responsibleUserId'>,
) {
  const result = await runs.enqueue(request);
  expectTypeOf(result).toEqualTypeOf<RunEnqueued>();
  // Existing applications report a started run with an optional string id.
  const started: { readonly started: boolean; readonly runId?: string } = {
    started: true,
    runId: result.runId,
  };
  const unowned = await runs.enqueue({ ...request, responsibleUserId: null });
  expectTypeOf(unowned).toEqualTypeOf<RunEnqueued>();
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

it('keeps a non-null run id for callers that name no responsible person', async () => {
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
});
