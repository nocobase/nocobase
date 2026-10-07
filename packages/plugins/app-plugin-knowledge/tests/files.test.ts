// @vitest-environment node
/**
 * Folders and files in a space's tree: uploading, the text extracted in the background, replacing, reading the bytes
 * (only for whoever reads the entry), parsing again, snapshots of files, and the HTTP routes.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createKnowledgeRoutes } from '../server/routes/api.js';
import { chunksRepo } from '../server/services/store.js';
import { DEFAULT_LAYOUT } from '../server/services/snapshots.js';
import {
  ADMIN,
  createKnowledgeHarness,
  READER,
  type KnowledgeHarness,
} from './harness.js';

const project = { scope: 'project', scopeId: 'p1' } as const;

const fixture = (name: string, as = name) =>
  new File(
    [readFileSync(path.resolve(import.meta.dirname, 'fixtures', name))],
    as,
  );

const text = async (body: ReadableStream<Uint8Array>) =>
  new TextDecoder().decode(
    new Uint8Array(await new Response(body).arrayBuffer()),
  );

describe('knowledge files', () => {
  let h: KnowledgeHarness;
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('admin', ADMIN);
    h.levels.set('reader', READER);
    h.projects.set('p1', {
      id: 'p1',
      name: 'Acme',
      leadUserId: 'lead',
      seenBy: ['lead', 'admin', 'reader'],
    });
  });
  afterEach(async () => {
    await h?.close();
  });

  it('uploads a file whose text is extracted after, and searched', async () => {
    const { files, docs } = h.knowledge;
    const uploaded = await files.upload(
      h.user('lead'),
      { ...project, summary: 'How we release.' },
      fixture('sample.docx', 'Release checklist.docx'),
    );
    expect(uploaded).toMatchObject({
      kind: 'file',
      title: 'Release checklist.docx',
      slug: 'release-checklist-docx',
      version: 1,
      content: '',
      file: {
        filename: 'Release checklist.docx',
        ext: 'docx',
        parseStatus: 'parsing',
        contentUrl: `/app/api/knowledge/docs/${uploaded.id}/file`,
        downloadUrl: `/app/api/knowledge/docs/${uploaded.id}/file?download=true`,
      },
    });
    await files.idle();
    const parsed = await docs.get(h.user('lead'), uploaded.id);
    expect(parsed.file?.parseStatus).toBe('ready');
    expect(parsed.content).toContain('quokka docx marker');
    const hits = await docs.search(h.user('reader'), project, 'quokka docx');
    expect(hits).toMatchObject([
      { docId: uploaded.id, kind: 'file', headingPath: ['Release checklist'] },
    ]);
    // The sections were rewritten twice: emptied with the version, written once parsed.
    expect(
      h.events.filter(
        (event) =>
          event.type === 'chunks.changed' && event.docId === uploaded.id,
      ),
    ).toHaveLength(2);
  });

  it('stores an image only, and refuses a file too large', async () => {
    const image = await h.knowledge.files.upload(
      h.user('lead'),
      project,
      fixture('sample.png'),
    );
    expect(image.file?.parseStatus).toBe('unsupported');
    expect(
      await chunksRepo(h.database.connection()).findMany({
        filter: { docId: image.id },
      }),
    ).toEqual([]);
    const small = await createKnowledgeHarness({ maxBytes: 10 });
    small.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
    await expect(
      small.knowledge.files.upload(
        small.user('lead'),
        project,
        fixture('sample.txt'),
      ),
    ).rejects.toMatchObject({ code: 'FILE_TOO_LARGE', status: 400 });
    await small.close();
  });

  it('replaces a file with a new version and keeps reading the old one', async () => {
    const { files } = h.knowledge;
    const first = await files.upload(
      h.user('lead'),
      project,
      fixture('sample.txt', 'notes.txt'),
    );
    const replaced = await files.replace(
      h.user('lead'),
      first.id,
      { expectedVersion: 1, note: 'Newer notes.' },
      fixture('sample.md', 'notes.md'),
    );
    expect(replaced).toMatchObject({
      version: 2,
      title: 'notes.txt',
      file: { filename: 'notes.md' },
    });
    await expect(
      files.replace(
        h.user('lead'),
        first.id,
        { expectedVersion: 1 },
        fixture('sample.txt'),
      ),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_VERSION_CONFLICT' });
    await files.idle();
    const old = await files.content(h.user('reader'), first.id, { version: 1 });
    expect(old.file.filename).toBe('notes.txt');
    expect(await text(old.body)).toContain('quokka txt marker');
    const versions = await h.knowledge.docs.versions(h.user('lead'), first.id);
    expect(versions.map((version) => version.file?.filename)).toEqual([
      'notes.md',
      'notes.txt',
    ]);
    // Only the current version's text is searched.
    expect(
      await h.knowledge.docs.search(h.user('lead'), project, 'quokka txt'),
    ).toEqual([]);
    expect(
      await h.knowledge.docs.search(h.user('lead'), project, 'quokka md'),
    ).toHaveLength(1);
  });

  it('serves the bytes only to whoever reads the entry; an agent never an archived one', async () => {
    const { files, docs } = h.knowledge;
    const doc = await files.upload(
      h.user('lead'),
      project,
      fixture('sample.csv'),
    );
    await expect(
      files.content(h.user('stranger'), doc.id),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      files.upload(h.user('reader'), project, fixture('sample.csv')),
    ).rejects.toMatchObject({ status: 403 });
    const agent = h.agent('reader', 'a1');
    expect(await text((await files.content(agent, doc.id)).body)).toContain(
      'quokka csv marker',
    );
    await docs.archive(h.user('lead'), doc.id);
    await expect(files.content(agent, doc.id)).rejects.toMatchObject({
      status: 404,
    });
    expect((await files.content(h.user('reader'), doc.id)).file.filename).toBe(
      'sample.csv',
    );
  });

  it('keeps why a file failed, and parses it again when asked', async () => {
    const { files, docs } = h.knowledge;
    const broken = await files.upload(
      h.user('lead'),
      project,
      new File(['not a document'], 'broken.docx'),
    );
    await files.idle();
    const failed = await docs.get(h.user('lead'), broken.id);
    expect(failed.file).toMatchObject({ parseStatus: 'failed' });
    expect(failed.file?.parseError).toBeTruthy();
    const again = await files.reparse(h.user('lead'), broken.id);
    expect(again.file?.parseStatus).toBe('parsing');
    await files.idle();
    expect((await docs.get(h.user('lead'), broken.id)).file?.parseStatus).toBe(
      'failed',
    );
    const fine = await files.upload(
      h.user('lead'),
      project,
      fixture('sample.md'),
    );
    await files.idle();
    await expect(files.reparse(h.user('lead'), fine.id)).rejects.toMatchObject({
      code: 'KNOWLEDGE_NOT_FAILED',
    });
    await expect(
      files.reparse(h.user('reader'), broken.id),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('parses again at start what a stopped server left parsing', async () => {
    const { files, docs } = h.knowledge;
    const doc = await files.upload(
      h.user('lead'),
      project,
      fixture('sample.json'),
    );
    await files.idle();
    const { versionsRepo } = await import('../server/services/store.js');
    await versionsRepo(h.database.connection()).updateMany({
      filter: { docId: doc.id },
      values: { parseStatus: 'parsing', content: '' },
    });
    expect(await files.resume()).toBe(1);
    await files.idle();
    expect((await docs.get(h.user('lead'), doc.id)).content).toContain(
      'quokka json marker',
    );
  });

  it('keeps folders as names in the tree, with no versions', async () => {
    const { docs, files } = h.knowledge;
    const folder = await docs.create(h.user('lead'), {
      ...project,
      kind: 'folder',
      title: 'Specs',
    });
    expect(folder).toMatchObject({ kind: 'folder', version: 0, file: null });
    const inside = await files.upload(
      h.user('lead'),
      { ...project, parentId: folder.id },
      fixture('sample.pdf', 'design.pdf'),
    );
    expect(inside.parentId).toBe(folder.id);
    await expect(
      docs.create(h.user('lead'), {
        ...project,
        parentId: inside.id,
        title: 'Under a file',
        content: 'x',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_PARENT' });
    const renamed = await docs.update(h.user('lead'), folder.id, {
      expectedVersion: 0,
      title: 'Specifications',
    });
    expect(renamed).toMatchObject({ title: 'Specifications', version: 0 });
    await expect(docs.verify(h.user('lead'), folder.id)).rejects.toMatchObject({
      code: 'INVALID_KIND',
    });
    await expect(docs.versions(h.user('lead'), folder.id)).resolves.toEqual([]);
    const tree = await docs.tree(h.user('lead'), project);
    expect(tree.spaces[0].docs.map((doc) => [doc.kind, doc.title])).toEqual([
      ['folder', 'Specifications'],
      ['file', 'design.pdf'],
    ]);
    // A file's text is not edited as text; its title is a new version that keeps the file.
    await expect(
      docs.update(h.user('lead'), inside.id, {
        expectedVersion: 1,
        content: 'x',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CONTENT' });
    const retitled = await docs.update(h.user('lead'), inside.id, {
      expectedVersion: 1,
      title: 'Design',
    });
    expect(retitled).toMatchObject({
      version: 2,
      file: { filename: 'design.pdf' },
    });
  });

  it('exports files as their text, folders as directories, without the originals', async () => {
    const { docs, files } = h.knowledge;
    const folder = await docs.create(h.user('lead'), {
      ...project,
      kind: 'folder',
      title: 'Specs',
      slug: 'specs',
    });
    await files.upload(
      h.user('lead'),
      { ...project, parentId: folder.id },
      fixture('sample.xlsx', 'budget.xlsx'),
    );
    await files.upload(
      h.user('lead'),
      project,
      fixture('sample.png', 'logo.png'),
    );
    await files.idle();
    const readable = await h.knowledge.readable(h.user('lead'), [project]);
    const layout = {
      ...DEFAULT_LAYOUT,
      original: (slug: string) => `original: \`kb download ${slug}\``,
    };
    const snapshot = await h.database.transaction((conn) =>
      h.knowledge.snapshots.take(conn, readable, {
        key: 'run-1',
        seriesKey: 'session-1',
        layout,
      }),
    );
    expect(snapshot?.omitted).toBe(0);
    const exported = await h.knowledge.snapshots.files(
      h.knowledge.connection(),
      'run-1',
      layout,
    );
    const byPath = new Map(
      exported!.files.map((file) => [file.path, file.content]),
    );
    expect([...byPath.keys()]).toEqual([
      'INDEX.md',
      'project/specs/budget.xlsx.md',
      'project/logo.png.md',
      '.manifest.json',
    ]);
    const budget = byPath.get('project/specs/budget.xlsx.md')!;
    expect(budget).toContain('kind: file\nfilename: "budget.xlsx"');
    expect(budget).toContain('text: ready');
    expect(budget).toContain('quokka xlsx marker');
    expect(byPath.get('project/logo.png.md')).toContain(
      'Text is not extracted from files of this type.',
    );
    const index = byPath.get('INDEX.md')!;
    expect(index).toContain('- Specs/ `specs` (folder)');
    expect(index).toContain(
      'file budget.xlsx, original: `kb download budget-xlsx`',
    );
    expect(snapshot?.docs.map((doc) => doc.kind)).toEqual([
      'folder',
      'file',
      'file',
    ]);
  });

  describe('routes', () => {
    let app: Hono;
    beforeEach(() => {
      app = new Hono();
      app.route(
        '/knowledge',
        createKnowledgeRoutes(
          h.knowledge,
          (c) => ({ userId: c.req.header('x-user') ?? 'nobody' }),
          (space) =>
            space.scope === 'project' && space.scopeId ? space : null,
        ),
      );
    });

    const upload = (user: string, path: string, form: FormData) =>
      app.request(`/knowledge${path}`, {
        method: 'POST',
        headers: { 'x-user': user },
        body: form,
      });

    it('uploads through a form and serves the bytes with their headers', async () => {
      const form = new FormData();
      form.append('scope', 'project');
      form.append('scopeId', 'p1');
      form.append('file', fixture('sample.pdf', '设计 spec.pdf'));
      const created = await upload('lead', '/docs/upload', form);
      expect(created.status).toBe(200);
      const { data } = (await created.json()) as {
        data: { id: string; kind: string };
      };
      expect(data.kind).toBe('file');
      const served = await app.request(`/knowledge/docs/${data.id}/file`, {
        headers: { 'x-user': 'reader' },
      });
      expect(served.status).toBe(200);
      expect(served.headers.get('content-type')).toBe('application/pdf');
      expect(served.headers.get('content-disposition')).toMatch(
        /^inline; .*filename\*=UTF-8''%E8%AE%BE%E8%AE%A1%20spec\.pdf$/u,
      );
      expect((await served.arrayBuffer()).byteLength).toBe(
        fixture('sample.pdf').size,
      );
      const download = await app.request(
        `/knowledge/docs/${data.id}/file?download=true`,
        { headers: { 'x-user': 'reader' } },
      );
      expect(download.headers.get('content-disposition')).toMatch(
        /^attachment; /u,
      );
      const denied = await app.request(`/knowledge/docs/${data.id}/file`, {
        headers: { 'x-user': 'stranger' },
      });
      expect(denied.status).toBe(404);
      const replacement = new FormData();
      replacement.append('expectedVersion', '1');
      replacement.append('file', fixture('sample.txt'));
      const replaced = await upload(
        'lead',
        `/docs/${data.id}/replaceFile`,
        replacement,
      );
      expect(replaced.status).toBe(200);
      expect(await replaced.json()).toMatchObject({ data: { version: 2 } });
    });

    it('refuses a body without a file', async () => {
      const form = new FormData();
      form.append('scope', 'project');
      form.append('scopeId', 'p1');
      const refused = await upload('lead', '/docs/upload', form);
      expect(refused.status).toBe(400);
      expect(await refused.json()).toMatchObject({
        error: {
          reason: 'INVALID_FILE',
          domain: 'knowledge',
          fieldViolations: [{ field: 'file' }],
        },
      });
    });

    it('refuses an unknown form field, and a body that is not a form', async () => {
      const form = new FormData();
      form.append('scope', 'project');
      form.append('scopeId', 'p1');
      form.append('colour', 'red');
      form.append('file', fixture('sample.txt'));
      const unknown = await upload('lead', '/docs/upload', form);
      expect(unknown.status).toBe(400);
      expect(await unknown.json()).toMatchObject({
        error: { reason: 'INVALID_INPUT' },
      });
      const json = await app.request('/knowledge/docs/upload', {
        method: 'POST',
        headers: { 'x-user': 'lead', 'content-type': 'application/json' },
        body: '{}',
      });
      expect(json.status).toBe(415);
      expect(await json.json()).toMatchObject({
        error: { reason: 'UNSUPPORTED_CONTENT_TYPE', domain: 'knowledge' },
      });
    });
  });
});
