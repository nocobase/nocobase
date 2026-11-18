import { afterEach, expect, it, vi } from 'vitest';
import type { Knex } from 'knex';
import { appendFile } from 'node:fs/promises';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  vi.restoreAllMocks();
  await h?.services.onlineAgent.shutdown();
  await h?.close();
});
async function fixture() {
  h = await createHarness();
  const runner = await h.registerRunner({ name: 'dev-1', slots: 1 });
  const agentId = await h.createAgent({ maxConcurrentRuns: 10 });
  const id = (await h.services.conversations.create('alice', { agentId })).id;
  await h.database
    .connection()
    .repository('agConversations')
    .updateMany({ filter: { id }, values: { runnerId: runner.runnerId } });
  return { runner, agentId, id, conversations: h.services.conversations };
}
it('diagnoses only the latest queued unclaimed turn, never lists, idle or held conversations', async () => {
  const { runner, id, conversations } = await fixture();
  const diagnostic = vi.spyOn(h.services.runs, 'queueWait');
  await conversations.get('alice', id);
  await conversations.list('alice', {});
  expect(diagnostic).not.toHaveBeenCalled();
  const sent = await conversations.send('alice', id, { content: 'Wait' });
  diagnostic.mockClear();
  await conversations.get('alice', id);
  expect(diagnostic).toHaveBeenCalledExactlyOnceWith(
    sent.run!.id,
    runner.runnerId,
  );
  diagnostic.mockClear();
  await conversations.list('alice', {});
  expect(diagnostic).not.toHaveBeenCalled();
  await claim(h, runner);
  expect(diagnostic).not.toHaveBeenCalled();
  diagnostic.mockClear();
  expect((await conversations.get('alice', id)).wait).toBeNull();
  expect(diagnostic).not.toHaveBeenCalled();
});
it('explains a full bound runner even when another matching runner is free', async () => {
  const { runner, agentId, id, conversations } = await fixture();
  const occupied = await h.enqueue(agentId, 'other-work');
  expect((await claim(h, runner))[0]?.run.id).toBe(occupied);
  await h.registerRunner({ name: 'idle' });
  await conversations.send('alice', id, { content: 'Wait' });
  expect((await conversations.get('alice', id)).wait).toMatchObject({
    reason: 'runnersBusy',
    params: { used: 1, limit: 1 },
  });
});
it.each(['offline', 'revoked', 'missing'])(
  'explains a %s bound runner',
  async (status) => {
    const { runner, id, conversations } = await fixture();
    await conversations.send('alice', id, { content: 'Wait' });
    const repo = h.database.connection().repository('agRunners');
    if (status === 'missing')
      await repo.deleteMany({ filter: { id: runner.runnerId } });
    else
      await repo.updateMany({
        filter: { id: runner.runnerId },
        values: { status },
      });
    expect((await conversations.get('alice', id)).wait?.reason).toBe(
      'runnersOffline',
    );
  },
);
it('reports quota and its recovery time on the bound runner', async () => {
  const { runner, id, conversations } = await fixture();
  await conversations.send('alice', id, { content: 'Wait' });
  const until = new Date(h.clock.now().getTime() + 3600_000).toISOString();
  await h.services.tx.run((unit) =>
    h.services.runners.reportQuota(unit, runner.runnerId, 'claude', null, {
      windows: [
        {
          scope: 'tool',
          target: '',
          window: 'account',
          exhausted: true,
          resetsAt: until,
        },
      ],
    }),
  );
  await h.registerRunner({ name: 'idle' });
  expect((await conversations.get('alice', id)).wait).toMatchObject({
    reason: 'toolQuota',
    until,
  });
});
it('reports when no runner provides the Agent', async () => {
  const { runner, id, conversations } = await fixture();
  await conversations.send('alice', id, { content: 'Wait' });
  await conversations.switchRunner('alice', id);
  await h.database
    .connection()
    .repository('agRunners')
    .updateMany({ filter: { id: runner.runnerId }, values: { tools: [] } });
  expect((await conversations.get('alice', id)).wait?.reason).toBe(
    'toolUnavailable',
  );
});
it('withdraws an unclaimed initial turn and refuses once the runner has claimed it', async () => {
  const { runner, id, conversations } = await fixture();
  const first = await conversations.send('alice', id, {
    content: 'Change Agent',
  });
  await conversations.withdraw('alice', id, first.message.id);
  expect((await h.services.runs.get(first.run!.id)).status).toBe('cancelled');
  expect(await claim(h, runner)).toEqual([]);
  const second = await conversations.send('alice', id, {
    content: 'Already taken',
  });
  await claim(h, runner);
  await expect(
    conversations.withdraw('alice', id, second.message.id),
  ).rejects.toMatchObject({ details: { reason: 'messageTaken' } });
  expect((await h.services.runs.get(second.run!.id)).status).toBe('dispatched');
});

it('bounds the queued diagnosis to six reads and zero writes, locks or transactions', async () => {
  const { id, conversations } = await fixture();
  await conversations.send('alice', id, { content: 'Measure waiting' });
  const client = await h.database.connection().client<Knex>();
  const measure = async () => {
    const queries: string[] = [];
    const capture = (query: { sql: string }) => queries.push(query.sql);
    client.on('query', capture);
    try {
      await conversations.get('alice', id);
    } finally {
      client.off('query', capture);
    }
    return queries;
  };
  const diagnostic = vi
    .spyOn(h.services.runs, 'queueWait')
    .mockResolvedValue(null);
  const before = await measure();
  diagnostic.mockRestore();
  const after = await measure();
  const reads = (queries: string[]) =>
    queries.filter((sql) => /^select/iu.test(sql)).length;
  expect(reads(after) - reads(before)).toBe(6);
  expect(after.every((sql) => /^select/iu.test(sql))).toBe(true);
  expect(after.some((sql) => /for update/iu.test(sql))).toBe(false);
  if (process.env.CONVERSATION_WAIT_COST_FILE)
    await appendFile(
      process.env.CONVERSATION_WAIT_COST_FILE,
      JSON.stringify({
        baseline: reads(before),
        queued: reads(after),
        extraReads: reads(after) - reads(before),
      }) + '\n',
    );
});
it('reuses a withdrawn input attachment only inside its owned conversation', async () => {
  const { id, conversations, agentId } = await fixture();
  const form = new FormData();
  form.set(
    'file',
    new File(['Keep this file'], 'context.txt', { type: 'text/plain' }),
  );
  const upload = await h.request('POST', '/agents/chatAttachments', {
    user: 'alice',
    form,
  });
  expect(upload.status).toBe(201);
  const file = upload.body.data.id as string;
  const first = await conversations.send('alice', id, {
    content: 'Change Agent',
    attachmentIds: [file],
  });
  await conversations.withdraw('alice', id, first.message.id);
  const other = (await conversations.create('alice', { agentId })).id;
  await expect(
    conversations.send('alice', other, {
      content: 'Different conversation',
      attachmentIds: [file],
    }),
  ).rejects.toBeDefined();
  const sent = await conversations.send('alice', id, {
    content: 'Change Agent',
    attachmentIds: [file],
  });
  expect(sent.message.attachments?.[0]?.id).toBe(file);
});

it('keeps initial withdrawal authenticated and scoped to its conversation owner', async () => {
  const { id, conversations } = await fixture();
  const sent = await conversations.send('alice', id, {
    content: 'Owned waiting turn',
  });
  const path = `/agents/conversations/${id}/messages/${sent.message.id}/withdraw`;
  expect((await h.request('POST', path)).status).toBe(401);
  expect((await h.request('POST', path, { user: 'bob' })).status).toBe(404);
  expect((await h.request('POST', path, { user: 'alice' })).status).toBe(204);
  expect((await h.services.runs.get(sent.run!.id)).status).toBe('cancelled');
});
