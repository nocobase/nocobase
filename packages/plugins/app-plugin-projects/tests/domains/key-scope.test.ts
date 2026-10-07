// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { KEY_SCOPE_GROUPS, PAGES, BUSINESS_KEYS } from '../../shared/access.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['admin', 'alice']) await h.addUser(id, id);
});
afterEach(() => h.close());

const addRobot = async (id: string, name = id) => {
  await h.addUser(id, name);
  await h.database
    .connection()
    .repository('user')
    .updateOne({ filter: { id }, values: { kind: 'service' } });
  return id;
};

describe('the permission groups for scoped keys', () => {
  it('name only pages and business actions the plugin declares', () => {
    const businessKeys = new Set<string>(BUSINESS_KEYS.map(({ key }) => key));
    for (const group of KEY_SCOPE_GROUPS)
      for (const refs of Object.values(group.levels))
        for (const ref of refs ?? []) {
          if (ref.kind === 'page')
            expect(PAGES as readonly string[]).toContain(ref.id);
          if (ref.kind === 'business')
            expect(businessKeys).toContain(`${ref.id}/${ref.action}`);
        }
    expect(KEY_SCOPE_GROUPS.map((group) => group.id)).toEqual([
      'projects.projects',
      'projects.issues',
      'projects.settings',
    ]);
  });
});

describe('a key limited to some projects', () => {
  it('cannot see, list or change another project or its issues', async () => {
    const admin = h.viewer('admin', 'admin');
    const a = await h.services.projects.create(admin, { name: 'A' });
    const b = await h.services.projects.create(admin, { name: 'B' });
    const inA = await h.services.issues.create(admin, {
      title: 'In A',
      projectId: a.id,
    });
    const inB = await h.services.issues.create(admin, {
      title: 'In B',
      projectId: b.id,
    });
    await h.services.issues.create(admin, { title: 'Nowhere' });
    const scoped = { ...admin, projectIds: [a.id] };

    expect(
      (await h.services.projects.list(scoped)).map((project) => project.id),
    ).toEqual([a.id]);
    await expect(h.services.projects.get(scoped, b.id)).rejects.toMatchObject({
      kind: 'notFound',
    });
    await expect(
      h.services.projects.update(scoped, b.id, { name: 'Mine now' }),
    ).rejects.toMatchObject({ kind: 'notFound' });
    await expect(
      h.services.issueQueries.detail(scoped, inB.id),
    ).rejects.toMatchObject({ kind: 'notFound' });
    const page = await h.services.issueQueries.page(scoped, {});
    expect(page.data.map((issue) => issue.id)).toEqual([inA.id]);
    await expect(
      h.services.issues.update(scoped, inB.id, {
        title: 'Changed',
        revision: inB.revision,
      }),
    ).rejects.toMatchObject({ kind: 'notFound' });
    // It writes only into its projects.
    await expect(
      h.services.issues.create(scoped, { title: 'Loose' }),
    ).rejects.toMatchObject({ code: 'INVALID_PROJECT' });
    await expect(
      h.services.issues.create(scoped, { title: 'B', projectId: b.id }),
    ).rejects.toMatchObject({ code: 'INVALID_PROJECT' });
    await expect(
      h.services.issues.update(scoped, inA.id, {
        projectId: b.id,
        revision: inA.revision,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_PROJECT' });
    await expect(
      h.services.issues.create(scoped, { title: 'A2', projectId: a.id }),
    ).resolves.toMatchObject({ projectId: a.id });
  });
});

describe('API key identities', () => {
  it('are no members: not listed, not mentionable, never admitted', async () => {
    await addRobot('robot', 'Release bot');
    await h.services.members.ensure('robot');
    expect(h.admitted).toEqual([]);
    expect(
      (await h.services.members.list(h.viewer('alice'))).map((m) => m.userId),
    ).toEqual(['admin', 'alice']);
    const candidates = await h.services.commentQueries.mentionCandidates(
      h.viewer('alice'),
      { q: '' },
    );
    expect(candidates.map((candidate) => candidate.id)).not.toContain('robot');
    await expect(h.services.members.apiKeyActors()).resolves.toEqual([
      { id: 'robot', name: 'Release bot', disabled: false },
    ]);
  });

  it('cannot own or execute an issue, and must name the owner of one it creates', async () => {
    await addRobot('robot');
    const alice = h.viewer('alice');
    await expect(
      h.services.issues.create(alice, { title: 'X', ownerUserId: 'robot' }),
    ).rejects.toMatchObject({ code: 'INVALID_OWNER' });
    await expect(
      h.services.issues.create(alice, {
        title: 'X',
        executor: { type: 'user', id: 'robot' },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EXECUTOR' });
    const robot = h.viewer('robot');
    await expect(
      h.services.issues.create(robot, { title: 'X' }),
    ).rejects.toMatchObject({ code: 'OWNER_REQUIRED' });
    await expect(
      h.services.issues.create(robot, { title: 'X', ownerUserId: 'alice' }),
    ).resolves.toMatchObject({ ownerUserId: 'alice', createdById: 'robot' });
  });

  it('neither leads nor joins a project it creates', async () => {
    await addRobot('robot');
    const robot = h.viewer('robot', 'admin');
    const project = await h.services.projects.create(robot, { name: 'Bot' });
    expect(project.leadUserId).toBeNull();
    await expect(
      h.services.projects.create(robot, { name: 'Led', leadUserId: 'robot' }),
    ).rejects.toMatchObject({ code: 'INVALID_LEAD' });
  });
});
