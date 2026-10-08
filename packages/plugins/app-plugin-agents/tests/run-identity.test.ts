import { afterEach, describe, expect, it } from 'vitest';

import { claim, createHarness, type Harness } from './harness.js';

/**
 * Work done as different people on one subject: it is queued as separate runs, claimed one at a time, and its
 * variables reach only runners whose owner may change where they are kept. `owner` owns every agent here.
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

    it("hands the agent's variables to a team runner and its owner's runner only", async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      await h.services.variables.set(
        { scope: 'agent', scopeId: agentId },
        'API_TOKEN',
        'secret',
        'owner',
      );

      // Bob's personal runner may not receive the owner's variables: his run waits, and says why.
      const theirs = await comment('bob', 'Have a look.', agentId);
      const bobRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'bob',
      });
      expect(await claim(h, bobRunner)).toEqual([]);
      expect((await h.services.runs.get(theirs.runId)).status).toBe('queued');
      expect(await waitOf(theirs.runId)).toBe('secretsNotAllowed');
      expect(
        (
          await h.services.variables.audits({
            scope: 'agent',
            scopeId: agentId,
          })
        ).filter((audit) => audit.action === 'deliver'),
      ).toEqual([]);

      // A team runner takes it as before, with the variables.
      const team = await h.registerRunner();
      const [shared] = await claim(h, team);
      expect(shared.run.id).toBe(theirs.runId);
      expect(shared.workspace.env).toEqual([
        { name: 'API_TOKEN', value: 'secret' },
      ]);

      // The owner's personal runner takes the owner's run, with the variables.
      const mine = await h.services.runs.enqueue({
        agentId,
        subject: { kind: 'sample', id: '2' },
        actorUserId: 'owner',
        input: {
          type: 'comment',
          actor: { kind: 'user', id: 'owner', name: 'owner' },
          text: 'Fix it.',
        },
      });
      const ownerRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'owner',
      });
      const [own] = await claim(h, ownerRunner);
      expect(own.run.id).toBe(mine.runId);
      expect(env(own)).toEqual(['API_TOKEN']);
    });

    it('hands them to the runner of someone the application lets edit the agent', async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      await h.services.variables.set(
        { scope: 'agent', scopeId: agentId },
        'API_TOKEN',
        'secret',
        'owner',
      );
      const theirs = await comment('bob', 'Have a look.', agentId);
      const bobRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'bob',
      });
      expect(await claim(h, bobRunner)).toEqual([]);

      const release = h.services.secretTrust.setAgentEditors((_agent, userId) =>
        Promise.resolve(userId === 'bob'),
      );
      const [payload] = await claim(h, bobRunner);
      expect(payload.run.id).toBe(theirs.runId);
      expect(env(payload)).toEqual(['API_TOKEN']);
      release();
    });

    it("checks every scope the variables come from, by the scope's own rules", async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      const managers = new Set<string>();
      h.services.scopes.register({
        key: 'team',
        title: { key: 'scopes.team', ns: 'test' },
        access: (_scopeId, userId) =>
          Promise.resolve({ visible: true, manage: managers.has(userId) }),
      });
      h.scopes = [{ scope: 'team', scopeId: 't-1' }];
      await h.services.variables.set(
        { scope: 'team', scopeId: 't-1' },
        'TEAM_TOKEN',
        'team',
        'owner',
      );
      const mine = await comment('owner', 'Fix it.', agentId);
      const ownerRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'owner',
      });

      // The agent's owner may not change the team's variables, so not on a runner of their own either.
      expect(await claim(h, ownerRunner)).toEqual([]);
      expect(await waitOf(mine.runId)).toBe('secretsNotAllowed');

      managers.add('owner');
      const [payload] = await claim(h, ownerRunner);
      expect(payload.run.id).toBe(mine.runId);
      expect(env(payload)).toEqual(['TEAM_TOKEN']);
    });

    it('gives a run back untouched when its runner is refused the variables at delivery', async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      let mayManage = true;
      h.services.scopes.register({
        key: 'team',
        title: { key: 'scopes.team', ns: 'test' },
        access: () => Promise.resolve({ visible: true, manage: mayManage }),
      });
      h.scopes = [{ scope: 'team', scopeId: 't-1' }];
      await h.services.variables.set(
        { scope: 'team', scopeId: 't-1' },
        'TEAM_TOKEN',
        'team',
        'owner',
      );
      const mine = await comment('owner', 'Fix it.', agentId);
      const reset = await h.request(
        'POST',
        '/agents/workspaces/sample/1/reset',
        { user: 'owner' },
      );
      expect(reset.status).toBe(204);
      const ownerRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'owner',
      });
      // Taken away while the claim prepares, after the runner was found fit.
      const release = h.services.briefs.sections.register({
        key: 'revoke',
        prepare: () => {
          mayManage = false;
          return Promise.resolve(null);
        },
        section: () => null,
      });

      expect(await claim(h, ownerRunner)).toEqual([]);
      const back = await h.services.runs.get(mine.runId);
      expect(back).toMatchObject({
        status: 'queued',
        runnerId: null,
        attempt: 1,
      });
      expect(await waitOf(mine.runId)).toBe('secretsNotAllowed');
      expect(
        (
          await h.services.variables.audits({ scope: 'team', scopeId: 't-1' })
        ).filter((audit) => audit.action === 'deliver'),
      ).toEqual([]);
      const tokens = await h.database
        .connection()
        .repository<{ revokedAt: string | null }>('agRunTokens')
        .findMany({ filter: { runId: mine.runId } });
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.every((token) => token.revokedAt !== null)).toBe(true);

      // Allowed again: the next claim gets the same input and the reset the first one used up.
      release();
      mayManage = true;
      const [payload] = await claim(h, ownerRunner);
      expect(payload.run).toMatchObject({ id: mine.runId, attempt: 1 });
      expect(
        payload.inputs.map((input: { text: string }) => input.text),
      ).toEqual(['Fix it.']);
      expect(payload.workspace.clean).toBe(true);
      expect(env(payload)).toEqual(['TEAM_TOKEN']);
      expect(await waitOf(mine.runId)).toBeUndefined();
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
    it('counts only the runners that would take the work, variables included', async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      await h.services.variables.set(
        { scope: 'agent', scopeId: agentId },
        'API_TOKEN',
        'secret',
        'owner',
      );
      const agent = await h.services.agents.get(agentId);
      const conn = h.services.tx.read();
      const bobRunner = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'bob',
      });
      await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'owner' });
      const online = async (userId: string) =>
        (await h.services.availability(conn, [agent], userId)).get(agentId)
          ?.online;

      // Bob's own runner may not receive the owner's variables; the owner's runner takes only the owner's work.
      expect(
        await h.services.eligibility.canClaim(conn, agent, {
          actorUserId: 'bob',
        }),
      ).toBe(false);
      expect(await online('bob')).toBe(false);
      expect(await online('owner')).toBe(true);
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

      // Allowed the variables, or a team runner: the work would be taken.
      const release = h.services.secretTrust.setAgentEditors((_agent, userId) =>
        Promise.resolve(userId === 'bob'),
      );
      expect(
        (
          await h.services.eligibility.runnersFor(conn, agent, {
            actorUserId: 'bob',
          })
        ).map((runner) => runner.id),
      ).toEqual([bobRunner.runnerId]);
      release();
      const team = await h.registerRunner();
      expect(
        (
          await h.services.eligibility.runnersFor(conn, agent, {
            actorUserId: 'bob',
          })
        ).map((runner) => runner.id),
      ).toEqual([team.runnerId]);
      expect(await online('bob')).toBe(true);
    });

    it('checks the scopes and features the caller names, as the claim would', async () => {
      h = await createHarness();
      const agentId = await h.createAgent();
      h.services.scopes.register({
        key: 'team',
        title: { key: 'scopes.team', ns: 'test' },
        access: () => Promise.resolve({ visible: true, manage: false }),
      });
      await h.services.variables.set(
        { scope: 'team', scopeId: 't-1' },
        'TEAM_TOKEN',
        'team',
        'owner',
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
