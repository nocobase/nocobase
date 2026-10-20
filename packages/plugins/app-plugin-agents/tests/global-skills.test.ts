import { afterEach, describe, expect, it } from 'vitest';
import { claim, createHarness, skillMd, type Harness } from './harness.js';
import { mergeRunSkills } from '../server/core/skills/skill.service.js';
import { skillTargets } from '../server/core/runs/claim.js';
import { versionsRepo } from '../server/core/skills/skill.store.js';

let h: Harness;
afterEach(async () => {
  await h?.close();
});
const ADMIN = ['agents.agents/manage'];

describe('team default skills', () => {
  it('resolves attachment display information only on the detail route and in scope batches', async () => {
    h = await createHarness();
    const batches: string[][] = [];
    h.services.scopes.register({
      key: 'project',
      title: 'Project',
      access: async () => ({ visible: true, manage: true }),
      describe: async (ids, userId) => {
        batches.push([...ids]);
        return new Map(
          userId === 'alice'
            ? [['p1', { name: 'Project one', href: '/projects/p1/settings' }]]
            : [],
        );
      },
    });
    const skill = await h.services.skills.create('alice', {
      content: skillMd('named-attachments', 'Rules.'),
    });
    for (const scopeId of ['p1', 'p2'])
      await h.services.skills.attach({ scope: 'project', scopeId }, [skill.id]);
    expect(batches).toEqual([]);
    const result = await h.request('GET', `/agents/skills/${skill.id}`, {
      user: 'alice',
      can: ['agents.agents/read'],
    });
    expect(result.status).toBe(200);
    expect(result.body.data.attachments).toEqual([
      {
        scope: 'project',
        scopeId: 'p1',
        name: 'Project one',
        href: '/projects/p1/settings',
      },
      { scope: 'project', scopeId: 'p2', name: null },
    ]);
    expect(batches).toEqual([['p1', 'p2']]);
    const hidden = await h.request('GET', `/agents/skills/${skill.id}`, {
      user: 'bob',
      can: ['agents.agents/read'],
    });
    expect(
      hidden.body.data.attachments.every(
        (item: { name: string | null; href?: string }) =>
          item.name === null && item.href === undefined,
      ),
    ).toBe(true);
  });
  it('allows only managers to replace global default and never enables global variables or agent skills', async () => {
    h = await createHarness();
    const skill = await h.services.skills.create('alice', {
      content: skillMd('team-default', 'Team rules.'),
    });
    const path = '/agents/skillAttachments/global/default';
    expect((await h.request('GET', path)).status).toBe(401);
    expect(
      (await h.request('GET', path, { user: 'alice', can: [] })).status,
    ).toBe(404);
    expect(
      (
        await h.request('PUT', path, {
          user: 'alice',
          can: ['agents.agents/read'],
          body: { skillIds: [skill.id] },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request('PUT', path, {
          user: 'alice',
          can: ['agents.agents/edit'],
          body: { skillIds: [skill.id] },
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await h.request('PUT', path, {
          user: 'alice',
          can: ADMIN,
          body: { skillIds: [skill.id, skill.id] },
        })
      ).body.data.skillIds,
    ).toEqual([skill.id]);
    expect(
      (
        await h.request('GET', path, {
          user: 'alice',
          can: ['agents.agents/read'],
        })
      ).body.data.skillIds,
    ).toEqual([skill.id]);
    expect(
      (
        await h.request('PUT', path, {
          user: 'alice',
          can: ADMIN,
          body: { skillIds: ['missing'] },
        })
      ).status,
    ).toBe(400);
    expect(
      await h.services.skills.attached({ scope: 'global', scopeId: 'default' }),
    ).toEqual([skill.id]);
    expect(
      (
        await h.request('GET', '/agents/skillAttachments/global/other', {
          user: 'alice',
          can: ADMIN,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await h.request('GET', '/agents/variables/global/default', {
          user: 'alice',
          can: ADMIN,
        })
      ).status,
    ).toBe(404);
    expect(() =>
      h.services.scopes.register({
        key: 'global',
        title: { key: 'global', ns: 'test' },
        access: async () => ({ visible: true, manage: true }),
      }),
    ).toThrow();
    await expect(
      h.services.skills.attach({ scope: 'agent', scopeId: 'a' }, [skill.id]),
    ).rejects.toThrow();
    await expect(
      h.services.skills.attached({ scope: 'agent', scopeId: 'a' }),
    ).rejects.toThrow();
  });

  it('delivers global skills across agents and project scopes, ignores legacy agent rows and removes cleared defaults', async () => {
    h = await createHarness();
    const global = await h.services.skills.create('alice', {
      content: skillMd('team-default', 'Team rules.'),
    });
    const legacy = await h.services.skills.create('alice', {
      content: skillMd('legacy-agent', 'Ignored.'),
    });
    await h.services.skills.attach({ scope: 'global', scopeId: 'default' }, [
      global.id,
    ]);
    const runner = await h.registerRunner({ slots: 10 });
    for (const scopeId of ['project-one', 'project-two', null]) {
      const agent = await h.createAgent({ skillIds: [legacy.id] });
      h.scopes = scopeId ? [{ scope: 'project', scopeId }] : [];
      if (scopeId)
        await h.services.skills.attach({ scope: 'project', scopeId }, [
          global.id,
        ]);
      await h.enqueue(agent, String(scopeId));
      const [payload] = await claim(h, runner, 10);
      expect(payload!.skills.map((s) => s.slug)).toEqual(['team-default']);
    }
    await h.services.skills.attach({ scope: 'global', scopeId: 'default' }, []);
    h.scopes = [];
    await h.enqueue(await h.createAgent(), 'after-clear');
    expect((await claim(h, runner, 10))[0]!.skills).toEqual([]);
    expect((await h.services.skills.get(legacy.id)).attachments).toEqual([]);
  });

  it('uses the most specific metadata when different versions share a slug', () => {
    const row = {
      scope: 'global',
      scopeId: 'default',
      slug: 'shared',
      name: 'shared',
      description: 'Global',
      version: 1,
      hash: 'global',
    };
    const result = mergeRunSkills(
      [
        row,
        {
          ...row,
          scope: 'project',
          scopeId: 'p',
          description: 'Project',
          hash: 'project',
        },
        {
          ...row,
          scope: 'workdir',
          scopeId: 'w',
          description: 'Directory',
          hash: 'directory',
        },
      ],
      'r',
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      description: 'Directory',
      hash: 'directory',
    });
  });

  it('orders global, application and directory targets and keeps missing-version errors', async () => {
    h = await createHarness();
    const targets = skillTargets(
      { id: 'agent' },
      {
        scopes: [
          { scope: 'agent', scopeId: 'agent' },
          { scope: 'project', scopeId: 'p' },
        ],
        dirs: [],
      },
    );
    expect(targets).toEqual([
      { scope: 'global', scopeId: 'default' },
      { scope: 'project', scopeId: 'p' },
    ]);
    const skill = await h.services.skills.create('alice', {
      content: skillMd('broken-version', 'Missing version.'),
    });
    await h.services.skills.attach(targets[0]!, [skill.id]);
    await versionsRepo(h.database.connection()).deleteMany({
      filter: { skillId: skill.id },
    });
    await expect(
      h.services.skills.forRun(h.database.connection(), targets, 'run'),
    ).rejects.toThrow('Skill version');
  });
});
