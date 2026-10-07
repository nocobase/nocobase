// @vitest-environment node
/**
 * Proposals that carry a file: a new file entry or a file's replacement, uploaded with the proposal or later through a
 * one-time ticket, decided like any other; rejecting or withdrawing deletes the file.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createKnowledgeTicketRoutes } from '../server/routes/api.js';
import { filesRepo } from '../server/services/store.js';
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

describe('proposals with files', () => {
  let h: KnowledgeHarness;
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('admin', ADMIN);
    h.levels.set('reader', READER);
    h.projects.set('p1', {
      id: 'p1',
      name: 'Acme',
      leadUserId: 'lead',
      seenBy: ['lead', 'admin', 'member', 'reader'],
    });
  });
  afterEach(async () => {
    await h?.close();
  });

  const storedFiles = () => filesRepo(h.database.connection()).findMany({});

  it('proposes a new file, which accepting files and parses', async () => {
    const { proposals, files, docs } = h.knowledge;
    const proposal = await proposals.proposeFile(
      h.user('member'),
      {
        kind: 'create',
        space: project,
        reason: 'The vendor contract we follow.',
      },
      fixture('sample.docx', 'contract.docx'),
    );
    expect(proposal).toMatchObject({
      kind: 'create',
      status: 'pending',
      title: 'contract.docx',
      content: null,
      file: {
        filename: 'contract.docx',
        parseStatus: null,
        contentUrl: `/app/api/knowledge/proposals/${proposal.id}/file`,
      },
    });
    const staged = await proposals.file(h.user('lead'), proposal.id);
    expect(staged.file.filename).toBe('contract.docx');
    await staged.body.cancel();
    const accepted = await proposals.accept(h.user('lead'), proposal.id);
    expect(accepted).toMatchObject({ status: 'accepted', appliedVersion: 1 });
    await files.idle();
    const doc = await docs.get(h.user('member'), accepted.docId!);
    expect(doc).toMatchObject({
      kind: 'file',
      title: 'contract.docx',
      file: { filename: 'contract.docx', parseStatus: 'ready' },
    });
    expect(doc.content).toContain('quokka docx marker');
    expect(doc.updatedBy).toMatchObject({ kind: 'user', id: 'member' });
  });

  it('proposes a file’s replacement, and refuses text for a file or a file for an article', async () => {
    const { proposals, files, docs } = h.knowledge;
    const doc = await files.upload(
      h.user('lead'),
      project,
      fixture('sample.txt', 'notes.txt'),
    );
    await files.idle();
    const article = await docs.create(h.user('lead'), {
      ...project,
      title: 'Guide',
      content: '# Guide',
    });
    await expect(
      proposals.propose(h.user('member'), {
        kind: 'update',
        docId: doc.id,
        content: 'new text',
        reason: 'Edit.',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_FILE' });
    await expect(
      proposals.proposeFile(
        h.user('member'),
        { kind: 'update', docId: article.id, reason: 'Swap.' },
        fixture('sample.md'),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_FILE' });
    const proposal = await proposals.proposeFile(
      h.user('member'),
      { kind: 'update', docId: doc.id, reason: 'Newer notes.' },
      fixture('sample.md', 'notes.md'),
    );
    expect(proposal).toMatchObject({ baseVersion: 1, stale: false });
    const accepted = await proposals.accept(h.user('lead'), proposal.id);
    expect(accepted.appliedVersion).toBe(2);
    await files.idle();
    expect(await docs.get(h.user('lead'), doc.id)).toMatchObject({
      version: 2,
      file: { filename: 'notes.md', parseStatus: 'ready' },
    });
    // The two refused uploads were deleted again; the original and the replacement stay.
    expect((await storedFiles()).map((file) => file.filename).sort()).toEqual([
      'notes.md',
      'notes.txt',
    ]);
  });

  it('deletes the file of a proposal rejected or withdrawn', async () => {
    const { proposals } = h.knowledge;
    const rejected = await proposals.proposeFile(
      h.user('member'),
      { kind: 'create', space: project, reason: 'One.' },
      fixture('sample.csv'),
    );
    const withdrawn = await proposals.proposeFile(
      h.user('member'),
      { kind: 'create', space: project, reason: 'Two.' },
      fixture('sample.json'),
    );
    expect(await storedFiles()).toHaveLength(2);
    await proposals.reject(h.user('lead'), rejected.id, { comment: 'No.' });
    await proposals.withdraw(h.user('member'), withdrawn.id);
    await h.knowledge.files.idle();
    expect(await storedFiles()).toEqual([]);
  });

  it('takes an agent’s file through a one-time ticket', async () => {
    const { proposals, files } = h.knowledge;
    const agent = h.agent('member', 'a1', 'run-1');
    const ticket = await proposals.ticket(agent, {
      kind: 'create',
      space: project,
      reason: 'Found in the run.',
      filename: 'findings.md',
    });
    const app = new Hono();
    app.route('/knowledge/tickets', createKnowledgeTicketRoutes(h.knowledge));
    const send = (token: string) =>
      app.request(`/knowledge/tickets/${ticket.id}/redeem`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-disposition': "attachment; filename*=UTF-8''ignored.md",
        },
        body: readFileSync(
          path.resolve(import.meta.dirname, 'fixtures', 'sample.md'),
        ),
      });
    const wrong = await send('nope');
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toMatchObject({
      error: { reason: 'INVALID_TICKET', domain: 'knowledge' },
    });
    const sent = await send(ticket.token);
    expect(sent.status).toBe(200);
    const { data } = (await sent.json()) as {
      data: {
        id: string;
        proposer: { kind: string };
        runId: string;
        title: string;
      };
    };
    expect(data).toMatchObject({
      proposer: { kind: 'agent', id: 'a1' },
      runId: 'run-1',
      title: 'findings.md',
    });
    // Used once.
    expect((await send(ticket.token)).status).toBe(401);
    // A proposal's file is read only by whoever reads the proposal.
    await expect(
      proposals.file(h.user('stranger'), data.id),
    ).rejects.toMatchObject({ status: 404 });
    await proposals.accept(h.user('lead'), data.id);
    await files.idle();
    expect(
      await h.knowledge.docs.search(h.user('member'), project, 'quokka md'),
    ).toMatchObject([{ kind: 'file', title: 'findings.md' }]);
  });

  it('refuses another’s upload and a ticket for an article', async () => {
    const { proposals, docs } = h.knowledge;
    const article = await docs.create(h.user('lead'), {
      ...project,
      title: 'Guide',
      content: '# Guide',
    });
    await expect(
      proposals.ticket(h.agent('member', 'a1'), {
        kind: 'update',
        docId: article.id,
        reason: 'Swap.',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_FILE' });
    const theirs = await proposals.proposeFile(
      h.user('member'),
      { kind: 'create', space: project, reason: 'Mine.' },
      fixture('sample.txt'),
    );
    await expect(
      proposals.propose(h.user('admin'), {
        kind: 'create',
        space: project,
        reason: 'Taken.',
        fileId: theirs.file!.id,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_FILE' });
  });
});
