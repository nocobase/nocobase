import { SkillBundleSchema } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import { readZip, writeZip } from '../server/core/skills/index.js';
import { SKILL_FILE_MAX_BYTES } from '../shared/skills.js';
import { claim, createHarness, skillMd, type Harness } from './harness.js';

const ADMIN = ['agents.agents/manage'];
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 3, 0xff]);

/** Uploads `bytes` as the multipart `file` of `POST /agents/skills/uploads`. */
async function upload(
  h: Harness,
  bytes: Uint8Array,
  can: readonly string[] = ADMIN,
): Promise<{ status: number; body: any }> {
  const form = new FormData();
  form.append('file', new Blob([Buffer.from(bytes)]), 'file.bin');
  const response = await h.app.request('/agents/skills/uploads', {
    method: 'POST',
    headers: { 'x-test-user': 'alice', 'x-test-can': can.join(',') },
    body: form,
  });
  return { status: response.status, body: await response.json() };
}

async function download(
  h: Harness,
  path: string,
): Promise<{ status: number; bytes: Uint8Array; headers: Headers }> {
  const response = await h.app.request(path, {
    headers: { 'x-test-user': 'bob', 'x-test-can': 'agents.agents/read' },
  });
  return {
    status: response.status,
    bytes: new Uint8Array(await response.arrayBuffer()),
    headers: response.headers,
  };
}

const blobs = (h: Harness) =>
  h.disk.keys().filter((key) => key.startsWith('skills/blobs/'));

describe('skill storage', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  it('stores each content once, whichever skills and versions hold it', async () => {
    h = await createHarness();
    const shared = { path: 'notes/shared.md', content: 'The same text.' };
    const first = await h.services.skills.create('alice', {
      content: skillMd('one', 'First.'),
      files: [shared, { path: 'a.txt', content: 'only here' }],
    });
    await h.services.skills.create('alice', {
      content: skillMd('two', 'Second.'),
      files: [{ ...shared, path: 'elsewhere.md' }],
    });
    await h.services.skills.save(first.id, 'alice', {
      content: skillMd('one', 'First.', '# One'),
      files: first.files.map((file) => ({ path: file.path, hash: file.hash })),
      expectedRevision: 1,
    });
    expect(blobs(h)).toHaveLength(2);
    const detail = await h.services.skills.get(first.id);
    expect(detail.files).toEqual([
      expect.objectContaining({
        path: 'notes/shared.md',
        content: 'The same text.',
        size: 14,
        executable: false,
      }),
      expect.objectContaining({ path: 'a.txt', content: 'only here' }),
    ]);
    expect(detail).toMatchObject({ version: 2, fileCount: 2 });
  });

  it('refuses a skill over its limits', async () => {
    h = await createHarness();
    const save = (files: { path: string; content?: string; hash?: string }[]) =>
      h.request('POST', '/agents/skills', {
        user: 'alice',
        can: ADMIN,
        body: { content: skillMd('big', 'Too much.'), files },
      });
    const many = Array.from({ length: 201 }, (_, index) => ({
      path: `f${index}.txt`,
      content: 'x',
    }));
    const tooMany = await save(many);
    expect(tooMany.status).toBe(400);
    expect(tooMany.body.error.message).toContain('at most 200 files');

    const large = await upload(h, new Uint8Array(SKILL_FILE_MAX_BYTES + 1));
    expect(large.status).toBe(201);
    const tooLarge = await save([
      { path: 'big.bin', hash: large.body.data.id },
    ]);
    expect(tooLarge.status).toBe(400);
    expect(tooLarge.body.error.metadata).toMatchObject({ reason: 'tooLarge' });

    const parts: string[] = [];
    for (let index = 0; index < 5; index++)
      parts.push(
        (await upload(h, new Uint8Array(4 * 1024 * 1024).fill(index + 1))).body
          .data.id as string,
      );
    const tooMuch = await save(
      parts.map((hash, index) => ({ path: `part${index}.bin`, hash })),
    );
    expect(tooMuch.status).toBe(400);
    expect(tooMuch.body.error.message).toContain('20.0 MB in all');

    const unknown = await save([{ path: 'x.bin', hash: 'f'.repeat(64) }]);
    expect(unknown.status).toBe(400);
    expect(unknown.body.error.metadata).toMatchObject({
      reason: 'unknownContent',
    });
    expect((await upload(h, PNG, ['agents.agents/read'])).status).toBe(403);
  });

  it('keeps binary files and the executable bit, through the API and to the runner', async () => {
    h = await createHarness();
    const stored = await upload(h, PNG);
    expect(stored.body.data).toMatchObject({ size: PNG.length, text: false });
    const created = await h.request('POST', '/agents/skills', {
      user: 'alice',
      can: ADMIN,
      body: {
        content: skillMd('brand', 'Our logo and a check.'),
        files: [
          { path: 'assets/logo.png', hash: stored.body.data.id },
          {
            path: 'scripts/check.sh',
            content: '#!/bin/sh\necho ok\n',
            executable: true,
          },
        ],
      },
    });
    expect(created.status).toBe(201);
    expect(created.body.data.files).toEqual([
      {
        path: 'assets/logo.png',
        hash: stored.body.data.id,
        size: PNG.length,
        executable: false,
        content: null,
      },
      expect.objectContaining({
        path: 'scripts/check.sh',
        executable: true,
        content: '#!/bin/sh\necho ok\n',
      }),
    ]);
    const id = created.body.data.id as string;
    const file = await download(
      h,
      `/agents/skills/${id}/versions/1/file?path=assets%2Flogo.png`,
    );
    expect(file.status).toBe(200);
    expect(file.bytes).toEqual(PNG);
    expect(file.headers.get('content-disposition')).toContain('logo.png');
    expect(
      (await download(h, `/agents/skills/${id}/versions/1/file?path=nope`))
        .status,
    ).toBe(404);

    const agentId = await h.createAgent({ skillIds: [id] });
    await h.enqueue(agentId, '1');
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    const bundle = SkillBundleSchema.parse(
      (
        await h.request(
          'GET',
          String(payload!.skills[0]!.bundleUrl).replace(/^\/api/u, ''),
          { runnerKey: runner.key },
        )
      ).body.data,
    );
    expect(bundle.hash).toBe(payload!.skills[0]!.hash);
    expect(bundle.files.map((entry) => entry.path)).toEqual([
      'SKILL.md',
      'assets/logo.png',
      'scripts/check.sh',
    ]);
    expect(bundle.files[1]).toEqual({
      path: 'assets/logo.png',
      content: Buffer.from(PNG).toString('base64'),
      encoding: 'base64',
    });
    expect(bundle.files[2]).toMatchObject({ executable: true });
  });

  it('imports a zip as a skill or a new version, and exports any version', async () => {
    h = await createHarness();
    const archive = writeZip([
      {
        name: 'release-notes/SKILL.md',
        bytes: Buffer.from(
          '---\nname: release-notes\ndescription: >\n  How we write\n  release notes.\nlicense: MIT\n---\n\n# Release notes\n',
        ),
        executable: false,
      },
      {
        name: 'release-notes/scripts/draft.py',
        bytes: Buffer.from('print("draft")\n'),
        executable: true,
      },
      { name: 'release-notes/logo.png', bytes: PNG, executable: false },
      {
        name: '__MACOSX/release-notes/._logo.png',
        bytes: PNG,
        executable: false,
      },
    ]);
    const uploaded = await upload(h, archive);
    const imported = await h.request('POST', '/agents/skills/import', {
      user: 'alice',
      can: ADMIN,
      body: { archive: uploaded.body.data.id },
    });
    expect(imported.status).toBe(201);
    expect(imported.body.data).toMatchObject({
      name: 'release-notes',
      slug: 'release-notes',
      description: 'How we write release notes.',
      version: 1,
      fileCount: 2,
      canEdit: true,
    });
    expect(imported.body.data.files).toEqual([
      expect.objectContaining({ path: 'logo.png', content: null }),
      expect.objectContaining({ path: 'scripts/draft.py', executable: true }),
    ]);
    const id = imported.body.data.id as string;

    // A zip with SKILL.md at its root becomes a new version.
    const next = await upload(
      h,
      writeZip([
        {
          name: 'SKILL.md',
          bytes: Buffer.from(
            '---\nname: release-notes\ndescription: "Release notes, v2."\n---\n\nShorter.\n',
          ),
          executable: false,
        },
      ]),
    );
    const version = await h.request('POST', '/agents/skills/import', {
      user: 'alice',
      can: ADMIN,
      body: { archive: next.body.data.id, skillId: id, expectedRevision: 1 },
    });
    expect(version.body.data).toMatchObject({
      version: 2,
      description: 'Release notes, v2.',
      fileCount: 0,
    });
    const stale = await h.request('POST', '/agents/skills/import', {
      user: 'alice',
      can: ADMIN,
      body: { archive: next.body.data.id, skillId: id, expectedRevision: 1 },
    });
    expect(stale.status).toBe(409);
    // The folder holding SKILL.md is its name; a front matter naming another is refused, as is an invalid one.
    for (const [folder, markdown, reason] of [
      [
        'notes',
        '---\nname: release-notes\ndescription: Notes.\n---\n',
        'mismatch',
      ],
      ['bad', '---\nname: Bad Name\ndescription: Notes.\n---\n', 'pattern'],
      ['bare', '# No front matter\n', 'missing'],
    ] as const) {
      const refused = await upload(
        h,
        writeZip([
          {
            name: `${folder}/SKILL.md`,
            bytes: Buffer.from(markdown),
            executable: false,
          },
        ]),
      );
      const answer = await h.request('POST', '/agents/skills/import', {
        user: 'alice',
        can: ADMIN,
        body: { archive: refused.body.data.id },
      });
      expect(answer.status).toBe(400);
      expect(answer.body.error.metadata).toMatchObject({ reason });
    }
    const broken = await upload(h, Buffer.from('not a zip'));
    expect(
      (
        await h.request('POST', '/agents/skills/import', {
          user: 'alice',
          can: ADMIN,
          body: { archive: broken.body.data.id },
        })
      ).status,
    ).toBe(400);

    const exported = await download(
      h,
      `/agents/skills/${id}/archive?version=1`,
    );
    expect(exported.status).toBe(200);
    expect(exported.headers.get('content-type')).toBe('application/zip');
    expect(exported.headers.get('content-disposition')).toContain(
      'release-notes-v1.zip',
    );
    const entries = readZip(exported.bytes, 1024 * 1024);
    expect(entries.map((entry) => [entry.name, entry.executable])).toEqual([
      ['release-notes/SKILL.md', false],
      ['release-notes/logo.png', false],
      ['release-notes/scripts/draft.py', true],
    ]);
    expect(Buffer.from(entries[0]!.bytes).toString()).toBe(
      '---\nname: release-notes\ndescription: >\n  How we write\n  release notes.\nlicense: MIT\n---\n\n# Release notes\n',
    );
    expect(entries[1]!.bytes).toEqual(PNG);
  });

  it('collects contents no version names once they are unused for an hour', async () => {
    h = await createHarness();
    const skill = await h.services.skills.create('alice', {
      content: skillMd('gone-soon', 'Deleted below.'),
      files: [{ path: 'a.md', content: 'deleted with its skill' }],
    });
    const kept = await h.services.skills.create('alice', {
      content: skillMd('kept', 'Stays.'),
      files: [{ path: 'b.md', content: 'still named' }],
    });
    await h.services.skills.remove(skill.id);
    expect(blobs(h)).toHaveLength(2);
    h.clock.advance(2 * 60 * 60_000);
    // Uploaded for a save still to come: spared.
    const fresh = await h.services.skills.upload(Buffer.from('pending'));
    expect(await h.services.skills.collectGarbage(60 * 60_000)).toBe(1);
    expect(blobs(h).sort()).toEqual(
      [
        `skills/blobs/${kept.files[0]!.hash}`,
        `skills/blobs/${fresh.id}`,
      ].sort(),
    );
    h.clock.advance(2 * 60 * 60_000);
    expect(await h.services.skills.collectGarbage(60 * 60_000)).toBe(1);
    expect(blobs(h)).toEqual([`skills/blobs/${kept.files[0]!.hash}`]);
    expect((await h.services.skills.get(kept.id)).files[0]!.content).toBe(
      'still named',
    );
  });
});
