// @vitest-environment node
/**
 * Studio's built-in agents: the seed gives a new installation a project lead on Claude Code then Codex and a project
 * assistant waiting for a model, owned by the initial administrator, and adds nothing when it runs again.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import seed from '../../database/main/seeds/202610010030_studio_builtin_agents.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
});
afterEach(() => h.close());

async function run(): Promise<void> {
  const conn = h.database.connection();
  await seed.run({
    query: conn.query,
    repository: (name: string) => conn.repository(name),
    config: { get: () => undefined },
  } as never);
}

async function makeRoot(userId: string): Promise<void> {
  const now = new Date();
  await h.database
    .connection()
    .query.insertInto('authorizationPermissionSetAssignments')
    .values({
      id: `user:${userId}:root`,
      subjectType: 'user',
      subjectId: userId,
      permissionSetKey: 'root',
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}

describe('the built-in agents seed', () => {
  it('creates nothing without an initial administrator to own them', async () => {
    await run();
    expect(await h.agents.agents.list()).toEqual([]);
  });

  it('creates the project lead and the project assistant once', async () => {
    await makeRoot('root-1');
    await run();
    const agents = await h.agents.agents.list();
    expect(agents.map((agent) => agent.id).sort()).toEqual([
      'studio-project-assistant',
      'studio-project-lead',
    ]);
    const lead = await h.agents.agents.get('studio-project-lead');
    expect(lead).toMatchObject({
      // English, translated where it is shown until someone renames it.
      name: 'Project lead',
      nameText: {
        key: 'studioAgents.presets.projectLead.name',
        ns: '@nocobase/i18n/application',
      },
      descriptionText: {
        key: 'studioAgents.presets.projectLead.description',
        ns: '@nocobase/i18n/application',
      },
      type: 'runner',
      modelEntries: [
        { tool: 'claude', model: null, effort: null },
        { tool: 'codex', model: null, effort: null },
      ],
      access: 'everyone',
      ownerUserId: 'root-1',
      revision: 1,
    });
    expect(lead.actions).toEqual(
      expect.arrayContaining(['pm.issues/edit', 'studio.git/open-pr']),
    );
    expect(lead.instructions).toContain('project lead');
    const assistant = await h.agents.agents.get('studio-project-assistant');
    expect(assistant).toMatchObject({
      name: 'Project assistant',
      type: 'online',
      modelEntries: [],
      ownerUserId: 'root-1',
    });
    // The assistant is the team's default chat agent.
    expect((await h.agents.chat.settings()).defaultAgentId).toBe(
      'studio-project-assistant',
    );
    expect(await h.agents.agents.history('studio-project-lead')).toEqual([
      expect.objectContaining({ action: 'created', revision: 1 }),
    ]);

    // The assistant needs a model: it is offered no work until it has one.
    const roster = await h.request('GET', '/agents/available', {
      user: 'root-1',
    });
    expect(roster.body.data.map((agent: { id: string }) => agent.id)).toEqual([
      'studio-project-lead',
    ]);

    // A replay adds nothing and keeps what an administrator changed, the default chat agent included.
    await h.agents.chat.updateSettings('root-1', {
      defaultAgentId: 'studio-project-lead',
    });
    await h.agents.agents.update('studio-project-lead', 'root-1', {
      name: 'Lead',
      expectedRevision: 1,
    });
    await run();
    expect(await h.agents.agents.list()).toHaveLength(2);
    expect(await h.agents.agents.get('studio-project-lead')).toMatchObject({
      name: 'Lead',
      nameText: null,
    });
    expect((await h.agents.chat.settings()).defaultAgentId).toBe(
      'studio-project-lead',
    );
  });
});
