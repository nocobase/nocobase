import { afterEach, expect, it } from 'vitest';
import { createHarness, claim, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  await h?.services.onlineAgent.shutdown();
  await h?.close();
});
async function fixture() {
  h = await createHarness();
  const agentId = await h.createAgent({ name: 'First', source: 'runner' });
  const runner = await h.registerRunner();
  let visible = true;
  h.services.conversations.workspace.provide({
    prepare: async (userId) => userId,
    async resolve(_conn, conversation, prepared) {
      if (
        prepared !== 'alice' ||
        !visible ||
        conversation.projectId !== 'project'
      )
        throw new Error('Project unavailable');
      return {
        dirs: [
          {
            kind: 'repo',
            url: 'https://example.test/repo.git',
            defaultBranch: 'dev',
            branch: 'chat/test',
            path: 'repo',
            scopeId: 'repo',
          },
        ],
        scopes: [{ scope: 'project', scopeId: 'project' }],
      };
    },
  });
  return {
    agentId,
    runner,
    revoke: () => {
      visible = false;
    },
  };
}
it('defaults to no project, validates selection and freezes it after sending', async () => {
  const { agentId } = await fixture();
  const service = h.services.conversations;
  const empty = await service.create('alice', { agentId });
  expect(empty.projectId).toBeNull();
  expect(
    (await service.update('alice', empty.id, { projectId: 'project' }))
      .projectId,
  ).toBe('project');
  await expect(
    service.create('bob', { agentId, projectId: 'project' }),
  ).rejects.toThrow('Project unavailable');
  await service.send('alice', empty.id, { content: 'Read code' });
  await expect(
    service.update('alice', empty.id, { projectId: null }),
  ).rejects.toThrow('another project');
});
it('checks project authorization again when assembling and gives no checkout after revocation', async () => {
  const { agentId, runner, revoke } = await fixture();
  const service = h.services.conversations;
  const chat = await service.create('alice', { agentId, projectId: 'project' });
  await service.send('alice', chat.id, { content: 'Read code' });
  revoke();
  expect(await claim(h, runner)).toEqual([]);
});
it('retains the bound runner and takes the previous conversation summary across agents', async () => {
  const { agentId, runner } = await fixture();
  const service = h.services.conversations;
  const other = await h.createAgent({ name: 'Second', source: 'runner' });
  const chat = await service.create('alice', { agentId, projectId: 'project' });
  await service.send('alice', chat.id, { content: 'Read code' });
  const [first] = await claim(h, runner);
  expect(first.workspace.dirs).toMatchObject([
    { branch: 'chat/test', defaultBranch: 'dev' },
  ]);
  const post = (action: string, body: unknown) =>
    h.request('POST', `/agents/runners/runs/${first.run.id}/${action}`, {
      runnerKey: runner.key,
      body,
    });
  expect(
    (
      await post('start', {
        workDir: '/work/chat',
        adapter: { kind: 'claude' },
        acceptsInput: true,
      })
    ).status,
  ).toBe(200);
  const inputs = (await h.services.runs.detail(first.run.id)).inputs;
  expect(
    (
      await post('complete', {
        summary: 'Edited local file',
        handledInputIds: inputs.map((input) => input.id),
        sessionId: 'old-tool-session',
      })
    ).status,
  ).toBe(200);
  await service.switchAgent('alice', chat.id, other);
  await service.send('alice', chat.id, { content: 'Continue' });
  expect((await service.get('alice', chat.id)).runner?.id).toBe(
    runner.runnerId,
  );
  const anotherRunner = await h.registerRunner();
  expect(await claim(h, anotherRunner)).toEqual([]);
  const [second] = await claim(h, runner);
  expect(second.workspace.dirs).toEqual(first.workspace.dirs);
  expect(JSON.stringify(second)).toContain('Edited local file');
});
it('accepts project selection through native Runner HTTP creation and protects project edits', async () => {
  const { agentId } = await fixture();
  const path = '/agents/conversations';
  const body = { agentId, projectId: 'project' };
  expect((await h.request('POST', path, { body })).status).toBe(401);
  const created = await h.request('POST', path, { user: 'alice', body });
  expect(created.status).toBe(201);
  expect(created.body.data.projectId).toBe('project');
  const id = created.body.data.id;
  expect(
    (
      await h.request('PATCH', `${path}/${id}`, {
        user: 'bob',
        body: { projectId: null },
      })
    ).status,
  ).toBe(404);
  const restored = await h.services.onlineAgent.realtime(
    {
      user: { id: 'alice' },
      credentials: { kind: 'test-session', userId: 'alice' },
      authorization: {
        identity: { principal: { type: 'user', id: 'alice' } },
      } as import('@nocobase/authorization/core').AuthorizationContext,
    },
    { sessionId: id },
  );
  await restored.send([{ role: 'user', content: 'Read code' }]);
  expect(
    (
      await h.request('PATCH', `${path}/${id}`, {
        user: 'alice',
        body: { projectId: null },
      })
    ).status,
  ).toBe(409);
});
