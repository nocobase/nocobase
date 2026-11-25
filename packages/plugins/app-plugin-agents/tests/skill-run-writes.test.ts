/**
 * Skills an agent's run writes for the person who woke it: only with `agents.skills` manage (the edit action alone is
 * a person's), and each version it writes records the agent and the run beside the person.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { createHarness, skillMd, type Harness } from './harness.js';

const READ = ['agents.agents/read', 'agents.skills/read'];
const MANAGE = ['agents.skills/manage'];
const OWN = ['agents.agents/edit=related'];

describe('skills written by an agent’s run', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  it('needs skill management for every write, and keeps the agent on the versions it writes for audit only', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ name: 'Reviewer' });
    const run = { id: 'run-1', agentId };
    const skill = await h.services.skills.create('bob', {
      content: skillMd('review', 'How we review.'),
    });
    const body = (expectedRevision: number) => ({
      content: skillMd('review', 'How we review code.', '# Review'),
      files: [],
      expectedRevision,
    });

    // The person's own edit action is not enough for a run: save, restore, upload and import are refused.
    const refused = await h.request('PATCH', `/agents/skills/${skill.id}`, {
      user: 'bob',
      can: READ,
      scope: OWN,
      run,
      body: body(1),
    });
    expect(refused.status).toBe(403);
    expect(
      (
        await h.request(
          'POST',
          `/agents/skills/${skill.id}/versions/1/restore`,
          {
            user: 'bob',
            can: READ,
            scope: OWN,
            run,
            body: { expectedRevision: 1 },
          },
        )
      ).status,
    ).toBe(403);
    const form = new FormData();
    form.append('file', new File(['notes'], 'notes.md'));
    expect(
      (
        await h.request('POST', '/agents/skills/uploads', {
          user: 'bob',
          can: READ,
          scope: OWN,
          run,
          form,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request('POST', '/agents/skills/import', {
          user: 'bob',
          can: READ,
          scope: OWN,
          run,
          body: {
            archive: 'a'.repeat(64),
            skillId: skill.id,
            expectedRevision: 1,
          },
        })
      ).status,
    ).toBe(403);
    // A run that may not even read the skill is refused the write (403), not told the skill is missing; a person
    // without reading still gets 404, and a skill that does not exist is still 404 for a run that manages skills.
    for (const [method, path, payload] of [
      ['PATCH', `/agents/skills/${skill.id}`, body(1)],
      [
        'POST',
        `/agents/skills/${skill.id}/versions/1/restore`,
        { expectedRevision: 1 },
      ],
      [
        'POST',
        '/agents/skills/import',
        { archive: 'a'.repeat(64), skillId: skill.id, expectedRevision: 1 },
      ],
    ] as const) {
      const refusedRun = await h.request(method, path, {
        user: 'bob',
        can: [],
        run,
        body: payload,
      });
      expect(refusedRun.status, `${method} ${path}`).toBe(403);
      expect(
        (
          await h.request(method, path, {
            user: 'carol',
            can: [],
            body: payload,
          })
        ).status,
        `${method} ${path}`,
      ).toBe(404);
    }
    expect(
      (
        await h.request('PATCH', '/agents/skills/missing', {
          user: 'bob',
          can: MANAGE,
          run,
          body: body(1),
        })
      ).status,
    ).toBe(404);
    // The same person editing it themselves still may, and is the only author.
    const own = await h.request('PATCH', `/agents/skills/${skill.id}`, {
      user: 'bob',
      can: READ,
      scope: OWN,
      body: body(1),
    });
    expect(own.status).toBe(200);

    // With skill management, the run saves and restores; the versions say through which agent and run.
    const saved = await h.request('PATCH', `/agents/skills/${skill.id}`, {
      user: 'bob',
      can: MANAGE,
      run,
      body: { ...body(2), content: skillMd('review', 'Reviewed by runs.') },
    });
    expect(saved.status).toBe(200);
    const restored = await h.request(
      'POST',
      `/agents/skills/${skill.id}/versions/1/restore`,
      { user: 'bob', can: MANAGE, run, body: { expectedRevision: 3 } },
    );
    expect(restored.status).toBe(200);
    const created = await h.request('POST', '/agents/skills', {
      user: 'bob',
      can: MANAGE,
      run,
      body: { content: skillMd('notes', 'Run notes.') },
    });
    expect(created.status).toBe(201);

    // The audit is kept on the stored versions, never answered by the API.
    const stored = (skillId: string) =>
      h.database
        .connection()
        .repository('agSkillVersions')
        .findMany({
          filter: { skillId },
          sort: (sort) => sort.field('version').desc(),
        }) as Promise<
        {
          version: number;
          createdById: string;
          viaAgentId: string | null;
          viaRunId: string | null;
        }[]
      >;
    expect(
      (await stored(skill.id)).map((row) => [
        Number(row.version),
        row.createdById,
        row.viaAgentId,
        row.viaRunId,
      ]),
    ).toEqual([
      [4, 'bob', agentId, 'run-1'],
      [3, 'bob', agentId, 'run-1'],
      [2, 'bob', null, null],
      [1, 'bob', null, null],
    ]);
    expect((await stored(created.body.data.id))[0]).toMatchObject({
      createdById: 'bob',
      viaAgentId: agentId,
      viaRunId: 'run-1',
    });
    const versions = await h.request(
      'GET',
      `/agents/skills/${skill.id}/versions`,
      { user: 'bob', can: READ },
    );
    const one = await h.request(
      'GET',
      `/agents/skills/${skill.id}/versions/3`,
      { user: 'bob', can: READ },
    );
    for (const version of [...versions.body.data, one.body.data])
      for (const field of ['viaAgentId', 'viaAgentName', 'viaRunId'])
        expect(version).not.toHaveProperty(field);
  });
});
