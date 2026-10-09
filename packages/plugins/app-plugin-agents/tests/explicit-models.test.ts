import { afterEach, describe, expect, it } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';
import {
  entriesError,
  entryDrafts,
  newAgentDraft,
  newAgentInput,
} from '../client/pages/agents/agent-model.js';

// A legacy record bypasses today's save validation, as an existing database does.
async function legacy(
  h: Harness,
  agentId: string,
  entries: unknown,
): Promise<void> {
  await h.database
    .connection()
    .repository('agAgents')
    .updateMany({ filter: { id: agentId }, values: { modelEntries: entries } });
}

describe('explicit runner models', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  it.each([undefined, null, '', '   '])(
    'rejects missing/empty models through API and service (%s)',
    async (model) => {
      h = await createHarness();
      const entries = [
        { tool: 'claude' as const, ...(model === undefined ? {} : { model }) },
      ];
      const created = await h.request('POST', '/agents', {
        user: 'alice',
        can: ['agents.agents/manage'],
        body: { name: 'Invalid', modelEntries: entries },
      });
      expect(created.status).toBe(400);
      const id = await h.createAgent();
      const updated = await h.request('PATCH', `/agents/${id}`, {
        user: 'alice',
        can: ['agents.agents/manage'],
        body: { expectedRevision: 1, modelEntries: entries },
      });
      expect(updated.status).toBe(400);
      await expect(
        h.services.agents.create('alice', {
          name: 'Invalid',
          modelEntries: [{ tool: 'claude', model: model ?? null }],
        }),
      ).rejects.toThrow('explicit model');
      expect((await h.services.agents.get(id)).revision).toBe(1);
    },
  );

  it('keeps inputs waiting outside the claimable queue until configuration is saved', async () => {
    h = await createHarness();
    const id = await h.createAgent();
    await legacy(h, id, [{ tool: 'claude', model: null }]);
    const runId = await h.enqueue(id, '1', { text: 'First input' });
    expect(await h.enqueue(id, '1', { text: 'Second input' })).toBe(runId);
    const runner = await h.registerRunner();
    expect(await claim(h, runner)).toEqual([]);
    const run = await h.services.runs.detail(runId);
    expect(run).toMatchObject({ status: 'queued', modelPending: true });
    expect(run.inputs.map((input) => [input.text, input.deliveredAt])).toEqual([
      ['First input', null],
      ['Second input', null],
    ]);
    const board = await h.services.runs.workload({ subjectKind: 'sample' });
    expect(board.runs[0]?.wait).toMatchObject({
      reason: 'modelNotConfigured',
      position: null,
    });
    h.clock.advance(86_400_000);
    await h.sweep();
    expect((await h.services.runs.get(runId)).status).toBe('queued');
    await h.services.agents.update(id, 'alice', {
      expectedRevision: 1,
      modelEntries: [{ tool: 'claude', model: 'opus' }],
    });
    expect((await h.services.runs.get(runId)).modelPending).toBe(false);
    const online = await h.registerRunner();
    const [payload] = await claim(h, online);
    expect(payload?.tool.model).toBe('opus');
    expect(payload?.inputs.map((input) => input.text)).toEqual([
      'First input',
      'Second input',
    ]);
  });

  it('skips empty fallback entries even for previously queued runs', async () => {
    h = await createHarness();
    const id = await h.createAgent();
    const runId = await h.enqueue(id);
    await legacy(h, id, [
      { tool: 'claude', model: ' ' },
      { tool: 'codex', model: 'gpt-test' },
    ]);
    const runner = await h.registerRunner({
      tools: [
        { kind: 'claude', authenticated: true },
        { kind: 'codex', authenticated: true },
      ],
    });
    const [payload] = await claim(h, runner);
    expect(payload?.tool).toMatchObject({ kind: 'codex', model: 'gpt-test' });
    expect((await h.services.runs.get(runId)).model).toBe('gpt-test');
  });

  it('rechecks the saved model after preparation and locking', async () => {
    h = await createHarness();
    const id = await h.createAgent();
    await h.enqueue(id);
    h.services.briefs.sections.register({
      key: 'change-model-before-lock',
      prepare: async () => {
        await h.services.agents.update(id, 'alice', {
          expectedRevision: 1,
          modelEntries: [{ tool: 'claude', model: 'sonnet' }],
        });
        return null;
      },
      section: () => null,
    });
    const [payload] = await claim(h, await h.registerRunner());
    expect(payload?.tool.model).toBe('sonnet');
  });

  it('requires completion in both new and legacy form drafts while effort stays optional', () => {
    const draft = { ...newAgentDraft(), name: 'Coder' };
    expect(newAgentInput(draft)).toEqual({
      modelError: 'modelEntries.runnerModelRequired',
    });
    const rows = entryDrafts([
      { tool: 'claude', model: null },
      { tool: 'codex', model: 'gpt-test' },
    ]);
    expect(entriesError('runner', rows)).toBe(
      'modelEntries.runnerModelRequired',
    );
    expect(
      entriesError(
        'runner',
        rows.map((row) => ({ ...row, model: row.model || 'opus' })),
      ),
    ).toBeNull();
  });
});
