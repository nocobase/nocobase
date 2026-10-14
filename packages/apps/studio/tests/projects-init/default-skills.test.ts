import { writeFileSync } from 'node:fs';
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  bindProjectDefaultSkills,
  readProjectDefaultSkills,
  writeProjectDefaultSkills,
} from '../../server/projects-init/default-skills.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
let release: () => void;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  h.roles.set('alice', 'admin');
  release = bindProjectDefaultSkills(h.projects, h.agents.skills);
});
afterEach(async () => {
  release?.();
  await h?.close();
});
const make = (name: string) =>
  h.projects.projects.create(h.viewer('alice'), { name });
const createSkill = () =>
  h.agents.skills.create('alice', {
    content:
      '---\nname: project-rules\ndescription: Project rules.\n---\nRead the rules.',
  });

describe('new project default skills', () => {
  it('protects configuration routes and validates replacements atomically', async () => {
    const path = '/projectDefaultSkills';
    expect((await h.request('GET', path)).status).toBe(401);
    await h.addUser('bob');
    h.roles.set('bob', 'member');
    expect(
      (await h.request('PUT', path, { user: 'bob', body: { skillIds: [] } }))
        .status,
    ).toBe(403);
    const skill = await createSkill();
    expect(
      (
        await h.request('PUT', path, {
          user: 'alice',
          body: { skillIds: [skill.id, skill.id] },
        })
      ).body.data,
    ).toEqual({ skillIds: [skill.id] });
    expect(
      (
        await h.request('PUT', path, {
          user: 'alice',
          body: { skillIds: ['missing'] },
        })
      ).status,
    ).toBe(400);
    expect((await h.request('GET', path, { user: 'alice' })).body.data).toEqual(
      { skillIds: [skill.id] },
    );
    expect(
      (
        await h.request('PUT', path, {
          user: 'alice',
          body: { skillIds: Array.from({ length: 101 }, () => skill.id) },
        })
      ).status,
    ).toBe(400);
    expect(
      (await h.request('PUT', path, { user: 'alice', body: { skillIds: [] } }))
        .body.data,
    ).toEqual({ skillIds: [] });
  });

  it('defaults to empty, copies once, never backfills and clears for subsequent projects', async () => {
    expect(await readProjectDefaultSkills(h.database.connection())).toEqual([]);
    const old = await make('Old');
    const skill = await createSkill();
    const ids = await h.agents.skills.validateIds(h.database.connection(), [
      skill.id,
      skill.id,
    ]);
    await h.projects.tx.run(({ conn }) => writeProjectDefaultSkills(conn, ids));
    const fresh = await make('Fresh');
    expect(
      await h.agents.skills.attached({ scope: 'project', scopeId: old.id }),
    ).toEqual([]);
    expect(
      await h.agents.skills.attached({ scope: 'project', scopeId: fresh.id }),
    ).toEqual([skill.id]);
    await h.projects.tx.run(({ conn }) => writeProjectDefaultSkills(conn, []));
    const empty = await make('Empty');
    expect(
      await h.agents.skills.attached({ scope: 'project', scopeId: empty.id }),
    ).toEqual([]);
    expect(
      await h.agents.skills.attached({ scope: 'project', scopeId: fresh.id }),
    ).toEqual([skill.id]);
  });

  it('rolls back project and members when a configured skill was deleted', async () => {
    const skill = await createSkill();
    await h.projects.tx.run(({ conn }) =>
      writeProjectDefaultSkills(conn, [skill.id]),
    );
    await h.agents.skills.remove(skill.id);
    await expect(make('Invalid defaults')).rejects.toThrow(
      'Some of the skills do not exist.',
    );
    expect(await h.projects.projects.list(h.viewer('alice'))).toEqual([]);
  });

  it('joins the public creation unit and rehearsal leaves no project or attachments', async () => {
    const skill = await createSkill();
    await h.projects.tx.run(({ conn }) =>
      writeProjectDefaultSkills(conn, [skill.id]),
    );
    const rehearsed = await h.projects.tx.unit(() => make('Rehearsal'), {
      rehearse: true,
    });
    expect(
      await h.agents.skills.attached({
        scope: 'project',
        scopeId: rehearsed.id,
      }),
    ).toEqual([]);
    expect(await h.projects.projects.list(h.viewer('alice'))).toEqual([]);
    const project = await h.projects.tx.unit(() => make('Plan execution'));
    expect(
      await h.agents.skills.attached({ scope: 'project', scopeId: project.id }),
    ).toEqual([skill.id]);
  });
});

it.skipIf(!process.env.PM387_PROJECT_COST_REPORT)(
  'measures complete project creation with and without copied defaults',
  async () => {
    const skills = [];
    for (let index = 0; index < 3; index += 1)
      skills.push(
        (
          await h.agents.skills.create('alice', {
            content: `---\nname: project-cost-${index}\ndescription: Cost rules.\n---\nRules.`,
          })
        ).id,
      );
    const report = [];
    release();
    await make('Unmeasured cache warmup');
    for (const scenario of ['baseline', 'empty', 'one', 'many']) {
      release();
      if (scenario !== 'baseline')
        release = bindProjectDefaultSkills(h.projects, h.agents.skills);
      await h.projects.tx.run(({ conn }) =>
        writeProjectDefaultSkills(
          conn,
          scenario === 'one'
            ? skills.slice(0, 1)
            : scenario === 'many'
              ? skills
              : [],
        ),
      );
      for (let sample = 0; sample < 3; sample += 1) {
        const counters = {
          select: 0,
          writes: 0,
          begin: 0,
          commit: 0,
          explicitLocks: 0,
        };
        const client = await h.database.connection().client<{
          on(event: string, callback: (query: { sql: string }) => void): void;
          off(event: string, callback: (query: { sql: string }) => void): void;
        }>();
        const onQuery = ({ sql }: { sql: string }) => {
          if (/^\s*(select|with)\b/iu.test(sql)) counters.select += 1;
          if (/^\s*(insert|update|delete)\b/iu.test(sql)) counters.writes += 1;
          if (/^\s*begin\b/iu.test(sql)) counters.begin += 1;
          if (/^\s*commit\b/iu.test(sql)) counters.commit += 1;
          if (/for update|lock table/iu.test(sql)) counters.explicitLocks += 1;
        };
        client.on('query', onQuery);
        const start = performance.now();
        const project = await make(`Cost ${scenario} ${sample}`);
        const elapsedMs = performance.now() - start;
        client.off('query', onQuery);
        expect(
          await h.agents.skills.attached({
            scope: 'project',
            scopeId: project.id,
          }),
        ).toEqual(
          scenario === 'one'
            ? skills.slice(0, 1)
            : scenario === 'many'
              ? skills
              : [],
        );
        report.push({
          scenario,
          sample,
          ...counters,
          elapsedMs: Number(elapsedMs.toFixed(2)),
        });
      }
    }
    writeFileSync(
      process.env.PM387_PROJECT_COST_REPORT!,
      JSON.stringify(report, null, 2),
    );
  },
);
