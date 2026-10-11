// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { RunInput } from '@nocobase/agent-protocol';
import {
  bindStageRuns,
  obsoleteStageInput,
} from '../../server/agents/stage-runs.js';

const input = (revision?: number): RunInput => ({
  id: 'input',
  type: 'signal',
  actor: { kind: 'system', id: 'system', name: 'Studio' },
  text: 'Stage instruction',
  createdAt: '2026-01-01T00:00:00Z',
  payload: {
    trigger: 'stageEntered',
    to: 'analysis',
    ...(revision === undefined
      ? {}
      : {
          stageInputVersion: {
            issueId: 'issue',
            statusKey: 'analysis',
            revision,
          },
        }),
  },
});
describe('stage instruction revision fences', () => {
  it('invalidates only the departed round when the same stage is entered again', () => {
    expect(obsoleteStageInput(input(10), 'issue', 'analysis', 11)).toBe(true);
    expect(obsoleteStageInput(input(12), 'issue', 'analysis', 11)).toBe(false);
    expect(obsoleteStageInput(input(11), 'issue', 'analysis', 11)).toBe(false);
    expect(obsoleteStageInput(input(10), 'another', 'analysis', 11)).toBe(
      false,
    );
    expect(obsoleteStageInput(input(10), 'issue', 'proposal_review', 11)).toBe(
      false,
    );
  });
  it('preserves unmarked input rather than guessing its stage round', () => {
    expect(obsoleteStageInput(input(), 'issue', 'analysis', 11)).toBe(false);
  });
});

it('reclassifies changed input snapshots and preserves the newer round during a delayed leave event', async () => {
  type Projects = Parameters<typeof bindStageRuns>[0];
  type Agents = Parameters<typeof bindStageRuns>[1];
  let receive: (event: unknown) => void = () => undefined;
  const old = { ...input(10), id: 'old' };
  const newer = { ...input(12), id: 'new' };
  let pending = [old];
  const requests: Parameters<Agents['runs']['reconcileQueued']>[0][] = [];
  const reconcileQueued = vi.fn(
    async (request: Parameters<Agents['runs']['reconcileQueued']>[0]) => {
      requests.push(request);
      if (requests.length === 1) {
        pending = [old, newer];
        return 'inputsChanged' as const;
      }
      return 'signalled' as const;
    },
  );
  const projects = {
    events: {
      on: (_type: string, callback: typeof receive) => {
        receive = callback;
        return () => undefined;
      },
    },
    tx: { read: () => null },
    issueQueries: {
      detail: async () => ({
        ownerUserId: 'owner',
        statusKey: 'analysis',
        revision: 12,
      }),
    },
  } as unknown as Projects;
  const agents = {
    runs: {
      openOn: async () => [{ id: 'run', status: 'queued' }],
      pendingInputs: async () => pending,
      reconcileQueued,
    },
  } as unknown as Agents;
  const errors = vi.fn();
  const release = bindStageRuns(projects, agents, errors);
  receive({
    type: 'issue.updated',
    issueId: 'issue',
    revision: 11,
    actor: { type: 'user', id: 'owner' },
    changes: { status: { from: 'analysis', to: 'in_progress' } },
  });
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[0]!.operation.type).toBe('cancel');
  expect(requests[1]!.operation).toMatchObject({
    type: 'signal',
    input: { payload: { obsoleteInputIds: ['old'] } },
  });
  expect(requests[1]!.expectedPendingInputIds).toEqual(['old', 'new']);
  expect(pending).toEqual([old, newer]);
  expect(errors).not.toHaveBeenCalled();
  release();
});
