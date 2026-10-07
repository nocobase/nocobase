// @vitest-environment node
/** Knowledge documents: spaces and inheritance, versions under an optimistic lock, the tree, archiving, and access. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { chunkMarkdown } from '../server/services/chunks.js';
import { chunksRepo } from '../server/services/store.js';
import { chunkingOf, markdownHeadings } from '../shared/knowledge.js';
import {
  ADMIN,
  createKnowledgeHarness,
  READER,
  type KnowledgeHarness,
} from './harness.js';

const project = { scope: 'project', scopeId: 'p1' } as const;
const system = { scope: 'system', scopeId: '' } as const;

describe('knowledge documents', () => {
  let h: KnowledgeHarness;
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('admin', ADMIN);
    h.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
    h.projects.set('p2', {
      id: 'p2',
      name: 'Secret',
      leadUserId: 'other',
      seenBy: ['other', 'admin'],
    });
  });
  afterEach(async () => {
    await h?.close();
  });

  it('keeps a project space beside the system space it inherits, without shadowing', async () => {
    const { docs } = h.knowledge;
    const rules = await docs.create(h.user('admin'), {
      ...system,
      title: 'Team conventions',
      slug: 'conventions',
      summary: 'How we work.',
      content: '# Conventions\n\nReview every change.',
    });
    expect(rules).toMatchObject({
      scope: 'system',
      slug: 'conventions',
      version: 1,
      access: { read: true, edit: true },
    });
    // The same slug in a project adds a document; it does not hide the system's.
    const local = await docs.create(h.user('lead'), {
      ...project,
      title: 'Project conventions',
      slug: 'conventions',
      content: 'Use pnpm.',
    });
    expect(local.scope).toBe('project');
    const tree = await docs.tree(h.user('lead'), project);
    expect(
      tree.spaces.map((entry) => ({
        scope: entry.space.scope,
        title: entry.space.title,
        inherited: entry.space.inherited,
        edit: entry.space.access.edit,
        slugs: entry.docs.map((doc) => doc.slug),
      })),
    ).toEqual([
      {
        scope: 'project',
        title: 'Acme',
        inherited: false,
        edit: true,
        slugs: ['conventions'],
      },
      {
        scope: 'system',
        title: null,
        inherited: true,
        edit: false,
        slugs: ['conventions'],
      },
    ]);
    // By slug, the nearest space wins; the system's is still there by id.
    expect(
      (await docs.resolve(h.user('lead'), project, 'conventions')).id,
    ).toBe(local.id);
    expect((await docs.resolve(h.user('lead'), project, rules.id)).id).toBe(
      rules.id,
    );
    await expect(
      docs.create(h.user('lead'), {
        ...project,
        title: 'Again',
        slug: 'conventions',
        content: '',
      }),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_SLUG_TAKEN' });
  });

  it('writes a whole new version under an optimistic lock, and none for no change', async () => {
    const { docs } = h.knowledge;
    const doc = await docs.create(h.user('lead'), {
      ...project,
      title: '开发环境',
      content: '# 开发环境\n\n使用 Node 24。',
    });
    // A Chinese title derives no ASCII slug.
    expect(doc.slug).toBe('doc');
    const second = await docs.update(h.user('lead'), doc.id, {
      expectedVersion: 1,
      content: '# 开发环境\n\n使用 Node 24 与 pnpm 10。',
      note: '补充 pnpm 版本',
    });
    expect(second.version).toBe(2);
    await expect(
      docs.update(h.user('lead'), doc.id, {
        expectedVersion: 1,
        content: 'stale',
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'KNOWLEDGE_VERSION_CONFLICT',
      details: { currentVersion: 2, expectedVersion: 1 },
    });
    await expect(
      docs.update(h.user('lead'), doc.id, { content: 'no version' }),
    ).rejects.toMatchObject({ code: 'VERSION_REQUIRED' });
    // Saving what is there writes nothing.
    expect(
      (
        await docs.update(h.user('lead'), doc.id, {
          expectedVersion: 2,
          content: '# 开发环境\n\n使用 Node 24 与 pnpm 10。',
        })
      ).version,
    ).toBe(2);
    const versions = await docs.versions(h.user('lead'), doc.id);
    expect(versions.map((version) => [version.version, version.note])).toEqual([
      [2, '补充 pnpm 版本'],
      [1, null],
    ]);
    expect(versions[0]).not.toHaveProperty('content');
    expect((await docs.version(h.user('lead'), doc.id, 1)).content).toContain(
      '使用 Node 24。',
    );
    // The chunks follow the current version.
    const chunks = await chunksRepo(h.database.connection()).findMany({
      filter: { docId: doc.id },
    });
    expect(chunks.map((chunk) => Number(chunk.version))).toEqual([2]);
    expect(
      h.events
        .filter((event) => event.type === 'doc.versioned')
        .map((event) => event.type === 'doc.versioned' && event.version),
    ).toEqual([1, 2]);
  });

  it('keeps the tree within four levels, moves without a version, and archives leaves first', async () => {
    const { docs } = h.knowledge;
    const make = (title: string, parentId?: string) =>
      docs.create(h.user('lead'), {
        ...project,
        title,
        content: `# ${title}`,
        ...(parentId ? { parentId } : {}),
      });
    const a = await make('A');
    const b = await make('B', a.id);
    const c = await make('C', b.id);
    const d = await make('D', c.id);
    await expect(make('E', d.id)).rejects.toMatchObject({
      code: 'KNOWLEDGE_DEPTH_EXCEEDED',
    });
    expect(
      (await docs.get(h.user('lead'), d.id)).breadcrumbs.map((x) => x.title),
    ).toEqual(['A', 'B', 'C']);
    await expect(
      docs.move(h.user('lead'), a.id, { parentId: c.id }),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_INVALID_MOVE' });
    const other = await make('Other');
    // A is four levels deep with what is below it: under another root it would be five.
    await expect(
      docs.move(h.user('lead'), a.id, { parentId: other.id }),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_DEPTH_EXCEEDED' });
    const moved = await docs.move(h.user('lead'), d.id, { parentId: other.id });
    expect(moved).toMatchObject({ parentId: other.id, version: 1 });

    await expect(docs.archive(h.user('lead'), a.id)).rejects.toMatchObject({
      code: 'KNOWLEDGE_HAS_CHILDREN',
    });
    const archived = await docs.archive(h.user('lead'), moved.id);
    expect(archived.archivedAt).not.toBeNull();
    await expect(
      docs.update(h.user('lead'), moved.id, {
        expectedVersion: 1,
        content: 'x',
      }),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_ARCHIVED' });
    const tree = await docs.tree(h.user('lead'), project);
    expect(tree.spaces[0]!.docs.map((doc) => doc.title)).not.toContain('D');
    const withArchived = await docs.tree(h.user('lead'), project, {
      archived: true,
    });
    expect(withArchived.spaces[0]!.docs.map((doc) => doc.title)).toContain('D');
    // Agents never see an archived document.
    await expect(
      docs.get(h.agent('lead', 'agent-1'), moved.id),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      (await docs.restore(h.user('lead'), moved.id)).archivedAt,
    ).toBeNull();

    const verified = await docs.verify(h.user('lead'), a.id);
    expect(verified).toMatchObject({
      verifiedAt: '2026-10-02T08:00:00.000Z',
      verifiedBy: { kind: 'user', id: 'lead' },
      version: 1,
    });
  });

  it('lets whoever sees a space read it, and only leads and administrators edit', async () => {
    const { docs } = h.knowledge;
    const system1 = await docs.create(h.user('admin'), {
      ...system,
      title: 'Glossary',
      content: 'Words.',
    });
    // A contributor edits the projects they lead, not the system's.
    await expect(
      docs.create(h.user('lead'), { ...system, title: 'Nope', content: '' }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      docs.create(h.user('member'), { ...project, title: 'Nope', content: '' }),
    ).rejects.toMatchObject({ status: 403 });
    expect((await docs.get(h.user('member'), system1.id)).access).toEqual({
      read: true,
      propose: true,
      edit: false,
      manage: false,
    });
    // Someone who may not see a project does not see its space: 404, not 403.
    await expect(
      docs.tree(h.user('member'), { scope: 'project', scopeId: 'p2' }),
    ).rejects.toMatchObject({
      status: 404,
    });
    // Without the read level, nothing at all.
    h.levels.set('nobody', {
      read: 'none',
      propose: 'none',
      edit: 'none',
      manage: 'none',
    });
    await expect(docs.get(h.user('nobody'), system1.id)).rejects.toMatchObject({
      status: 404,
    });
    h.levels.set('reader', READER);
    expect((await docs.get(h.user('reader'), system1.id)).access.propose).toBe(
      false,
    );
    // An agent reads for the person who woke it, and never edits.
    await expect(
      docs.update(h.agent('admin', 'agent-1'), system1.id, {
        expectedVersion: 1,
        content: 'x',
      }),
    ).rejects.toMatchObject({ status: 403 });
    // An administrator edits everywhere.
    expect(
      (
        await docs.create(h.user('admin'), {
          ...project,
          title: 'By admin',
          content: '',
        })
      ).access.edit,
    ).toBe(true);
  });

  it('searches the chunks of the current versions, in Chinese and English, within what the viewer reads', async () => {
    const { docs } = h.knowledge;
    await docs.create(h.user('admin'), {
      ...system,
      title: 'Commit messages',
      content:
        '# Commit messages\n\nUse Conventional Commits.\n\n## Scope\n\nName the module, such as Agents.',
    });
    await docs.create(h.user('lead'), {
      ...project,
      title: '已知问题',
      summary: 'SQLite 锁',
      content:
        '# 已知问题\n\n## SQLite 锁\n\n在事务中不要用另一个连接读取，否则会一直等待连接。',
    });
    await docs.create(h.user('other'), {
      scope: 'project',
      scopeId: 'p2',
      title: 'Secret plan',
      content: 'Conventional secrets.',
    });
    const chinese = await docs.search(h.user('lead'), project, '连接');
    expect(chinese).toHaveLength(1);
    expect(chinese[0]).toMatchObject({
      title: '已知问题',
      scope: 'project',
      inherited: false,
      headingPath: ['已知问题', 'SQLite 锁'],
      anchor: 'sqlite-锁',
    });
    expect(chinese[0]!.excerpt).toContain('另一个连接');
    const english = await docs.search(
      h.user('lead'),
      project,
      'conventional MODULE',
    );
    expect(english).toHaveLength(0);
    const one = await docs.search(h.user('lead'), project, 'conventional');
    expect(one.map((hit) => [hit.title, hit.inherited])).toEqual([
      ['Commit messages', true],
    ]);
    // Another project's document is not found by someone who does not see it.
    expect(
      (
        await docs.search(
          h.user('other'),
          { scope: 'project', scopeId: 'p2' },
          'conventional',
        )
      ).map((hit) => hit.title),
    ).toEqual(['Commit messages', 'Secret plan']);
    // A title match is marked as one and cites the section that holds the words, here the first.
    const titled = await docs.search(h.user('lead'), project, '已知');
    expect(titled[0]).toMatchObject({
      title: '已知问题',
      titleMatch: true,
      lines: [1, 1],
    });
  });

  it('orders hits plainly: title matches first, then the most recently updated document', async () => {
    const { docs } = h.knowledge;
    const older = await docs.create(h.user('admin'), {
      ...system,
      title: 'Deploy guide',
      content: '# Deploy guide\n\nRun the deploy script.',
    });
    h.advance(60_000);
    const newer = await docs.create(h.user('admin'), {
      ...system,
      title: 'Release notes',
      content: '# Release notes\n\nEvery deploy is listed here.',
    });
    h.advance(60_000);
    await docs.create(h.user('admin'), {
      ...system,
      title: 'Runbook',
      content: '# Runbook\n\nIf a deploy fails, roll back.',
    });
    const hits = await docs.search(h.user('admin'), system, 'deploy');
    expect(hits.map((hit) => [hit.title, hit.titleMatch])).toEqual([
      ['Deploy guide', true],
      ['Runbook', false],
      ['Release notes', false],
    ]);
    expect(hits[0]).toMatchObject({ docId: older.id, version: 1 });
    expect(hits[2]).toMatchObject({
      docId: newer.id,
      version: 1,
      updatedAt: '2026-10-02T08:01:00.000Z',
    });
    expect(hits[2]!.excerpt).toContain('Every deploy is listed');
    // Every word must be held, case aside; none is not a match.
    expect(await docs.search(h.user('admin'), system, 'DEPLOY listed')).toEqual(
      [expect.objectContaining({ title: 'Release notes' })],
    );
    expect(await docs.search(h.user('admin'), system, '   ')).toEqual([]);
    // A title match is found even when no section holds the words, and cites the first section.
    await docs.create(h.user('admin'), {
      ...system,
      title: 'Onboarding checklist',
      content: '# Start here\n\nRead this first.',
    });
    expect(
      await docs.search(h.user('admin'), system, 'CHECKLIST'),
    ).toMatchObject([
      { title: 'Onboarding checklist', titleMatch: true, lines: [1, 3] },
    ]);
  });
});

describe('chunking', () => {
  it('cuts at headings up to h3, keeps code blocks whole, and numbers lines', () => {
    const fence = '```';
    const content = [
      'Intro line.',
      '',
      '# Title',
      '',
      'Body.',
      '',
      '## Steps',
      '',
      `${fence}sh`,
      '# not a heading',
      'pnpm install',
      fence,
      '',
      '#### Deep heading stays inside',
      '',
      '## Steps',
      'Again.',
    ].join('\n');
    const chunks = chunkMarkdown(content);
    expect(
      chunks.map((chunk) => [
        chunk.headingPath,
        chunk.anchor,
        chunk.lineStart,
        chunk.lineEnd,
      ]),
    ).toEqual([
      [[], null, 1, 1],
      [['Title'], 'title', 3, 5],
      [['Title', 'Steps'], 'steps', 7, 14],
      [['Title', 'Steps'], 'steps-2', 16, 17],
    ]);
    expect(chunks[2]!.text).toContain('# not a heading');
    expect(markdownHeadings(content).map((heading) => heading.anchor)).toEqual([
      'title',
      'steps',
      'deep-heading-stays-inside',
      'steps-2',
    ]);
  });

  it('cuts a long section between paragraphs, never inside a table', () => {
    const paragraph = (n: number) => `Paragraph ${n} ${'word '.repeat(80)}`;
    const table = [
      '| a | b |',
      '| - | - |',
      ...Array.from({ length: 30 }, (_, i) => `| ${i} | ${'x'.repeat(20)} |`),
    ];
    const content = [
      '# Long',
      '',
      paragraph(1),
      '',
      paragraph(2),
      '',
      ...table,
      '',
      paragraph(3),
      '',
      paragraph(4),
    ].join('\n');
    const chunks = chunkMarkdown(content);
    expect(chunks.length).toBeGreaterThan(1);
    expect(
      chunks.every(
        (chunk) => chunk.text.length <= 2000 || chunk.text.startsWith('|'),
      ),
    ).toBe(true);
    const withTable = chunks.filter((chunk) => chunk.text.includes('| 0 |'));
    expect(withTable).toHaveLength(1);
    expect(withTable[0]!.text).toContain('| 29 |');
  });

  it('takes the heading depth and the sizes as options, and answers the same for the same input', () => {
    const paragraph = (n: number) => `Paragraph ${n} ${'word '.repeat(60)}`;
    const content = [
      '# A',
      '',
      paragraph(1),
      '',
      '## B',
      '',
      paragraph(2),
      '',
      '### C',
      '',
      paragraph(3),
      '',
      paragraph(4),
    ].join('\n');
    const paths = (options?: Parameters<typeof chunkMarkdown>[1]) =>
      chunkMarkdown(content, options).map((chunk) => chunk.headingPath);
    expect(paths()).toEqual([['A'], ['A', 'B'], ['A', 'B', 'C']]);
    expect(paths({ headingDepth: 1, target: 1200, max: 2000 })).toEqual([
      ['A'],
    ]);
    expect(paths({ headingDepth: 2, target: 1200, max: 2000 })).toEqual([
      ['A'],
      ['A', 'B'],
    ]);
    // A smaller limit cuts the deepest section between its paragraphs.
    const small = chunkMarkdown(content, {
      headingDepth: 3,
      target: 200,
      max: 400,
    });
    expect(small.filter((chunk) => chunk.anchor === 'c')).toHaveLength(2);
    expect(
      chunkMarkdown(content, { headingDepth: 3, target: 200, max: 400 }),
    ).toEqual(small);
    expect(chunkingOf({ headingDepth: 2, target: 800, max: 1600 })).toEqual({
      headingDepth: 2,
      target: 800,
      max: 1600,
    });
    expect(chunkingOf({ headingDepth: 4, target: 800, max: 1600 })).toBeNull();
    expect(chunkingOf({ headingDepth: 2, target: 2000, max: 1600 })).toBeNull();
  });
});
