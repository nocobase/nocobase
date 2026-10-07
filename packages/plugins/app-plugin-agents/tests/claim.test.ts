import { RunPayloadSchema, SkillBundleSchema } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import { claim, createHarness, skillMd, type Harness } from './harness.js';

describe('claiming', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  it('hands a queued run to a runner with a complete payload', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ instructions: 'Be brief.' });
    const runId = await h.enqueue(agentId, '7', { text: 'Fix the login.' });
    const runner = await h.registerRunner();

    const [payload] = await claim(h, runner);
    expect(RunPayloadSchema.parse(payload)).toEqual(payload);
    expect(payload).toMatchObject({
      run: { id: runId, attempt: 1, maxAttempts: 3, firstSeq: 1 },
      app: { id: 'acme', name: 'Acme' },
      subject: { key: 'SMP-7', url: '/samples/SMP-7' },
      tool: { kind: 'claude', policy: { permissionMode: 'acceptEdits' } },
      prompt: { turn: 'Fix the login.', session: 'fresh' },
      workspace: { dirs: [], env: [] },
      skills: [],
      cli: { name: 'acme', credential: { file: '.acme/run.json' } },
    });
    expect(payload.workspace).not.toHaveProperty('clean');
    // Rules, workspace and environment check, then the task, the context and the agent's own instructions.
    expect(payload.prompt.system).toMatch(
      /^You are Coder[\s\S]*AGENTS\.md, CLAUDE\.md or README[\s\S]*\{\{runner\.workspaceInit\}\}[\s\S]*Work on the sample\.\n\nSample 7[\s\S]*Be brief\.$/u,
    );
    expect(payload.cli.credential.content).toMatchObject({
      runId,
      token: expect.stringMatching(/^fgr_/u),
    });
    expect(payload.inputs).toHaveLength(1);
    expect((await h.services.runs.get(runId)).status).toBe('dispatched');
    expect(await claim(h, runner)).toEqual([]);

    // The brief is kept for people to read.
    const brief = await h.request('GET', `/agents/runs/${runId}/brief`, {
      user: 'owner',
    });
    expect(brief.status).toBe(200);
    expect(brief.body.data).toMatchObject({
      runId,
      attempt: 1,
      turn: 'Fix the login.',
      prompt: payload.prompt.system,
      layers: { task: 'Work on the sample.', context: 'Sample 7' },
    });
  });

  it('matches the tool, the named runners, trust and features', async () => {
    h = await createHarness();
    const codex = await h.createAgent({
      modelEntries: [{ tool: 'codex', model: null }],
    });
    const plain = await h.createAgent();
    await h.enqueue(codex, '1');
    await h.enqueue(plain, '2', { actorUserId: 'bob' });

    // Owned by alice, trusted only with her work, and Codex is not signed in there.
    const personal = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'alice',
      tools: [
        { kind: 'claude', authenticated: true },
        { kind: 'codex', authenticated: false },
      ],
    });
    expect(await claim(h, personal, 4)).toEqual([]);

    const basic = await h.registerRunner({ slots: 4 });
    expect((await claim(h, basic, 4)).map((run) => run.subject.key)).toEqual([
      'SMP-2',
    ]);

    // Codex signed in; an agent that names another runner is not for this one.
    const named = await h.createAgent({ runnerIds: [basic.runnerId] });
    await h.enqueue(named, '3');
    const capable = await h.registerRunner({
      tools: [
        { kind: 'claude', authenticated: true },
        { kind: 'codex', authenticated: true },
      ],
      slots: 4,
    });
    expect((await claim(h, capable, 4)).map((run) => run.subject.key)).toEqual([
      'SMP-1',
    ]);
    expect((await claim(h, basic, 4)).map((run) => run.subject.key)).toEqual([
      'SMP-3',
    ]);
  });

  it("takes a run with the first of the agent's entries the runner has signed in", async () => {
    h = await createHarness();
    const agentId = await h.createAgent({
      modelEntries: [
        { tool: 'codex', model: 'gpt-6', effort: 'xhigh' },
        { tool: 'claude', model: 'opus', effort: 'max' },
        { tool: 'claude', model: null },
      ],
    });
    const first = await h.enqueue(agentId, '1');
    // Codex is not signed in here: the first Claude entry is taken, and recorded on the run.
    const claudeOnly = await h.registerRunner({
      tools: [
        { kind: 'claude', authenticated: true },
        { kind: 'codex', authenticated: false },
      ],
    });
    const [onClaude] = await claim(h, claudeOnly);
    // The entry's effort goes with it.
    expect(onClaude?.tool).toMatchObject({
      kind: 'claude',
      model: 'opus',
      effort: 'max',
    });
    expect(await h.services.runs.get(first)).toMatchObject({
      tool: 'claude',
      modelService: null,
      model: 'opus',
      effort: 'max',
    });

    // A runner with both takes the first entry.
    const second = await h.enqueue(agentId, '2');
    const both = await h.registerRunner({
      tools: [
        { kind: 'claude', authenticated: true },
        { kind: 'codex', authenticated: true },
      ],
    });
    const [onCodex] = await claim(h, both);
    expect(onCodex?.tool).toMatchObject({
      kind: 'codex',
      model: 'gpt-6',
      effort: 'xhigh',
    });
    expect(await h.services.runs.get(second)).toMatchObject({
      tool: 'codex',
      model: 'gpt-6',
      effort: 'xhigh',
    });

    // A runner with none of its tools takes nothing.
    await h.enqueue(agentId, '3');
    const pi = await h.registerRunner({
      tools: [{ kind: 'pi', authenticated: true }],
    });
    expect(await claim(h, pi)).toEqual([]);
  });

  it('offers a runner only the coding tools enabled on it', async () => {
    h = await createHarness();
    const onClaude = await h.createAgent();
    const onCodex = await h.createAgent({
      modelEntries: [{ tool: 'codex', model: null }],
    });
    await h.enqueue(onClaude, '1');
    await h.enqueue(onCodex, '2');
    // Both tools are installed and signed in; only Codex is enabled.
    const runner = await h.registerRunner({
      enabledTools: ['codex'],
      tools: [
        { kind: 'claude', authenticated: true },
        { kind: 'codex', authenticated: true },
      ],
      slots: 4,
    });
    expect((await claim(h, runner, 4)).map((run) => run.subject.key)).toEqual([
      'SMP-2',
    ]);
    expect(await claim(h, runner, 4)).toEqual([]);

    await h.services.runners.update(runner.runnerId, {
      enabledTools: ['claude', 'codex'],
    });
    expect((await claim(h, runner, 4)).map((run) => run.subject.key)).toEqual([
      'SMP-1',
    ]);
  });

  it('requires what the payload needs from the runner', async () => {
    h = await createHarness();
    const skill = await h.services.skills.create('owner', {
      content: skillMd('pr-etiquette', 'How we write pull requests.'),
    });
    const agentId = await h.createAgent({ skillIds: [skill.id] });
    const runId = await h.enqueue(agentId, '1');
    const old = await h.registerRunner({ features: ['input', 'checkout'] });
    expect(await claim(h, old)).toEqual([]);
    expect((await h.services.runs.get(runId)).status).toBe('queued');

    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    expect(payload.run.requires).toEqual(['skills']);
    expect(payload.skills).toEqual([
      {
        slug: 'pr-etiquette',
        name: 'pr-etiquette',
        version: '1',
        hash: expect.stringMatching(/^[0-9a-f]{64}$/u),
        description: 'How we write pull requests.',
        bundleUrl: `/api/agents/runners/runs/${runId}/skills/pr-etiquette`,
      },
    ]);
    expect(payload.prompt.system).toContain('<name>pr-etiquette</name>');

    // The runner fetches the bundle while it holds the run; no one else may. (The harness mounts the API at its root.)
    const bundleUrl = String(payload.skills[0].bundleUrl).replace(
      /^\/api/u,
      '',
    );
    const bundle = await h.request('GET', bundleUrl, {
      runnerKey: runner.key,
    });
    expect(SkillBundleSchema.parse(bundle.body.data)).toMatchObject({
      slug: 'pr-etiquette',
      version: '1',
      hash: payload.skills[0].hash,
    });
    expect(bundle.body.data.files[0]).toEqual({
      path: 'SKILL.md',
      content:
        '---\nname: pr-etiquette\ndescription: How we write pull requests.\n---\n\n# pr-etiquette\n',
    });
    const stranger = await h.request('GET', bundleUrl, {
      runnerKey: old.key,
    });
    expect(stranger.status).toBe(403);

    // A skill in the library that the run does not get is not handed out through the run.
    await h.services.skills.create('owner', {
      content: skillMd('release-checklist', 'Not attached to this agent.'),
    });
    const other = await h.request(
      'GET',
      bundleUrl.replace(/pr-etiquette$/u, 'release-checklist'),
      { runnerKey: runner.key },
    );
    expect(other.status).toBe(404);
    expect(other.body.error.reason).toBe('SKILL_NOT_FOUND');
  });

  it('pins a run to the runner that holds its directory, one run at a time there', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ maxConcurrentRuns: 5 });
    const elsewhere = await h.registerRunner({ slots: 4 });
    const holder = await h.registerRunner({ slots: 4 });
    h.dirs = [
      {
        kind: 'directory',
        path: '/srv/app',
        runnerId: holder.runnerId,
        scopeId: 'res-1',
        initPrompt: 'Run make setup.',
      },
    ];
    const first = await h.enqueue(agentId, '1');
    const second = await h.enqueue(agentId, '2');
    expect(await claim(h, elsewhere, 4)).toEqual([]);
    const claimed = await claim(h, holder, 4);
    expect(claimed.map((payload) => payload.run.id)).toEqual([first]);
    expect(claimed[0].workspace.dirs).toEqual([
      { kind: 'directory', path: '/srv/app', initPrompt: 'Run make setup.' },
    ]);
    expect(claimed[0].run.requires).toEqual(['directories']);

    // The directory is free again once the first run ends.
    const runToken = claimed[0].cli.credential.content.token;
    await h.request('POST', `/agents/runners/runs/${first}/start`, {
      runnerKey: holder.key,
      body: {
        workDir: '/tmp/w',
        adapter: { kind: 'claude' },
        acceptsInput: true,
      },
    });
    expect(runToken).toMatch(/^fgr_/u);
    await h.request('POST', `/agents/runners/runs/${first}/complete`, {
      runnerKey: holder.key,
      body: {
        summary: 'Done.',
        handledInputIds: claimed[0].inputs.map(
          (input: { id: string }) => input.id,
        ),
      },
    });
    expect(
      (await claim(h, holder, 4)).map((payload) => payload.run.id),
    ).toEqual([second]);
  });

  it('merges variables subject scope < working directory < agent and audits their delivery', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    h.scopes = [{ scope: 'team', scopeId: 't-1' }];
    h.dirs = [
      {
        kind: 'repo',
        url: 'https://example.com/app.git',
        defaultBranch: 'main',
        branch: 'agent/SMP-1',
        path: 'app',
        scopeId: 'res-1',
      },
    ];
    const set = (scope: string, id: string, name: string, value: string) =>
      h.services.variables.set({ scope, scopeId: id }, name, value, 'owner');
    await set('team', 't-1', 'API_URL', 'team');
    await set('team', 't-1', 'ONLY_TEAM', 't');
    await set('workdir', 'res-1', 'API_URL', 'workdir');
    await set('workdir', 'res-1', 'TOKEN', 'workdir');
    await set('agent', agentId, 'TOKEN', 'agent');
    await h.enqueue(agentId, '1');

    const noSecrets = await h.registerRunner({
      features: ['input', 'checkout'],
    });
    expect(await claim(h, noSecrets)).toEqual([]);
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    expect(
      Object.fromEntries(
        payload.workspace.env.map((v: { name: string; value: string }) => [
          v.name,
          v.value,
        ]),
      ),
    ).toEqual({ API_URL: 'workdir', ONLY_TEAM: 't', TOKEN: 'agent' });
    expect(payload.run.requires.sort()).toEqual(['checkout', 'secrets']);
    const audits = await h.services.variables.audits({
      scope: 'workdir',
      scopeId: 'res-1',
    });
    expect(audits[0]).toMatchObject({
      action: 'deliver',
      names: ['API_URL', 'TOKEN'],
      runId: payload.run.id,
      runnerId: runner.runnerId,
    });
  });

  it('starts from a fresh working directory once after a reset', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    await h.enqueue(agentId, '1');
    const runner = await h.registerRunner();
    const reset = await h.request('POST', '/agents/workspaces/sample/1/reset', {
      user: 'owner',
    });
    expect(reset.status).toBe(204);
    const [payload] = await claim(h, runner);
    expect(payload.workspace.clean).toBe(true);
    expect(
      (
        await h.request('POST', '/agents/workspaces/sample/1/reset', {
          user: 'stranger',
        })
      ).status,
    ).toBe(403);
  });

  it('keeps each agent within its concurrency limit and each runner within its slots', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ maxConcurrentRuns: 2 });
    for (const subject of ['1', '2', '3']) await h.enqueue(agentId, subject);
    const runner = await h.registerRunner({ slots: 1 });
    expect(await claim(h, runner, 5)).toHaveLength(1);
    expect(await claim(h, runner, 5)).toHaveLength(0);
    const other = await h.registerRunner({ slots: 5 });
    expect(await claim(h, other, 5)).toHaveLength(1);
    expect(await claim(h, other, 5)).toHaveLength(0);
  });

  it('never hands one run to two runners claiming at once', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ maxConcurrentRuns: 50 });
    for (let subject = 1; subject <= 12; subject += 1)
      await h.enqueue(agentId, String(subject));
    const runners = await Promise.all(
      Array.from({ length: 4 }, () => h.registerRunner({ slots: 10 })),
    );
    const claimed = (
      await Promise.all(
        runners.flatMap((runner) => [claim(h, runner, 3), claim(h, runner, 3)]),
      )
    ).flat();
    const ids = claimed.map((payload) => payload.run.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(12);
  });

  it('merges new work for a waiting run, and appends it to one a runner holds', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const first = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      actorUserId: 'owner',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'one',
      },
    });
    const second = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      actorUserId: 'owner',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'two',
      },
    });
    expect(first.outcome).toBe('created');
    expect(second).toMatchObject({ runId: first.runId, outcome: 'merged' });

    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    expect(payload.inputs.map((input: { text: string }) => input.text)).toEqual(
      ['one', 'two'],
    );
    const third = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      actorUserId: 'owner',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'three',
      },
    });
    expect(third).toMatchObject({ runId: first.runId, outcome: 'appended' });
  });

  it('refuses work from someone who may not wake the agent', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ access: 'users', userIds: ['bob'] });
    await expect(
      h.enqueue(agentId, '1', { actorUserId: 'mallory' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      h.enqueue(agentId, '1', { actorUserId: 'bob' }),
    ).resolves.toBeTruthy();
    await h.services.agents.archive(agentId, 'owner');
    await expect(
      h.enqueue(agentId, '2', { actorUserId: 'bob' }),
    ).rejects.toMatchObject({ code: 'AGENT_ARCHIVED' });
  });

  it('leaves a run queued when its payload cannot be assembled, then fails it', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const runId = await h.enqueue(agentId);
    const runner = await h.registerRunner();
    h.failAssembly = true;
    expect(await claim(h, runner)).toEqual([]);
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'queued',
      runnerId: null,
    });
    await claim(h, runner);
    await claim(h, runner);
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'failed',
      failureReason: 'setupFailed',
    });
    expect(h.finished.map((run) => run.id)).toEqual([runId]);
  });

  it('wakes a waiting claim when work arrives', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const runner = await h.registerRunner();
    const waiting = h.request('POST', '/agents/runners/claim?wait=true', {
      runnerKey: runner.key,
      body: { free: 1 },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(h.services.signal.waiting()).toBe(1);
    const runId = await h.enqueue(agentId);
    const response = await waiting;
    expect(
      response.body.data.runs.map((run: { run: { id: string } }) => run.run.id),
    ).toEqual([runId]);

    // Without work, the wait ends empty after the poll timeout.
    const empty = await h.request('POST', '/agents/runners/claim?wait=true', {
      runnerKey: runner.key,
      body: { free: 1 },
    });
    expect(empty.body.data.runs).toEqual([]);
  });
});
