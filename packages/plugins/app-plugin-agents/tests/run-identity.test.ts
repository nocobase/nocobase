import { afterEach, describe, expect, it } from 'vitest';

import { claim, createHarness, type Harness } from './harness.js';

/**
 * Work done as different people on one subject: it is queued as separate runs and claimed one at a time. Its variables
 * go to the runner that takes it, unless one is for team runners only. `owner` owns every agent here.
 */
describe('runs as their actors', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  const comment = (actorUserId: string, text: string, agentId: string) =>
    h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      actorUserId,
      input: {
        type: 'comment',
        actor: { kind: 'user', id: actorUserId, name: actorUserId },
        text,
      },
    });

  const waitOf = async (runId: string) =>
    (await h.services.runs.workload({ subjectKind: 'sample' })).runs.find(
      (run) => run.id === runId,
    )?.wait?.reason;

  it("keeps the owner's work out of a run another person's comment queued", async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const theirs = await comment('bob', 'Have a look.', agentId);
    const mine = await comment('owner', 'Fix the login.', agentId);
    expect(theirs.outcome).toBe('created');
    expect(mine).toMatchObject({ outcome: 'created' });
    expect(mine.runId).not.toBe(theirs.runId);

    // The owner's personal runner takes the owner's run; the other waits for a runner bob may use.
    const personal = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'owner',
    });
    const [payload] = await claim(h, personal);
    expect(payload.run.id).toBe(mine.runId);
    expect(payload.inputs.map((input: { text: string }) => input.text)).toEqual(
      ['Fix the login.'],
    );
    expect((await h.services.runs.get(theirs.runId)).status).toBe('queued');
    expect(await waitOf(theirs.runId)).toBe('noSharedRunner');
  });

  it("keeps another person's work out of the owner's run", async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const mine = await comment('owner', 'Fix the login.', agentId);
    const queued = await comment('bob', 'Also the logout.', agentId);
    expect(queued.outcome).toBe('created');
    expect(queued.runId).not.toBe(mine.runId);

    const team = await h.registerRunner({ slots: 4 });
    const [payload] = await claim(h, team, 4);
    expect(payload.run.id).toBe(mine.runId);
    expect(payload.inputs.map((input: { text: string }) => input.text)).toEqual(
      ['Fix the login.'],
    );

    // Held now: the owner's further work is appended to it, bob's joins his own waiting run, which follows it.
    expect(await comment('owner', 'And the signup.', agentId)).toMatchObject({
      runId: mine.runId,
      outcome: 'appended',
    });
    expect(await comment('bob', 'And the footer.', agentId)).toMatchObject({
      runId: queued.runId,
      outcome: 'merged',
    });
    expect(await claim(h, team, 4)).toEqual([]);
    expect(await waitOf(queued.runId)).toBe('sameWorkActive');
  });

  it("is taken by the actor's personal runner or a team runner, not by another person's", async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const ownerRunner = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'owner',
    });
    const bobRunner = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'bob',
    });
    const team = await h.registerRunner();

    const first = await comment('bob', 'One.', agentId);
    expect(await claim(h, ownerRunner)).toEqual([]);
    expect((await claim(h, bobRunner)).map((run) => run.run.id)).toEqual([
      first.runId,
    ]);

    const second = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '2' },
      actorUserId: 'bob',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'bob', name: 'bob' },
        text: 'Two.',
      },
    });
    expect(await claim(h, ownerRunner)).toEqual([]);
    expect((await claim(h, team)).map((run) => run.run.id)).toEqual([
      second.runId,
    ]);
  });

  describe('with variables', () => {
    const env = (payload: { workspace: { env: { name: string }[] } }) =>
      payload.workspace.env.map((variable) => variable.name);
    const asBob = (agentId: string, subjectId = '1') =>
      h.services.runs.enqueue({
        agentId,
        subject: { kind: 'sample', id: subjectId },
        actorUserId: 'bob',
        input: {
          type: 'comment',
          actor: { kind: 'user', id: 'bob', name: 'bob' },
          text: 'Have a look.',
        },
      });
    const delivered = async (scope: string, scopeId: string) =>
      (await h.services.variables.audits({ scope, scopeId })).filter(
        (audit) => audit.action === 'deliver',
      );

    it('hands the variables to the runner that takes the run, personal ones included', async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      await h.services.variables.set(
        { scope: 'agent', scopeId: agentId },
        'NPM_TOKEN',
        'shared',
        'owner',
      );
      // Bob may use the owner's agent, so his own runner gets its token.
      const theirs = await asBob(agentId);
      const bobRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'bob',
      });
      const [payload] = await claim(h, bobRunner);
      expect(payload.run.id).toBe(theirs.runId);
      expect(payload.workspace.env).toEqual([
        { name: 'NPM_TOKEN', value: 'shared' },
      ]);
      expect(await delivered('agent', agentId)).toHaveLength(1);
    });

    it('keeps a run with a team-only variable off personal runners, and says which', async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      await h.services.variables.set(
        { scope: 'agent', scopeId: agentId },
        'NPM_TOKEN',
        'shared',
        'owner',
      );
      await h.services.variables.set(
        { scope: 'agent', scopeId: agentId },
        'DEPLOY_KEY',
        'secret',
        'owner',
        { teamRunnersOnly: true },
      );
      const notices: string[] = [];
      h.services.events.on('notice', ({ notice }) => {
        notices.push(notice.type);
      });

      // Bob's own runner leaves bob's run: it waits for a team runner and names the variable.
      const theirs = await asBob(agentId);
      const bobRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'bob',
      });
      expect(await claim(h, bobRunner)).toEqual([]);
      expect(await claim(h, bobRunner)).toEqual([]);
      const wait = (
        await h.services.runs.workload({ subjectKind: 'sample' })
      ).runs.find((run) => run.id === theirs.runId)?.wait;
      expect(wait).toMatchObject({
        reason: 'secretsNotAllowed',
        variables: [{ scope: 'agent', scopeId: agentId, name: 'DEPLOY_KEY' }],
      });
      expect(wait?.params).toEqual({ variables: ['DEPLOY_KEY'] });
      expect(notices).toEqual(['run_secrets_not_allowed']);
      expect(await delivered('agent', agentId)).toEqual([]);

      // The owner's own runner too: the mark is about the variable, not about who asks.
      const mine = await comment('owner', 'Fix it.', agentId);
      const ownerRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'owner',
      });
      expect(await claim(h, ownerRunner)).toEqual([]);

      // A team runner takes both, with every variable.
      const team = await h.registerRunner({ slots: 4 });
      const payloads = await claim(h, team, 4);
      expect(payloads.map((payload) => payload.run.id)).toEqual([theirs.runId]);
      expect(env(payloads[0]).sort()).toEqual(['DEPLOY_KEY', 'NPM_TOKEN']);
      expect(await waitOf(mine.runId)).toBe('sameWorkActive');
    });

    it('goes by the value a run gets: a team-only one the agent replaces does not count', async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      h.scopes = [{ scope: 'team', scopeId: 't-1' }];
      await h.services.variables.set(
        { scope: 'team', scopeId: 't-1' },
        'API_TOKEN',
        'team',
        'owner',
        { teamRunnersOnly: true },
      );
      await h.services.variables.set(
        { scope: 'agent', scopeId: agentId },
        'API_TOKEN',
        'agent',
        'owner',
      );
      await comment('owner', 'Fix it.', agentId);
      const ownerRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'owner',
      });
      const [payload] = await claim(h, ownerRunner);
      expect(payload.workspace.env).toEqual([
        { name: 'API_TOKEN', value: 'agent' },
      ]);
    });

    it('changes only the mark when no value is given, and refuses a new variable without one', async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      await h.services.variables.set(
        { scope: 'agent', scopeId: agentId },
        'API_TOKEN',
        'kept',
        'owner',
      );
      const path = `/agents/variables/agent/${agentId}`;
      const manager = { user: 'owner', can: ['agents.agents/manage'] };
      const marked = await h.request('PUT', `${path}/API_TOKEN`, {
        ...manager,
        body: { teamRunnersOnly: true },
      });
      expect(marked.status).toBe(200);
      expect(marked.body.data).toMatchObject({
        name: 'API_TOKEN',
        teamRunnersOnly: true,
      });
      expect(
        await h.services.variables.reveal(
          { scope: 'agent', scopeId: agentId },
          'owner',
        ),
      ).toEqual([{ name: 'API_TOKEN', value: 'kept' }]);
      // Replacing the value keeps the mark.
      await h.request('PUT', `${path}/API_TOKEN`, {
        ...manager,
        body: { value: 'new' },
      });
      expect(
        await h.services.variables.list({ scope: 'agent', scopeId: agentId }),
      ).toMatchObject([{ name: 'API_TOKEN', teamRunnersOnly: true }]);
      const missing = await h.request('PUT', `${path}/OTHER`, {
        ...manager,
        body: { teamRunnersOnly: true },
      });
      expect(missing.status).toBe(400);
    });

    it('leaves a run without variables to personal runners as before', async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      const theirs = await comment('bob', 'Have a look.', agentId);
      const bobRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'bob',
      });
      const [payload] = await claim(h, bobRunner);
      expect(payload.run.id).toBe(theirs.runId);
      expect(payload.workspace.env).toEqual([]);
    });
  });

  describe('eligibility', () => {
    it('counts only the runners that would take the work, team-only variables included', async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      await h.services.variables.set(
        { scope: 'agent', scopeId: agentId },
        'DEPLOY_KEY',
        'secret',
        'owner',
        { teamRunnersOnly: true },
      );
      const agent = await h.services.agents.get(agentId);
      const conn = h.services.tx.read();
      const bobRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'bob',
      });
      const online = async (userId: string) =>
        (await h.services.availability(conn, [agent], userId)).get(agentId)
          ?.online;
      const asBob = { actorUserId: 'bob' };

      expect(await h.services.eligibility.canClaim(conn, agent, asBob)).toBe(
        false,
      );
      expect(await h.services.eligibility.mayQueue(conn, agent, asBob)).toBe(
        false,
      );
      expect(await online('bob')).toBe(false);
      // Without a person, as before: some runner has the tool.
      expect(
        (await h.services.availability(conn, [agent])).get(agentId),
      ).toMatchObject({ online: true });
      const roster = await h.request('GET', '/agents/available', {
        user: 'bob',
      });
      expect(
        roster.body.data.find((each: { id: string }) => each.id === agentId),
      ).toMatchObject({ online: false });
      expect(await h.services.eligibility.teamOnly(conn, agent, {})).toEqual([
        { scope: 'agent', scopeId: agentId, name: 'DEPLOY_KEY' },
      ]);

      // A team runner would take it; without the mark, bob's own runner would too.
      const team = await h.registerRunner();
      expect(
        (await h.services.eligibility.runnersFor(conn, agent, asBob)).map(
          (runner) => runner.id,
        ),
      ).toEqual([team.runnerId]);
      expect(await online('bob')).toBe(true);
      await h.services.variables.set(
        { scope: 'agent', scopeId: agentId },
        'DEPLOY_KEY',
        undefined,
        'owner',
        { teamRunnersOnly: false },
      );
      expect(
        (await h.services.eligibility.runnersFor(conn, agent, asBob))
          .map((runner) => runner.id)
          .sort(),
      ).toEqual([bobRunner.runnerId, team.runnerId].sort());
    });

    it('checks the scopes and features the caller names, as the claim would', async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      await h.services.variables.set(
        { scope: 'team', scopeId: 't-1' },
        'TEAM_TOKEN',
        'team',
        'owner',
        { teamRunnersOnly: true },
      );
      const agent = await h.services.agents.get(agentId);
      const conn = h.services.tx.read();
      await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'owner',
        features: ['input', 'secrets'],
      });
      const asOwner = { actorUserId: 'owner' };
      expect(await h.services.eligibility.canClaim(conn, agent, asOwner)).toBe(
        true,
      );
      expect(
        await h.services.eligibility.canClaim(conn, agent, {
          ...asOwner,
          scopes: [{ scope: 'team', scopeId: 't-1' }],
        }),
      ).toBe(false);
      expect(
        await h.services.eligibility.canClaim(conn, agent, {
          ...asOwner,
          requires: ['checkout'],
        }),
      ).toBe(false);
    });
  });
});
