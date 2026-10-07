// @vitest-environment node
/**
 * Clearing what uploads leave behind: expired upload tickets, and stored files nothing names once they are older than
 * the grace period. A file a version or a pending proposal names stays, however old.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CLEANUP_GRACE_MS } from '../server/services/cleanup.js';
import {
  filesRepo,
  proposalsRepo,
  ticketsRepo,
} from '../server/services/store.js';
import {
  ADMIN,
  createKnowledgeHarness,
  type KnowledgeHarness,
} from './harness.js';

const project = { scope: 'project', scopeId: 'p1' } as const;

const fixture = (name: string, as = name) =>
  new File(
    [readFileSync(path.resolve(import.meta.dirname, 'fixtures', name))],
    as,
  );

describe('cleaning up uploads', () => {
  let h: KnowledgeHarness;
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('lead', ADMIN);
    h.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
  });
  afterEach(async () => {
    await h?.close();
  });

  it('deletes expired tickets and unused files past the grace period', async () => {
    const { files, proposals } = h.knowledge;
    const conn = () => h.database.connection();
    const kept = await files.upload(
      h.user('lead'),
      project,
      fixture('sample.txt', 'kept.txt'),
    );
    const pending = await proposals.proposeFile(
      h.user('member'),
      { kind: 'create', space: project, reason: 'Pending.' },
      fixture('sample.txt', 'pending.txt'),
    );
    const abandoned = await proposals.proposeFile(
      h.user('member'),
      { kind: 'create', space: project, reason: 'Lost.' },
      fixture('sample.txt', 'lost.txt'),
    );
    // A rejection whose file deletion never ran (a crash between the two).
    await proposalsRepo(conn()).updateMany({
      filter: { id: abandoned.id },
      values: { status: 'rejected' },
    });
    await proposals.ticket(h.agent('member', 'a1'), {
      kind: 'create',
      space: project,
      reason: 'Later.',
      filename: 'later.md',
    });
    // The file plugin stamps files with the real time; put them at the test clock's.
    await filesRepo(conn()).updateMany({
      filter: (f) => f.string('id').notEmpty(),
      values: { createdAt: '2026-10-02T08:00:00.000Z' },
    });
    const stored = await filesRepo(conn()).findMany({});
    expect(stored).toHaveLength(3);
    const lost = stored.find((file) => file.filename === 'lost.txt')!;
    const onDisk = (key: string) => existsSync(path.join(h.storage, key));
    expect(onDisk(lost.key)).toBe(true);

    // Young files stay; the ticket has not expired yet.
    expect(await h.knowledge.cleanup()).toEqual({ tickets: 0, files: 0 });

    h.advance(CLEANUP_GRACE_MS + 1000);
    expect(await h.knowledge.cleanup()).toEqual({ tickets: 1, files: 1 });
    expect(await ticketsRepo(conn()).findMany({})).toEqual([]);
    expect(
      (await filesRepo(conn()).findMany({}))
        .map((file) => file.filename)
        .sort(),
    ).toEqual(['kept.txt', 'pending.txt']);
    expect(onDisk(lost.key)).toBe(false);
    expect(pending.status).toBe('pending');
    expect(kept.kind).toBe('file');
    expect(await h.knowledge.cleanup()).toEqual({ tickets: 0, files: 0 });
  });
});
