import { afterEach, describe, expect, it } from 'vitest';

import { AGENT_LAYER_PREFIX } from '../server/core/brief/index.js';
import { claim, createHarness, skillMd, type Harness } from './harness.js';

const ADMIN = ['agents.agents/manage', 'agents.runners/manage'];

describe('admin API', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  it('needs a signed-in caller and the settings item for agents and runners', async () => {
    h = await createHarness();
    expect((await h.request('GET', '/agents')).status).toBe(401);
    const denied = await h.request('GET', '/agents', {
      user: 'bob',
    });
    expect(denied.status).toBe(403);
    expect(denied.body.error.reason).toBe('FORBIDDEN');
    const reader = await h.request('POST', '/agents', {
      user: 'bob',
      can: ['agents.agents/read'],
      body: { name: 'Coder', modelEntries: [{ tool: 'claude' }] },
    });
    expect(reader.status).toBe(403);
    // Anyone signed in may add a personal runner; a team runner needs the runners item.
    const personal = await h.request(
      'POST',
      '/agents/runners/registrationTokens',
      { user: 'bob', body: {} },
    );
    expect(personal.status).toBe(201);
    expect(personal.body.data.trust).toBe('ownerOnly');
    expect(
      (
        await h.request('POST', '/agents/runners/registrationTokens', {
          user: 'bob',
          body: { trust: 'team' },
        })
      ).status,
    ).toBe(403);
  });

  it('creates, updates and archives agents', async () => {
    h = await createHarness();
    const created = await h.request('POST', '/agents', {
      user: 'alice',
      can: ADMIN,
      body: {
        name: 'Reviewer',
        modelEntries: [{ tool: 'claude' }],
        runnerIds: ['r-1', ' r-1'],
        actions: ['crm.deals/comment'],
        access: 'users',
        userIds: ['bob'],
      },
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      name: 'Reviewer',
      ownerUserId: 'alice',
      runnerIds: ['r-1'],
      skillIds: [],
      instructions: null,
      userIds: ['bob'],
    });
    expect(created.body.data).not.toHaveProperty('execution');
    const invalid = await h.request('POST', '/agents', {
      user: 'alice',
      can: ADMIN,
      body: { name: 'X', modelEntries: [{ tool: 'emacs' }] },
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.reason).toBe('INVALID_INPUT');
    // Each entry's effort is one its tool takes: Codex has no `max`, Claude Code no `minimal`.
    for (const entry of [
      { tool: 'codex', effort: 'max' },
      { tool: 'claude', effort: 'minimal' },
    ]) {
      const refused = await h.request('POST', '/agents', {
        user: 'alice',
        can: ADMIN,
        body: { name: 'X', modelEntries: [entry] },
      });
      expect(refused.status).toBe(400);
      expect(refused.body.error.metadata).toMatchObject({
        reason: 'EFFORT_UNSUPPORTED',
      });
    }
    const efforts = await h.request(
      'PATCH',
      `/agents/${created.body.data.id}`,
      {
        user: 'alice',
        can: ADMIN,
        body: {
          modelEntries: [
            { tool: 'codex', model: 'gpt-5', effort: 'minimal' },
            { tool: 'claude', effort: 'max' },
            { tool: 'pi', effort: '' },
          ],
          expectedRevision: 1,
        },
      },
    );
    expect(efforts.body.data.modelEntries).toEqual([
      { tool: 'codex', model: 'gpt-5', effort: 'minimal' },
      { tool: 'claude', model: null, effort: 'max' },
      { tool: 'pi', model: null, effort: null },
    ]);
    const unknownSkill = await h.request(
      'PATCH',
      `/agents/${created.body.data.id}`,
      {
        user: 'alice',
        can: ADMIN,
        body: { skillIds: ['nope'], expectedRevision: 2 },
      },
    );
    expect(unknownSkill.status).toBe(400);

    const updated = await h.request(
      'PATCH',
      `/agents/${created.body.data.id}`,
      {
        user: 'alice',
        can: ADMIN,
        body: { maxConcurrentRuns: 5, userIds: [], expectedRevision: 2 },
      },
    );
    expect(updated.body.data).toMatchObject({
      maxConcurrentRuns: 5,
      userIds: [],
    });
    await h.request('POST', `/agents/${created.body.data.id}/archive`, {
      user: 'alice',
      can: ADMIN,
    });
    const list = await h.request('GET', '/agents', {
      user: 'alice',
      can: ADMIN,
    });
    expect(list.body.data).toEqual([]);
    const deleted = await h.request(
      'DELETE',
      `/agents/${created.body.data.id}`,
      { user: 'alice', can: ADMIN },
    );
    expect(deleted.status).toBe(204);
  });

  it('lists agents with their active runs and the runners online for them', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    await h.createAgent({
      name: 'Elsewhere',
      modelEntries: [{ tool: 'codex', model: null }],
    });
    await h.enqueue(agentId);
    const runner = await h.registerRunner();
    await claim(h, runner);
    const list = await h.request('GET', '/agents', {
      user: 'alice',
      can: ['agents.agents/read'],
    });
    expect(
      list.body.data.map(
        (agent: {
          name: string;
          activeRuns: number;
          onlineRunners: number;
        }) => [agent.name, agent.activeRuns, agent.onlineRunners],
      ),
    ).toEqual([
      ['Coder', 1, 1],
      ['Elsewhere', 0, 0],
    ]);
    // Runners are visible to whoever may read agents, to pick where they run.
    const runners = await h.request('GET', '/agents/runners', {
      user: 'alice',
      can: ['agents.agents/read'],
    });
    expect(runners.body.data).toEqual([
      expect.objectContaining({
        id: runner.runnerId,
        activeRuns: 1,
        canManage: false,
      }),
    ]);
  });

  it('previews what an agent is sent on a sample subject of the first scenario', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ instructions: 'Be brief.' });
    const preview = await h.request(
      'GET',
      // The application's first scenario unless one is named.
      `/agents/${agentId}/previewBrief`,
      { user: 'alice', can: ['agents.agents/read'] },
    );
    expect(preview.status).toBe(200);
    expect(preview.body.data).toMatchObject({
      scenario: 'sample',
      subject: { key: 'SMP-sample', title: '[sample] A sample' },
    });
    // The first message: the turn, then what woke the agent.
    expect(preview.body.data.firstMessage).toMatch(
      /^alice gave you this sample to work on\.\n\n### Signal from alice/u,
    );
    const { platform, agentPrompt } = preview.body.data as {
      platform: string;
      agentPrompt: string;
    };
    // The platform's part: the rules, the task, the context and the lead-in to the agent's prompt; then the agent's
    // own prompt, exactly as written.
    expect(platform).toContain('Rules:');
    expect(platform).toContain('Work on the sample.');
    expect(platform).toContain('[sample] Sample context');
    expect(platform.trimEnd().endsWith(AGENT_LAYER_PREFIX)).toBe(true);
    expect(agentPrompt).toBe('Be brief.');
    expect(platform).not.toContain('{{runner.');
    expect(await h.services.runs.list({})).toEqual([]);
    // A kind that offers no sample is refused.
    const refused = await h.request(
      'GET',
      `/agents/${agentId}/previewBrief?scenario=nope`,
      { user: 'alice', can: ['agents.agents/read'] },
    );
    expect(refused.status).toBe(400);
  });

  it('previews what an agent is sent in a sample conversation', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ instructions: 'Be brief.' });
    const preview = await h.request(
      'GET',
      `/agents/${agentId}/previewBrief?scenario=conversation`,
      { user: 'alice', can: ['agents.agents/read'] },
    );
    expect(preview.status).toBe(200);
    expect(preview.body.data).toMatchObject({
      scenario: 'conversation',
      subject: { key: 'chat-sample', title: '[sample] This week' },
      agentPrompt: 'Be brief.',
    });
    expect(preview.body.data.platform).toContain('a private conversation');
    expect(preview.body.data.firstMessage).toContain(
      '[sample] What is waiting for me this week?',
    );
    expect(await h.services.conversations.list('alice', {})).toMatchObject({
      items: [],
    });
  });

  it('creates registration tokens and revokes runners, giving their runs back', async () => {
    h = await createHarness();
    const token = await h.request(
      'POST',
      '/agents/runners/registrationTokens',
      {
        user: 'alice',
        can: ADMIN,
        body: { trust: 'team' },
      },
    );
    expect(token.status).toBe(201);
    expect(token.body.data).toMatchObject({ trust: 'team' });
    expect(token.body.data).not.toHaveProperty('labels');
    expect(token.body.data.token).toMatch(/^fgreg_/u);

    const agentId = await h.createAgent();
    const runId = await h.enqueue(agentId);
    const runner = await h.registerRunner();
    await claim(h, runner);
    const patched = await h.request(
      'PATCH',
      `/agents/runners/${runner.runnerId}`,
      {
        user: 'alice',
        can: ADMIN,
        body: { slots: 3 },
      },
    );
    expect(patched.body.data).toMatchObject({ slots: 3 });
    const revoked = await h.request(
      'POST',
      `/agents/runners/${runner.runnerId}/revoke`,
      {
        user: 'alice',
        can: ADMIN,
      },
    );
    expect(revoked.body.data.status).toBe('revoked');
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'queued',
      failureReason: 'runnerOffline',
    });
  });

  it('deletes a runner only once it is revoked', async () => {
    h = await createHarness();
    const runner = await h.registerRunner();
    const path = `/agents/runners/${runner.runnerId}`;
    const early = await h.request('DELETE', path, {
      user: 'alice',
      can: ADMIN,
    });
    expect(early.status).toBe(400);
    expect(early.body.error.reason).toBe('RUNNER_NOT_REVOKED');
    expect(
      (
        await h.request('DELETE', path, {
          user: 'bob',
          can: ['agents.runners/read'],
        })
      ).status,
    ).toBe(403);
    expect((await h.request('GET', path, { user: 'bob' })).status).toBe(404);
    await h.request('POST', `${path}/revoke`, { user: 'alice', can: ADMIN });
    const deleted = await h.request('DELETE', path, {
      user: 'alice',
      can: ADMIN,
    });
    expect(deleted.status).toBe(204);
    expect(
      (await h.request('GET', path, { user: 'alice', can: ADMIN })).status,
    ).toBe(404);
  });

  it('says which agents a runner takes and which runs it holds', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ name: 'Coder' });
    const runId = await h.enqueue(agentId, '7');
    const runner = await h.registerRunner();
    const codexOnly = await h.registerRunner({
      name: 'codex',
      tools: [{ kind: 'codex', authenticated: true }],
    });
    await claim(h, runner);

    const list = await h.request('GET', '/agents/runners', {
      user: 'alice',
      can: ADMIN,
    });
    const takes = (id: string) =>
      list.body.data.find((item: { id: string }) => item.id === id).takes;
    expect(takes(runner.runnerId)).toEqual([{ id: agentId, name: 'Coder' }]);
    expect(takes(codexOnly.runnerId)).toEqual([]);

    const work = await h.request(
      'GET',
      `/agents/runners/${runner.runnerId}/work`,
      { user: 'alice', can: ADMIN },
    );
    expect(work.body.data).toEqual([
      expect.objectContaining({
        id: runId,
        kind: 'run',
        title: 'Coder',
        path: '/samples/7',
      }),
    ]);
  });

  it('shows people their own runs, and every run to readers', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const mine = await h.enqueue(agentId, '1', { actorUserId: 'bob' });
    const theirs = await h.enqueue(agentId, '2', { actorUserId: 'carol' });

    const own = await h.request('GET', '/agents/runs', { user: 'bob' });
    expect(own.body.data.map((run: { id: string }) => run.id)).toEqual([mine]);
    expect(
      (await h.request('GET', `/agents/runs/${theirs}`, { user: 'bob' }))
        .status,
    ).toBe(404);
    expect(
      (
        await h.request('POST', `/agents/runs/${theirs}/cancel`, {
          user: 'bob',
        })
      ).status,
    ).toBe(404);

    const all = await h.request('GET', '/agents/runs?subjectKind=sample', {
      user: 'dave',
      can: ['agents.agents/read'],
    });
    expect(all.body.data).toHaveLength(2);
    expect(
      (
        await h.request('POST', `/agents/runs/${theirs}/cancel`, {
          user: 'dave',
          can: ['agents.agents/read'],
        })
      ).status,
    ).toBe(403);

    const detail = await h.request('GET', `/agents/runs/${mine}`, {
      user: 'bob',
    });
    expect(detail.body.data).toMatchObject({
      id: mine,
      inputs: [{ text: 'Please do it.' }],
    });
    const cancelled = await h.request('POST', `/agents/runs/${mine}/cancel`, {
      user: 'bob',
    });
    expect(cancelled.body.data.status).toBe('cancelled');

    const retried = await h.request('POST', `/agents/runs/${mine}/retry`, {
      user: 'bob',
    });
    expect(retried.status).toBe(200);
    expect(retried.body.data).toMatchObject({
      retryOfRunId: mine,
      status: 'queued',
      actorUserId: 'bob',
    });
    const retryDetail = await h.services.runs.detail(retried.body.data.id);
    expect(retryDetail.inputs.map((input) => input.type)).toEqual([
      'comment',
      'retry',
    ]);
    const twice = await h.request('POST', `/agents/runs/${mine}/retry`, {
      user: 'bob',
    });
    expect(twice.status).toBe(400);
    expect(twice.body.error.reason).toBe('AGENT_BUSY');
  });

  it('pages a run transcript after a seq', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const runId = await h.enqueue(agentId, '1', { actorUserId: 'bob' });
    const runner = await h.registerRunner();
    await claim(h, runner);
    await h.request('POST', `/agents/runners/runs/${runId}/events`, {
      runnerKey: runner.key,
      body: {
        events: [1, 2, 3].map((seq) => ({
          seq,
          at: 'x',
          type: 'text',
          content: `e${seq}`,
        })),
      },
    });
    const page = await h.request(
      'GET',
      `/agents/runs/${runId}/events?after=1&pageSize=1`,
      {
        user: 'bob',
      },
    );
    expect(page.body.data).toEqual([
      expect.objectContaining({ seq: 2, content: 'e2' }),
    ]);
    expect(page.body.meta.lastSeq).toBe(2);
    const next = await h.request(
      'GET',
      `/agents/runs/${runId}/events?pageToken=${page.body.meta.nextPageToken}`,
      { user: 'bob' },
    );
    expect(next.body.data).toEqual([
      expect.objectContaining({ seq: 3, content: 'e3' }),
    ]);
  });

  it("lets a personal runner's owner share it with the team", async () => {
    h = await createHarness();
    const runner = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'bob',
    });
    const path = `/agents/runners/${runner.runnerId}`;
    const mine = await h.request('GET', '/agents/runners', {
      user: 'bob',
    });
    expect(mine.body.data).toEqual([
      expect.objectContaining({
        id: runner.runnerId,
        canManage: true,
        canChangeTrust: true,
      }),
    ]);
    expect(
      (await h.request('GET', '/agents/runners', { user: 'carol' })).body.data,
    ).toEqual([]);
    expect(
      (
        await h.request('PATCH', path, {
          user: 'carol',
          can: ['agents.agents/read'],
          body: { trust: 'team' },
        })
      ).status,
    ).toBe(403);
    const shared = await h.request('PATCH', path, {
      user: 'bob',
      body: { trust: 'team' },
    });
    expect(shared.body.data.trust).toBe('team');
  });

  it('lets the owner or a manager of runners choose its coding tools', async () => {
    h = await createHarness();
    const token = await h.request(
      'POST',
      '/agents/runners/registrationTokens',
      { user: 'bob', body: { enabledTools: ['codex'] } },
    );
    expect(token.status).toBe(201);
    expect(token.body.data).toMatchObject({
      trust: 'ownerOnly',
      enabledTools: ['codex'],
    });
    const none = await h.request('POST', '/agents/runners/registrationTokens', {
      user: 'bob',
      body: { enabledTools: [] },
    });
    expect(none.status).toBe(400);
    const unknown = await h.request(
      'POST',
      '/agents/runners/registrationTokens',
      { user: 'bob', body: { enabledTools: ['cursor'] } },
    );
    expect(unknown.status).toBe(400);

    const agentId = await h.createAgent();
    const runner = await h.registerRunner({
      trust: 'team',
      ownerUserId: 'bob',
      enabledTools: ['codex'],
    });
    const online = async () =>
      (
        await h.request('GET', '/agents', {
          user: 'alice',
          can: ['agents.agents/read'],
        })
      ).body.data.find((agent: { id: string }) => agent.id === agentId)
        .onlineRunners;
    expect(await online()).toBe(0);
    const listed = await h.request('GET', '/agents/runners', {
      user: 'bob',
    });
    expect(listed.body.data).toEqual([
      expect.objectContaining({ id: runner.runnerId, enabledTools: ['codex'] }),
    ]);

    const path = `/agents/runners/${runner.runnerId}`;
    const reader = await h.request('PATCH', path, {
      user: 'carol',
      can: ['agents.agents/read', 'agents.runners/read'],
      body: { enabledTools: null },
    });
    expect(reader.status).toBe(403);
    const owner = await h.request('PATCH', path, {
      user: 'bob',
      body: { enabledTools: ['claude', 'codex'] },
    });
    expect(owner.status).toBe(200);
    expect(owner.body.data.enabledTools).toEqual(['claude', 'codex']);
    expect(await online()).toBe(1);
    const manager = await h.request('PATCH', path, {
      user: 'carol',
      can: ['agents.runners/manage'],
      body: { enabledTools: [] },
    });
    expect(manager.body.data.enabledTools).toEqual([]);
    expect(await online()).toBe(0);
  });

  it('refuses variables with SECRETS_KEY_MISSING when no secrets key is configured', async () => {
    h = await createHarness({ secrets: null });
    const agentId = await h.createAgent();
    const set = await h.request(
      'PUT',
      `/agents/variables/agent/${agentId}/API_KEY`,
      { user: 'alice', can: ADMIN, body: { value: 'k-123' } },
    );
    expect(set.status).toBe(503);
    expect(set.body.error).toMatchObject({
      reason: 'SECRETS_KEY_MISSING',
      domain: 'agents',
      message:
        'Secrets need a key: set secrets.keys in the application configuration, or SECRETS_KEYS in the environment.',
    });
  });

  it('keeps variables sealed and write-only, reveals them on request and audits it', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const base = `/agents/variables/agent/${agentId}`;
    const set = await h.request('PUT', `${base}/API_KEY`, {
      user: 'alice',
      can: ADMIN,
      body: { value: 'k-123' },
    });
    expect(set.status).toBe(200);
    expect(set.body.data).toMatchObject({ name: 'API_KEY' });
    for (const name of ['bad-name', 'PATH', 'ACME_TOKEN'])
      expect(
        (
          await h.request('PUT', `${base}/${name}`, {
            user: 'alice',
            can: ADMIN,
            body: { value: 'x' },
          })
        ).status,
      ).toBe(400);
    expect(
      (
        await h.request('PUT', `${base}/BIG`, {
          user: 'alice',
          can: ADMIN,
          body: { value: 'x'.repeat(9000) },
        })
      ).status,
    ).toBe(400);
    const read = await h.request('GET', base, {
      user: 'alice',
      can: ['agents.agents/read'],
    });
    expect(read.body.data).toEqual([
      expect.objectContaining({ name: 'API_KEY', updatedById: 'alice' }),
    ]);
    expect(JSON.stringify(read.body.data)).not.toContain('k-123');
    const stored = await h.database
      .connection()
      .query.selectFrom('agSecrets')
      .select(['valueEncrypted'])
      .execute();
    expect(String(stored[0]?.valueEncrypted)).not.toContain('k-123');

    expect(
      (
        await h.request('POST', `${base}/reveal`, {
          user: 'bob',
          can: ['agents.agents/read'],
        })
      ).status,
    ).toBe(403);
    const revealed = await h.request('POST', `${base}/reveal`, {
      user: 'alice',
      can: ADMIN,
    });
    expect(revealed.body.data).toEqual([{ name: 'API_KEY', value: 'k-123' }]);
    const audits = await h.request('GET', `${base}/audits`, {
      user: 'alice',
      can: ADMIN,
    });
    expect(
      audits.body.data.map((audit: { action: string }) => audit.action),
    ).toEqual(['reveal', 'set']);
    expect(
      (
        await h.request('DELETE', `${base}/API_KEY`, {
          user: 'alice',
          can: ADMIN,
        })
      ).status,
    ).toBe(204);

    // A scope nobody registered is not one; a working directory's: nobody decides without the application.
    expect(
      (
        await h.request('GET', '/agents/variables/team/t-1', {
          user: 'alice',
          can: ADMIN,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await h.request('GET', '/agents/variables/workdir/res-1', {
          user: 'alice',
          can: ADMIN,
        })
      ).status,
    ).toBe(404);
    const release = h.services.scopes.register({
      key: 'team',
      title: { key: 'scopes.team', ns: 'test' },
      access: (_id, userId) =>
        Promise.resolve({ visible: true, manage: userId === 'lead' }),
    });
    expect(
      (
        await h.request('PUT', '/agents/variables/team/t-1/DB_URL', {
          user: 'member',
          body: { value: 'x' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request('PUT', '/agents/variables/team/t-1/DB_URL', {
          user: 'lead',
          body: { value: 'x' },
        })
      ).status,
    ).toBe(200);
    // The application's scopes, and what it calls its subjects, for the pages.
    const vocabulary = await h.request('GET', '/agents/vocabulary', {
      user: 'alice',
      can: ['agents.agents/read'],
    });
    expect(vocabulary.status).toBe(200);
    expect(vocabulary.body.data.scopes).toEqual([
      {
        key: 'team',
        title: { key: 'scopes.team', ns: 'test' },
        description: null,
      },
      {
        key: 'workdir',
        title: { key: 'scopes.workdir', ns: '@nocobase/app-plugin-agents' },
        description: null,
      },
    ]);
    expect(
      vocabulary.body.data.subjects.map(
        (subject: { kind: string }) => subject.kind,
      ),
    ).toEqual(['consultation', 'conversation', 'sample']);
    expect(vocabulary.body.data.subjects[0]).toMatchObject({
      kind: 'consultation',
      triggers: {
        consultation: {
          key: 'runs.trigger.consultation',
          ns: '@nocobase/app-plugin-agents',
        },
      },
    });
    expect(vocabulary.body.data.subjects[1]).toMatchObject({
      kind: 'conversation',
      preview: true,
    });
    expect(vocabulary.body.data.subjects[2]).toMatchObject({
      title: { key: 'subjects.sample', ns: 'test' },
      triggers: { nudge: { key: 'triggers.nudge', ns: 'test' } },
      preview: true,
    });
    // Labels only: anyone signed in reads them, for the run panels on other pages.
    expect(
      (
        await h.request('GET', '/agents/vocabulary', {
          user: 'member',
        })
      ).status,
    ).toBe(200);
    release();
  });

  it('keeps every version of a skill and restores an old one as a new version', async () => {
    h = await createHarness();
    const first = skillMd('pr-etiquette', 'How we write PRs.');
    const created = await h.request('POST', '/agents/skills', {
      user: 'alice',
      can: ADMIN,
      body: { content: first },
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      slug: 'pr-etiquette',
      name: 'pr-etiquette',
      description: 'How we write PRs.',
      version: 1,
      content: first,
      files: [],
    });
    const id = created.body.data.id as string;
    const saved = await h.request('PATCH', `/agents/skills/${id}`, {
      user: 'alice',
      can: ADMIN,
      body: {
        content: skillMd(
          'pull-requests',
          'How we write pull requests.',
          '# PRs\n\nUse conventional titles.',
        ),
        files: [{ path: 'scripts/check.sh', content: 'echo ok' }],
        note: 'Titles',
        expectedRevision: 1,
      },
    });
    // A new name in the front matter renames the skill.
    expect(saved.body.data).toMatchObject({
      version: 2,
      fileCount: 1,
      slug: 'pull-requests',
      scripts: ['scripts/check.sh'],
    });
    for (const path of ['../x', '/etc/x', 'SKILL.md', 'scripts/check.sh/x'])
      expect(
        (
          await h.request('PATCH', `/agents/skills/${id}`, {
            user: 'alice',
            can: ADMIN,
            body: {
              content: skillMd('pull-requests', 'x'),
              files: [
                { path: 'scripts/check.sh', content: '' },
                { path, content: '' },
              ],
              expectedRevision: 2,
            },
          })
        ).status,
      ).toBe(400);
    const versions = await h.request('GET', `/agents/skills/${id}/versions`, {
      user: 'bob',
      can: ['agents.agents/read'],
    });
    expect(
      versions.body.data.map((version: { version: number }) => version.version),
    ).toEqual([2, 1]);
    const restored = await h.request(
      'POST',
      `/agents/skills/${id}/versions/1/restore`,
      { user: 'alice', can: ADMIN, body: { expectedRevision: 2 } },
    );
    // Restoring the first version restores its name too.
    expect(restored.body.data).toMatchObject({
      version: 3,
      slug: 'pr-etiquette',
      description: 'How we write PRs.',
      content: first,
      files: [],
    });
    const agentId = await h.createAgent({ skillIds: [id] });
    const detail = await h.request('GET', `/agents/skills/${id}`, {
      user: 'bob',
      can: ['agents.agents/read'],
    });
    expect(detail.body.data.attachments).toEqual([
      { scope: 'agent', scopeId: agentId, name: 'Coder' },
    ]);
    expect(detail.body.data.agentCount).toBe(1);
    expect(
      (
        await h.request('DELETE', `/agents/skills/${id}`, {
          user: 'alice',
          can: ADMIN,
        })
      ).status,
    ).toBe(204);
    expect((await h.services.agents.get(agentId)).skillIds).toEqual([]);
  });
});
