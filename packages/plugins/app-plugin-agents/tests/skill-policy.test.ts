import { afterEach, describe, expect, it } from 'vitest';

import { writeZip } from '../server/core/skills/index.js';
import { composeSkillMarkdown } from '../shared/skills.js';
import type { SkillPolicy } from '../server/tokens.js';
import { createHarness, skillMd, type Harness } from './harness.js';

const ADMIN = ['agents.skills/manage'];

let h: Harness;
afterEach(async () => {
  await h?.close();
});

/** Protects every skill whose metadata says `locked: "true"`, and keeps `kind: flow` out of the global defaults. */
const policy: SkillPolicy = {
  canEdit: (skill) => skill.metadata.locked !== 'true',
  canDelete: async (skill) => skill.metadata.locked !== 'true',
  canAttach: (skill, target) =>
    !(target.scope === 'global' && skill.metadata.kind === 'flow'),
};

const lockedMd = (name: string, metadata: Record<string, string>) =>
  composeSkillMarkdown(
    { name, description: 'A protected skill.', metadata },
    '# Body\n',
  );

async function upload(h: Harness, bytes: Uint8Array): Promise<string> {
  const form = new FormData();
  form.append('file', new Blob([Buffer.from(bytes)]), 'skill.zip');
  const response = await h.app.request('/agents/skills/uploads', {
    method: 'POST',
    headers: { 'x-test-user': 'alice', 'x-test-can': ADMIN.join(',') },
    body: form,
  });
  return ((await response.json()) as { data: { id: string } }).data.id;
}

describe('skill metadata and the application skill policy', () => {
  it('returns front matter metadata in lists and details, empty when there is none', async () => {
    h = await createHarness();
    await h.services.skills.create('alice', {
      content: lockedMd('with-metadata', { 'studio.role': 'workflow' }),
    });
    await h.services.skills.create('alice', {
      content: skillMd('plain', 'No metadata.'),
    });
    const list = await h.request('GET', '/agents/skills', {
      user: 'alice',
      can: ['agents.skills/read'],
    });
    expect(
      Object.fromEntries(
        list.body.data.map((s: { slug: string; metadata: unknown }) => [
          s.slug,
          s.metadata,
        ]),
      ),
    ).toEqual({ plain: {}, 'with-metadata': { 'studio.role': 'workflow' } });
  });

  it('allows everything without a policy, and says so in canEdit and canDelete', async () => {
    h = await createHarness();
    const skill = await h.services.skills.create('alice', {
      content: lockedMd('unguarded', { locked: 'true' }),
    });
    const view = await h.request('GET', `/agents/skills/${skill.id}`, {
      user: 'alice',
      can: ADMIN,
    });
    expect(view.body.data).toMatchObject({ canEdit: true, canDelete: true });
    const reader = await h.request('GET', `/agents/skills/${skill.id}`, {
      user: 'bob',
      can: ['agents.skills/read'],
    });
    expect(reader.body.data).toMatchObject({
      canEdit: false,
      canDelete: false,
    });
    expect(
      (
        await h.request('DELETE', `/agents/skills/${skill.id}`, {
          user: 'alice',
          can: ADMIN,
        })
      ).status,
    ).toBe(204);
  });

  it('refuses saving, restoring, importing over and deleting a protected skill, even for a manager', async () => {
    h = await createHarness({ skillPolicy: policy });
    const created = await h.services.skills.create(null, {
      content: skillMd('guarded', 'Version one.'),
    });
    // The application's own code is not subject to the policy: it protects the skill from version 2 on.
    await h.services.skills.save(created.id, null, {
      content: lockedMd('guarded', { locked: 'true' }),
      files: [],
      expectedRevision: 1,
    });
    const view = await h.request('GET', `/agents/skills/${created.id}`, {
      user: 'alice',
      can: ADMIN,
    });
    expect(view.body.data).toMatchObject({
      version: 2,
      canEdit: false,
      canDelete: false,
    });
    const refused = (response: { status: number; body: any }) => {
      expect(response.status).toBe(403);
      expect(response.body.error.reason ?? response.body.error.code).toBe(
        'SKILL_PROTECTED',
      );
    };
    refused(
      await h.request('PATCH', `/agents/skills/${created.id}`, {
        user: 'alice',
        can: ADMIN,
        body: {
          content: skillMd('guarded', 'Changed.'),
          files: [],
          expectedRevision: 2,
        },
      }),
    );
    refused(
      await h.request(
        'POST',
        `/agents/skills/${created.id}/versions/1/restore`,
        { user: 'alice', can: ADMIN, body: { expectedRevision: 2 } },
      ),
    );
    const archive = await upload(
      h,
      writeZip([
        {
          name: 'SKILL.md',
          bytes: Buffer.from(skillMd('guarded', 'Imported.')),
          executable: false,
        },
      ]),
    );
    refused(
      await h.request('POST', '/agents/skills/import', {
        user: 'alice',
        can: ADMIN,
        body: { archive, skillId: created.id, expectedRevision: 2 },
      }),
    );
    refused(
      await h.request('DELETE', `/agents/skills/${created.id}`, {
        user: 'alice',
        can: ADMIN,
      }),
    );
    expect((await h.services.skills.get(created.id)).version).toBe(2);

    // An unprotected skill is still edited and deleted as before.
    const open = await h.services.skills.create('alice', {
      content: skillMd('open', 'Free.'),
    });
    expect(
      (
        await h.request('PATCH', `/agents/skills/${open.id}`, {
          user: 'alice',
          can: ADMIN,
          body: {
            content: skillMd('open', 'Changed.'),
            files: [],
            expectedRevision: 1,
          },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await h.request('DELETE', `/agents/skills/${open.id}`, {
          user: 'alice',
          can: ADMIN,
        })
      ).status,
    ).toBe(204);
  });

  it('refuses newly attaching a skill the policy keeps out of a scope, and keeps one attached before', async () => {
    h = await createHarness({ skillPolicy: policy });
    const flow = await h.services.skills.create('alice', {
      content: lockedMd('a-flow', { kind: 'flow' }),
    });
    const plain = await h.services.skills.create('alice', {
      content: skillMd('a-rule', 'Rules.'),
    });
    const path = '/agents/skillAttachments/global/default';
    const refused = await h.request('PUT', path, {
      user: 'alice',
      can: ADMIN,
      body: { skillIds: [plain.id, flow.id] },
    });
    expect(refused.status).toBe(403);
    expect(
      await h.services.skills.attached({ scope: 'global', scopeId: 'default' }),
    ).toEqual([]);
    // Attached before the policy said otherwise (by the application itself): saving the scope keeps it.
    await h.services.skills.attach({ scope: 'global', scopeId: 'default' }, [
      flow.id,
    ]);
    const kept = await h.request('PUT', path, {
      user: 'alice',
      can: ADMIN,
      body: { skillIds: [flow.id, plain.id] },
    });
    expect(kept.status).toBe(200);
    expect(kept.body.data.skillIds).toEqual([flow.id, plain.id]);
  });
  it('says who wrote the current version: null for the application, the person after a save', async () => {
    h = await createHarness();
    const installed = await h.services.skills.create(null, {
      content: skillMd('installed', 'By the application.'),
    });
    expect(installed.createdById).toBeNull();
    expect(installed.updatedById).toBeNull();
    const saved = await h.services.skills.save(installed.id, 'alice', {
      content: skillMd('installed', 'Edited by a person.'),
      files: [],
      expectedRevision: installed.version,
    });
    expect(saved.createdById).toBeNull();
    expect(saved.updatedById).toBe('alice');
    const [listed] = await h.services.skills.list([installed.id]);
    expect(listed?.updatedById).toBe('alice');
  });

  it('lists only the given skills, and asks the policy only about the newly attached ones', async () => {
    const asked: string[] = [];
    h = await createHarness({
      skillPolicy: {
        canAttach: (skill) => {
          asked.push(skill.slug);
          return true;
        },
      },
    });
    const created = [];
    for (const name of ['one', 'two', 'three', 'four'])
      created.push(
        await h.services.skills.create('alice', {
          content: skillMd(name, name),
        }),
      );
    const [one, two, three] = created;
    expect(
      (await h.services.skills.list([three!.id, one!.id, 'missing'])).map(
        (s) => s.slug,
      ),
    ).toEqual(['one', 'three']);
    expect(await h.services.skills.list([])).toEqual([]);
    await h.services.skills.attach({ scope: 'global', scopeId: 'default' }, [
      one!.id,
    ]);
    const response = await h.request(
      'PUT',
      '/agents/skillAttachments/global/default',
      { user: 'alice', can: ADMIN, body: { skillIds: [one!.id, two!.id] } },
    );
    expect(response.status).toBe(200);
    expect(asked).toEqual(['two']);
  });
});
