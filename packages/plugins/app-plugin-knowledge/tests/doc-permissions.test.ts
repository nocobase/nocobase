// @vitest-environment node
/**
 * Permissions on folders and articles over a real database: the routes that read and replace them, what each reader
 * then sees and may do, the access keys kept on entries and sections, and retrieval that never lets a restricted
 * section through, by keyword, by an index of the application's own, or as the whole knowledge of a prompt.
 */
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createKnowledgeRoutes } from '../server/routes/api.js';
import type { KnowledgeSearchProvider } from '../server/services/search.js';
import { chunksRepo, docsRepo } from '../server/services/store.js';
import type { KnowledgeDoc } from '../shared/knowledge.js';
import {
  ADMIN,
  createKnowledgeHarness,
  type KnowledgeHarness,
} from './harness.js';

const project = { scope: 'project', scopeId: 'p1' } as const;

describe('permissions on folders and articles', () => {
  let h: KnowledgeHarness;
  let app: Hono;
  let secrets: KnowledgeDoc;
  let keys: KnowledgeDoc;
  let handbook: KnowledgeDoc;
  let deploy: KnowledgeDoc;

  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('admin', ADMIN);
    h.projects.set('p1', {
      id: 'p1',
      name: 'Acme',
      leadUserId: 'lead',
      seenBy: ['lead', 'member', 'admin'],
    });
    app = new Hono();
    app.route(
      '/knowledge',
      createKnowledgeRoutes(
        h.knowledge,
        (c) => ({ userId: c.req.header('x-user') ?? 'nobody' }),
        (space) =>
          space.scope === 'system'
            ? { scope: 'system', scopeId: '' }
            : space.scope === 'project' && space.scopeId
              ? space
              : null,
      ),
    );
    const { docs } = h.knowledge;
    const lead = h.user('lead');
    secrets = await docs.create(lead, {
      ...project,
      kind: 'folder',
      title: 'Secrets',
    });
    keys = await docs.create(lead, {
      ...project,
      parentId: secrets.id,
      title: 'Keys',
      content: '# Keys\n\nRotate the vault token monthly.',
    });
    handbook = await docs.create(lead, {
      ...project,
      kind: 'folder',
      title: 'Handbook',
    });
    deploy = await docs.create(lead, {
      ...project,
      parentId: handbook.id,
      title: 'Deploy',
      content: '# Deploy\n\nRead the vault before you deploy.',
    });
  });
  afterEach(async () => {
    await h?.close();
  });

  const call = (user: string, method: string, path: string, body?: unknown) =>
    app.request(`/knowledge${path}`, {
      method,
      headers: { 'x-user': user, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const restrict = (user: string, docId: string, body: unknown) =>
    call(user, 'PUT', `/docs/${docId}/permissions`, body);
  const titles = async (user: string) =>
    (await h.knowledge.docs.tree(h.user(user), project)).spaces
      .filter((entry) => entry.space.scope === 'project')
      .flatMap((entry) => entry.docs.map((doc) => doc.title))
      .sort();
  const found = async (user: string, q: string) =>
    (await h.knowledge.docs.search(h.user(user), project, q)).map(
      (hit) => hit.title,
    );

  it('replaces a node’s permissions for whoever manages it, and answers what it inherits', async () => {
    const replaced = await restrict('lead', secrets.id, {
      mode: 'custom',
      entries: [{ subject: { type: 'user', id: 'outsider' }, level: 'read' }],
    });
    expect(replaced.status).toBe(200);
    expect(await replaced.json()).toMatchObject({
      data: {
        docId: secrets.id,
        mode: 'custom',
        entries: [
          {
            subject: { type: 'user', id: 'outsider', label: 'user outsider' },
            level: 'read',
          },
        ],
        inherited: [],
        types: [
          { type: 'user', icon: 'user' },
          { type: 'role', icon: 'role' },
          { type: 'agent', icon: 'agent' },
        ],
      },
    });
    const under = await call('lead', 'GET', `/docs/${keys.id}/permissions`);
    expect(await under.json()).toMatchObject({
      data: {
        mode: 'inherit',
        entries: [],
        inherited: [
          {
            from: { kind: 'doc', id: secrets.id, mode: 'custom' },
            entries: [{ subject: { id: 'outsider' }, level: 'read' }],
          },
        ],
      },
    });
    const open = await call('lead', 'GET', `/docs/${deploy.id}/permissions`);
    expect(await open.json()).toMatchObject({
      data: { inherited: [{ from: { kind: 'space' } }] },
    });
  });

  it('refuses a change before reading it, and a subject it does not know', async () => {
    // A member reads the handbook but does not manage it: 403 whatever the body.
    const refused = await restrict('member', handbook.id, { mode: 'nonsense' });
    expect(refused.status).toBe(403);
    expect(
      (await call('member', 'GET', `/docs/${handbook.id}/permissions`)).status,
    ).toBe(403);
    const unknownType = await restrict('lead', handbook.id, {
      mode: 'inherit',
      entries: [{ subject: { type: 'team', id: 't1' }, level: 'read' }],
    });
    expect(unknownType.status).toBe(400);
    expect(await unknownType.json()).toMatchObject({
      error: { reason: 'INVALID_SUBJECT' },
    });
    const gone = await restrict('lead', handbook.id, {
      mode: 'inherit',
      entries: [{ subject: { type: 'user', id: 'gone' }, level: 'read' }],
    });
    expect(gone.status).toBe(400);
    const twice = await restrict('lead', handbook.id, {
      mode: 'inherit',
      entries: [
        { subject: { type: 'user', id: 'member' }, level: 'read' },
        { subject: { type: 'user', id: 'member' }, level: 'edit' },
      ],
    });
    expect(await twice.json()).toMatchObject({
      error: { reason: 'DUPLICATE_SUBJECT' },
    });
    const extra = await restrict('lead', handbook.id, {
      mode: 'inherit',
      entries: [],
      colour: 'red',
    });
    expect(extra.status).toBe(400);
  });

  it('hides a custom folder from the space and shows it to whoever it names, even outside the space', async () => {
    await restrict('lead', secrets.id, {
      mode: 'custom',
      entries: [{ subject: { type: 'user', id: 'outsider' }, level: 'read' }],
    });
    expect(await titles('member')).toEqual(['Deploy', 'Handbook']);
    expect(await titles('outsider')).toEqual(['Keys', 'Secrets']);
    // Whoever manages the space keeps everything.
    expect(await titles('lead')).toEqual([
      'Deploy',
      'Handbook',
      'Keys',
      'Secrets',
    ]);
    expect((await call('member', 'GET', `/docs/${keys.id}`)).status).toBe(404);
    expect(
      (await call('member', 'GET', `/docs/${keys.id}/versions`)).status,
    ).toBe(404);
    expect((await call('outsider', 'GET', `/docs/${deploy.id}`)).status).toBe(
      404,
    );
    const read = await call('outsider', 'GET', `/docs/${keys.id}`);
    expect(await read.json()).toMatchObject({
      data: {
        access: { read: true, propose: false, edit: false, manage: false },
        breadcrumbs: [{ id: secrets.id }],
      },
    });
    const access = await call('outsider', 'GET', `/docs/${keys.id}/access`);
    expect(await access.json()).toMatchObject({
      data: {
        level: 'read',
        source: {
          kind: 'entry',
          docId: secrets.id,
          docTitle: 'Secrets',
          subject: { type: 'user', id: 'outsider' },
        },
        mode: 'inherit',
        entryCount: 0,
        restrictedBy: { id: secrets.id, title: 'Secrets' },
      },
    });
    const mine = await call('lead', 'GET', `/docs/${keys.id}/access`);
    expect(await mine.json()).toMatchObject({
      data: { level: 'manage', source: { kind: 'manager' } },
    });
    const summary = (
      await h.knowledge.docs.tree(h.user('lead'), project)
    ).spaces[0]!.docs.find((doc) => doc.id === secrets.id);
    expect(summary).toMatchObject({ accessMode: 'custom', accessEntries: 1 });
  });

  it('lets a grant edit under a node, and nothing beyond it', async () => {
    await restrict('lead', handbook.id, {
      mode: 'inherit',
      entries: [{ subject: { type: 'user', id: 'member' }, level: 'edit' }],
    });
    const under = await call('member', 'POST', '/docs', {
      ...project,
      parentId: handbook.id,
      title: 'Rollback',
      content: 'Undo it.',
    });
    expect(under.status).toBe(201);
    expect(
      (
        await call('member', 'POST', '/docs', {
          ...project,
          title: 'At the top',
          content: 'No.',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await call('member', 'PATCH', `/docs/${deploy.id}`, {
          expectedVersion: 1,
          content: 'Changed.',
        })
      ).status,
    ).toBe(200);
    // A space editor who is shut out of a custom folder cannot add under it either.
    await restrict('lead', secrets.id, { mode: 'custom', entries: [] });
    h.levels.set('editor', { ...ADMIN, manage: 'none' });
    h.projects.set('p1', {
      id: 'p1',
      name: 'Acme',
      leadUserId: 'lead',
      seenBy: ['lead', 'member', 'admin', 'editor'],
    });
    const blind = await call('editor', 'POST', '/docs', {
      ...project,
      parentId: secrets.id,
      title: 'Sneak',
      content: 'In.',
    });
    expect(blind.status).toBe(400);
  });

  it('keeps access keys on entries and sections, and announces the ones that change', async () => {
    const keyOf = async (id: string) =>
      (await docsRepo(h.database.connection()).findOne({ filter: { id } }))!
        .aclKey;
    const chunkKeys = async (docId: string) =>
      (
        await chunksRepo(h.database.connection()).findMany({
          filter: { docId },
        })
      ).map((chunk) => chunk.aclKey);
    h.events.length = 0;
    await restrict('lead', secrets.id, { mode: 'custom', entries: [] });
    expect(await keyOf(secrets.id)).toBe(secrets.id);
    expect(await keyOf(keys.id)).toBe(secrets.id);
    expect(await keyOf(deploy.id)).toBeNull();
    expect(await chunkKeys(keys.id)).toEqual([secrets.id]);
    expect(
      h.events.filter((event) => event.type === 'chunks.changed'),
    ).toMatchObject([{ docId: keys.id }]);
    // A new entry under it takes its key; moving one out drops it.
    const child = await h.knowledge.docs.create(h.user('lead'), {
      ...project,
      parentId: secrets.id,
      title: 'Certificates',
      content: 'Renew them.',
    });
    expect(await keyOf(child.id)).toBe(secrets.id);
    expect(await chunkKeys(child.id)).toEqual([secrets.id]);
    await h.knowledge.docs.move(h.user('lead'), keys.id, { parentId: null });
    expect(await keyOf(keys.id)).toBeNull();
    expect(await chunkKeys(keys.id)).toEqual([null]);
    expect(await titles('member')).toContain('Keys');
    // Back to inherit with no entries: no key at all.
    await restrict('lead', secrets.id, { mode: 'inherit', entries: [] });
    expect(await keyOf(child.id)).toBeNull();
  });

  it('offers subjects to whoever manages something in the space', async () => {
    const offered = await call(
      'lead',
      'GET',
      '/subjects?scope=project&scopeId=p1&q=out&type=user',
    );
    expect(offered.status).toBe(200);
    expect(await offered.json()).toMatchObject({
      data: [{ type: 'user', id: 'outsider', label: 'user outsider' }],
      meta: { types: [{ type: 'user' }, { type: 'role' }, { type: 'agent' }] },
    });
    expect(
      (await call('member', 'GET', '/subjects?scope=project&scopeId=p1'))
        .status,
    ).toBe(403);
    // A member who manages one node may search too.
    await restrict('lead', handbook.id, {
      mode: 'inherit',
      entries: [{ subject: { type: 'user', id: 'member' }, level: 'manage' }],
    });
    expect(
      (await call('member', 'GET', '/subjects?scope=project&scopeId=p1'))
        .status,
    ).toBe(200);
  });

  it('follows role membership at query time', async () => {
    await restrict('lead', secrets.id, {
      mode: 'custom',
      entries: [{ subject: { type: 'role', id: 'ops' }, level: 'read' }],
    });
    expect(await titles('member')).not.toContain('Keys');
    h.roles.set('member', ['ops']);
    expect(await titles('member')).toContain('Keys');
  });

  it('reads for an agent only what both it and its person may', async () => {
    await restrict('lead', secrets.id, {
      mode: 'custom',
      entries: [{ subject: { type: 'user', id: 'member' }, level: 'read' }],
    });
    const agent = h.agent('member', 'a1');
    const agentTitles = async () =>
      (await h.knowledge.docs.tree(agent, project)).spaces
        .filter((entry) => entry.space.scope === 'project')
        .flatMap((entry) => entry.docs.map((doc) => doc.title))
        .sort();
    expect(await agentTitles()).toEqual(['Deploy', 'Handbook']);
    await restrict('lead', secrets.id, {
      mode: 'custom',
      entries: [
        { subject: { type: 'user', id: 'member' }, level: 'read' },
        { subject: { type: 'agent', id: 'a1' }, level: 'manage' },
      ],
    });
    expect(await agentTitles()).toContain('Keys');
    const doc = await h.knowledge.docs.get(agent, keys.id);
    expect(doc.access).toEqual({
      read: true,
      propose: false,
      edit: false,
      manage: false,
    });
  });

  describe('retrieval', () => {
    beforeEach(async () => {
      await restrict('lead', secrets.id, {
        mode: 'custom',
        entries: [{ subject: { type: 'user', id: 'outsider' }, level: 'read' }],
      });
    });

    it('never finds a restricted section by keyword', async () => {
      expect(await found('member', 'vault')).toEqual(['Deploy']);
      expect(await found('member', 'keys')).toEqual([]);
      expect(await found('outsider', 'vault')).toEqual(['Keys']);
      expect((await found('lead', 'vault')).sort()).toEqual(['Deploy', 'Keys']);
    });

    it('drops what an index answers that the reader may not read, and gives it the reader’s gates', async () => {
      const asked: string[][] = [];
      // An index that answers every section, whatever it was asked.
      const careless: KnowledgeSearchProvider = {
        name: 'careless',
        async search(spaces) {
          asked.push(
            spaces.flatMap((space) => [
              ...(space.gates.space ? [`space:${space.id}`] : []),
              ...space.gates.nodes.map((key) => `node:${key}`),
            ]),
          );
          const all = await chunksRepo(h.database.connection()).findMany({});
          return all.map((chunk) => ({ chunkId: chunk.id, score: 1 }));
        },
      };
      const remove = h.knowledge.registerSearchProvider(careless);
      try {
        // Every section it answers is checked again: the restricted one never comes back.
        expect(await found('member', 'rotate')).toEqual(['Deploy']);
        expect(await found('member', 'deploy')).toEqual(['Deploy']);
        const spaceId = (await docsRepo(h.database.connection()).findOne({
          filter: { id: deploy.id },
        }))!.spaceId;
        expect(asked[0]).toEqual([`space:${spaceId}`]);
        await found('outsider', 'rotate');
        expect(asked.at(-1)).toEqual([`node:${secrets.id}`]);
      } finally {
        remove();
      }
    });

    it('leaves a restricted article out of the whole knowledge, outlines and snapshots', async () => {
      const readable = await h.knowledge.readable(h.user('member'), [project]);
      const conn = h.database.connection();
      const whole = await h.knowledge.texts(conn, readable);
      expect(
        whole.spaces.flatMap((space) => space.docs.map((doc) => doc.title)),
      ).toEqual(['Deploy']);
      expect(
        (await h.knowledge.texts(conn, readable, { maxChars: 1000 })).spaces
          .flatMap((space) => space.docs)
          .map((doc) => doc.title),
      ).toEqual(['Deploy']);
      const outline = await h.knowledge.outline(conn, readable);
      expect(outline[0]!.docs.map((doc) => doc.title).sort()).toEqual([
        'Deploy',
        'Handbook',
      ]);
      const snapshot = await h.database.transaction((tx) =>
        h.knowledge.snapshots.take(tx, readable, {
          key: 'run-1',
          seriesKey: 'series',
          layout: {
            dir: () => 'project',
            heading: () => 'Project',
            preamble: [],
            unwritten: (slug) => slug,
            url: (_, docId) => `/doc/${docId}`,
          },
        }),
      );
      expect(snapshot!.docs.map((doc) => doc.title).sort()).toEqual([
        'Deploy',
        'Handbook',
      ]);
      // Shared beyond the space: the outsider's whole knowledge is that page alone.
      const theirs = await h.knowledge.readable(h.user('outsider'), [project]);
      expect(
        (await h.knowledge.texts(conn, theirs)).spaces
          .flatMap((space) => space.docs)
          .map((doc) => doc.title),
      ).toEqual(['Keys']);
    });
  });
});
