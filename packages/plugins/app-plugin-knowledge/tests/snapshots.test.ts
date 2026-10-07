// @vitest-environment node
/** Spaces exported as files: the layout, the manifest, the hash consumers cache by, and what changed in a series. */
import { createHash } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { ReadableSpaces } from '../server/services/readable.js';
import {
  readDocumentFile,
  type SnapshotLayout,
} from '../server/services/snapshots.js';
import {
  ADMIN,
  createKnowledgeHarness,
  type KnowledgeHarness,
} from './harness.js';

const project = { scope: 'project', scopeId: 'p1' } as const;
const system = { scope: 'system', scopeId: '' } as const;
const sha = (text: string) => createHash('sha256').update(text).digest('hex');

/** An application's wording: where people read a document, and how to read one not written. */
const layout: SnapshotLayout = {
  dir: (space) => space.scope,
  heading: (space, dir) =>
    space.ref.scope === 'project'
      ? `Project${space.title ? `: ${space.title}` : ''} (\`${dir}/\`)`
      : `System (\`${dir}/\`${space.inherited ? ', inherited' : ''})`,
  preamble: ['What the team keeps.'],
  unwritten: (slug) => `not written here: \`kb read ${slug}\``,
  url: (space, docId) => `/spaces/${space.scope}/${space.scopeId}?doc=${docId}`,
};

describe('knowledge snapshots', () => {
  let h: KnowledgeHarness;
  let readable: ReadableSpaces;
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('admin', ADMIN);
    h.projects.set('p1', { id: 'p1', name: 'Acme 平台', leadUserId: 'lead' });
    const { docs } = h.knowledge;
    const pitfalls = await docs.create(h.user('lead'), {
      ...project,
      title: 'Known pitfalls',
      slug: 'known-pitfalls',
      summary: 'What bit us.',
      content: '# Known pitfalls',
    });
    await docs.create(h.user('lead'), {
      ...project,
      parentId: pitfalls.id,
      title: 'SQLite locks',
      slug: 'sqlite-locks',
      content: '# SQLite locks\n\nOne connection.',
    });
    await docs.create(h.user('admin'), {
      ...system,
      title: 'Team conventions',
      slug: 'conventions',
      content: '# Conventions',
    });
    readable = await h.knowledge.readable(h.user('lead'), [project, system]);
  });
  afterEach(async () => {
    await h?.close();
  });

  const snapshot = (key: string, limits?: { maxDocs?: number }) =>
    h.database.transaction((conn) =>
      h.knowledge.snapshots.take(conn, readable, {
        key,
        seriesKey: 'agent-1\nissue\ni1\nmain',
        layout,
        ...(limits ? { limits } : {}),
      }),
    );
  const filesOf = (key: string) =>
    h.knowledge.snapshots.files(h.database.connection(), key, layout);

  it('lays the spaces out as files with an index and a manifest, and serves exactly what it hashed', async () => {
    const taken = (await snapshot('run-1'))!;
    expect(taken.docs.map((doc) => doc.path)).toEqual([
      'project/known-pitfalls/README.md',
      'project/known-pitfalls/sqlite-locks.md',
      'system/conventions.md',
    ]);
    expect(taken.changed).toBeNull();
    const bundle = (await filesOf('run-1'))!;
    expect(bundle).toMatchObject({ hash: taken.hash });
    const files = new Map(
      bundle.files.map((file) => [file.path, file.content]),
    );
    expect([...files.keys()]).toEqual([
      'INDEX.md',
      'project/known-pitfalls/README.md',
      'project/known-pitfalls/sqlite-locks.md',
      'system/conventions.md',
      '.manifest.json',
    ]);
    const index = files.get('INDEX.md')!;
    expect(index).toContain('## Project: Acme 平台 (`project/`)');
    expect(index).toContain(
      '- [Known pitfalls](project/known-pitfalls/README.md) `known-pitfalls` (v1): What bit us.',
    );
    expect(index).toContain(
      '  - [SQLite locks](project/known-pitfalls/sqlite-locks.md)',
    );
    expect(index).toContain('## System (`system/`, inherited)');
    const file = files.get('project/known-pitfalls/sqlite-locks.md')!;
    expect(file).toMatch(
      /^---\nid: "k\d+"\nslug: "sqlite-locks"\ntitle: "SQLite locks"\nversion: 1\nspace: project # Acme 平台\n/u,
    );
    expect(file).toContain('url: "/spaces/project/p1?doc=');
    expect(readDocumentFile(file)).toMatchObject({
      version: 1,
      title: 'SQLite locks',
      content: '# SQLite locks\n\nOne connection.\n',
    });
    const manifest = JSON.parse(files.get('.manifest.json')!) as {
      path: string;
      hash: string;
      version: number;
    }[];
    expect(
      manifest.map((entry) => [entry.path, entry.hash, entry.version]),
    ).toEqual(
      [...files.entries()]
        .filter(([path]) => path !== 'INDEX.md' && path !== '.manifest.json')
        .map(([path, content]) => [path, sha(content), 1]),
    );
    // Nothing changed, the same hash: a runner fetches nothing again.
    expect((await snapshot('run-2'))!.hash).toBe(taken.hash);
  });

  it('tells a later run of the same session what changed, and lists what does not fit', async () => {
    const first = (await snapshot('run-1'))!;
    const doc = first.docs.find((entry) => entry.slug === 'sqlite-locks')!;
    await h.knowledge.docs.update(h.user('lead'), doc.docId, {
      expectedVersion: 1,
      content: '# SQLite locks\n\nOne connection, really.',
    });
    await h.knowledge.docs.create(h.user('lead'), {
      ...project,
      title: 'Release',
      slug: 'release',
      content: '# Release',
    });
    const second = (await snapshot('run-2'))!;
    expect(second.hash).not.toBe(first.hash);
    expect(second.changed).toEqual([
      expect.objectContaining({ slug: 'sqlite-locks', from: 1, to: 2 }),
      expect.objectContaining({ slug: 'release', from: null, to: 1 }),
    ]);

    const small = (await snapshot('run-3', { maxDocs: 2 }))!;
    expect(small.omitted).toBe(2);
    const bundle = (await filesOf('run-3'))!;
    expect(bundle.files.map((file) => file.path)).toHaveLength(4);
    expect(bundle.files[0]!.content).toContain(
      'not written here: `kb read conventions`',
    );
  });
});

describe('knowledge snapshots and access', () => {
  it('exports only the spaces the reader reads', async () => {
    const h = await createKnowledgeHarness();
    try {
      h.levels.set('admin', ADMIN);
      h.projects.set('p1', {
        id: 'p1',
        name: 'Hidden',
        leadUserId: 'admin',
        seenBy: ['admin'],
      });
      await h.knowledge.docs.create(h.user('admin'), {
        ...project,
        title: 'Hidden',
        content: '# Hidden',
      });
      await h.knowledge.docs.create(h.user('admin'), {
        ...system,
        title: 'Open',
        content: '# Open',
      });
      const readable = await h.knowledge.readable(h.user('member'), [
        project,
        system,
      ]);
      expect(readable.spaces.map((space) => space.ref.scope)).toEqual([
        'system',
      ]);
      const taken = await h.database.transaction((conn) =>
        h.knowledge.snapshots.take(conn, readable, {
          key: 'run-1',
          seriesKey: 's',
          layout,
        }),
      );
      expect(taken?.docs.map((doc) => doc.slug)).toEqual(['open']);
    } finally {
      await h.close();
    }
  });
});
