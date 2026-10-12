// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import type { DatabaseConnection } from '@nocobase/db';
import {
  groupsRepo,
  violatesUnique,
} from '../server/services/proposal-groups.js';
import {
  filesRepo,
  spacesRepo,
  proposalsRepo,
  versionsRepo,
} from '../server/services/store.js';
import {
  ADMIN,
  createKnowledgeHarness,
  type KnowledgeHarness,
  type HarnessOptions,
} from './harness.js';

let h: KnowledgeHarness | undefined;
afterEach(async () => {
  await h?.close();
  h = undefined;
});
const space = { scope: 'project', scopeId: 'p1' } as const;
const source = { kind: 'issue', id: 'synthetic' };
async function setup(options: HarnessOptions = {}) {
  const k = (h = await createKnowledgeHarness(options));
  k.projects.set('p1', { id: 'p1', name: 'Synthetic', leadUserId: 'lead' });
  return k;
}
async function legacy(
  kind: 'update' | 'create' = 'update',
  options: HarnessOptions = {},
) {
  const k = await setup(options);
  const doc = await k.knowledge.docs.create(k.user('lead'), {
    ...space,
    title: 'Base',
    content: 'Base',
  });
  const first = await k.knowledge.proposals.propose(
    k.agent('member', 'a1', 'r1'),
    {
      kind,
      ...(kind === 'update'
        ? { docId: doc.id }
        : { space, slug: 'historical', title: 'Historical' }),
      content: 'First',
      reason: 'Test',
      source,
    },
  );
  const repo = proposalsRepo(k.database.connection());
  const original = (await repo.findOne({ filter: { id: first.id } }))!;
  await repo.updateMany({
    filter: { id: first.id },
    values: { legacyDuplicate: true },
  });
  for (const [i, id] of ['legacy-2', 'legacy-3'].entries())
    await repo.createOne({
      values: {
        ...original,
        id,
        openKey: id,
        legacyDuplicate: true,
        content: `Waiting ${i}`,
        createdAt: new Date(Date.now() + 1000 + i).toISOString(),
      },
    });
  return { k, doc, first, repo, key: original.groupKey };
}
async function invariant(
  k: KnowledgeHarness,
  key: string,
  active: string | null,
) {
  expect(
    await groupsRepo(k.database.connection()).findOne({
      filter: { groupKey: key },
    }),
  ).toMatchObject({ activeProposalId: active });
  const rows = await proposalsRepo(k.database.connection()).findMany({
    filter: { groupKey: key },
  });
  for (const row of rows)
    expect(row.openKey).toBe(row.id === active ? key : row.id);
}

it('retains three historical items, guards waiting actions, and atomically hands off without waking an agent', async () => {
  const { k, first, repo, key } = await legacy();
  const p = k.knowledge.proposals;
  expect(await p.get(k.user('lead'), 'legacy-2')).toMatchObject({
    coordination: 'waiting',
    canReject: true,
    canAccept: false,
    canRequestChanges: false,
  });
  for (const operation of [
    () => p.accept(k.user('lead'), 'legacy-2'),
    () => p.requestChanges(k.user('lead'), 'legacy-2', { comment: 'Fix' }),
  ])
    await expect(operation()).rejects.toMatchObject({
      status: 409,
      code: 'KNOWLEDGE_PROPOSAL_WAITING',
    });
  await p.requestChanges(k.user('lead'), first.id, { comment: 'Fix' });
  await expect(
    p.requestChanges(k.user('lead'), first.id, { comment: 'Again' }),
  ).rejects.toMatchObject({ status: 409 });
  expect(
    k.events.filter((e) => e.type === 'proposal.changesRequested'),
  ).toHaveLength(1);
  await p.withdraw(k.agent('member', 'a1'), first.id);
  await invariant(k, key, 'legacy-2');
  expect(await repo.findOne({ filter: { id: 'legacy-2' } })).toMatchObject({
    status: 'pending',
    decidedById: null,
    comment: null,
  });
  await p.reject(k.user('lead'), 'legacy-3');
  await invariant(k, key, 'legacy-2');
  await p.reject(k.user('lead'), 'legacy-2');
  await invariant(k, key, null);
  expect(
    k.events.filter((e) => e.type === 'proposal.changesRequested'),
  ).toHaveLength(1);
});

it('keeps a legal revision in the active slot ahead of waiting items', async () => {
  const { k, doc, first, key } = await legacy();
  const p = k.knowledge.proposals;
  await p.requestChanges(k.user('lead'), first.id, { comment: 'Fix' });
  const next = await p.propose(k.agent('member', 'a1', 'r2'), {
    kind: 'update',
    docId: doc.id,
    content: 'Revised',
    reason: 'Test',
    source,
    replacesId: first.id,
  });
  expect(next.replaces?.proposalId).toBe(first.id);
  await invariant(k, key, next.id);
  await p.accept(k.user('lead'), next.id);
  await invariant(k, key, 'legacy-2');
  await expect(p.accept(k.user('lead'), 'legacy-2')).rejects.toMatchObject({
    code: 'KNOWLEDGE_PROPOSAL_STALE',
  });
  await p.accept(k.user('lead'), 'legacy-2', { confirmStale: true });
  await invariant(k, key, 'legacy-3');
});

it('blocks historical create duplicates after acceptance without renaming or converting them', async () => {
  const { k, first, key } = await legacy('create');
  const p = k.knowledge.proposals;
  await p.accept(k.user('lead'), first.id);
  await invariant(k, key, 'legacy-2');
  expect(await p.get(k.user('lead'), 'legacy-2')).toMatchObject({
    coordination: 'active',
    targetConflict: true,
    canAccept: false,
    canRequestChanges: false,
  });
  await expect(p.accept(k.user('lead'), 'legacy-2')).rejects.toMatchObject({
    code: 'KNOWLEDGE_PROPOSAL_TARGET_EXISTS',
  });
  await expect(
    p.requestChanges(k.user('lead'), 'legacy-2', { comment: 'Fix' }),
  ).rejects.toMatchObject({ code: 'KNOWLEDGE_PROPOSAL_TARGET_EXISTS' });
  await p.reject(k.user('lead'), 'legacy-2');
  await invariant(k, key, 'legacy-3');
});

it('does not allow a new request to jump the historical queue during handoff', async () => {
  const { k, doc, first, key } = await legacy();
  const p = k.knowledge.proposals;
  const results = await Promise.allSettled([
    p.withdraw(k.agent('member', 'a1'), first.id),
    p.propose(k.agent('member', 'a1', 'r2'), {
      kind: 'update',
      docId: doc.id,
      content: 'New',
      reason: 'Test',
      source,
    }),
  ]);
  expect(results[0].status).toBe('fulfilled');
  expect(results[1]).toMatchObject({
    status: 'rejected',
    reason: { status: 409, code: 'KNOWLEDGE_PROPOSAL_PENDING' },
  });
  await invariant(k, key, 'legacy-2');
});

it('retains a waiting historical item’s shared file when the active item is withdrawn and cleanup runs', async () => {
  const k = await setup();
  const p = k.knowledge.proposals;
  const first = await p.proposeFile(
    k.agent('member', 'a1', 'r1'),
    {
      kind: 'create',
      space,
      slug: 'file',
      title: 'File',
      reason: 'Test',
      source,
    },
    new File(['Synthetic'], 'sample.txt', { type: 'text/plain' }),
  );
  const repo = proposalsRepo(k.database.connection());
  const row = (await repo.findOne({ filter: { id: first.id } }))!;
  await repo.createOne({
    values: {
      ...row,
      id: 'waiting-file',
      openKey: 'waiting-file',
      legacyDuplicate: true,
    },
  });
  await p.withdraw(k.agent('member', 'a1'), first.id);
  k.advance(48 * 60 * 60 * 1000);
  await k.knowledge.cleanup();
  expect(
    await filesRepo(k.database.connection()).findOne({
      filter: { id: row.fileId! },
    }),
  ).not.toBeNull();
  const download = await p.file(k.user('lead'), 'waiting-file');
  await download.body.cancel();
  await invariant(k, row.groupKey, 'waiting-file');
});

it.each(['move-first', 'permissions-first'])(
  'authorizes revision history independently after %s and restores access without caching',
  async (order) => {
    const resolved: { readonly kind: string; readonly id: string }[] = [];
    const k = await setup({ onNames: (refs) => resolved.push(...refs) });
    k.levels.set('reviewer', ADMIN);
    const { docs, proposals: p, permissions } = k.knowledge;
    const folder = await docs.create(k.user('lead'), {
      ...space,
      kind: 'folder',
      title: 'Private',
    });
    const input = {
      kind: 'create',
      space,
      parentId: folder.id,
      slug: 'draft',
      title: 'Draft',
      content: 'First',
      reason: 'Test',
      source,
    } as const;
    const first = await p.propose(k.agent('member', 'a1', 'r1'), input);
    await p.requestChanges(k.user('reviewer'), first.id, {
      comment: 'Private feedback',
    });
    const second = await p.propose(k.agent('member', 'a1', 'r2'), {
      ...input,
      content: 'Second',
    });
    const accepted = await p.accept(k.user('lead'), second.id);
    const move = () =>
      docs.move(k.user('lead'), accepted.docId!, { parentId: null });
    const revoke = () =>
      permissions.replace(k.user('lead'), folder.id, {
        mode: 'custom',
        entries: [],
      });
    if (order === 'move-first') {
      await move();
      await revoke();
    } else {
      await revoke();
      await move();
    }
    resolved.length = 0;
    expect(
      (await docs.versions(k.user('outsider'), accepted.docId!))[0].revision,
    ).toBeNull();
    expect(
      (await docs.version(k.user('outsider'), accepted.docId!, 1)).revision,
    ).toBeNull();
    expect((await p.get(k.user('outsider'), second.id)).replaces).toBeNull();
    expect(
      (await p.list(k.user('outsider'), { status: 'accepted' }))[0].replaces,
    ).toBeNull();
    expect(resolved.some((ref) => ref.id === 'reviewer')).toBe(false);
    await expect(
      p.get(
        { userId: 'other', actor: { kind: 'another-kind', id: 'a1' } },
        first.id,
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      (await docs.version(k.user('lead'), accepted.docId!, 1)).revision
        ?.comment,
    ).toBe('Private feedback');
    expect(
      (await docs.version(k.agent('member', 'a1'), accepted.docId!, 1)).revision
        ?.comment,
    ).toBe('Private feedback');
    await permissions.replace(k.user('lead'), folder.id, {
      mode: 'inherit',
      entries: [],
    });
    expect(
      (await docs.version(k.user('outsider'), accepted.docId!, 1)).revision
        ?.comment,
    ).toBe('Private feedback');
    await proposalsRepo(k.database.connection()).deleteMany({
      filter: { id: first.id },
    });
    expect(
      (await docs.version(k.user('outsider'), accepted.docId!, 1)).revision,
    ).toBeNull();
  },
);

it('rolls acceptance and queue handoff back when writing the version fails', async () => {
  let collide: string | null = null;
  const { k, doc, first, key, repo } = await legacy('update', {
    newId: (next) => {
      const id = collide ?? next();
      collide = null;
      return id;
    },
  });
  const before = k.events.length;
  collide = (await versionsRepo(k.database.connection()).findOne({
    filter: { docId: doc.id },
  }))!.id;
  await expect(
    k.knowledge.proposals.accept(k.user('lead'), first.id),
  ).rejects.toThrow();
  await invariant(k, key, first.id);
  expect(await repo.findOne({ filter: { id: first.id } })).toMatchObject({
    status: 'pending',
    decidedById: null,
  });
  expect((await k.knowledge.docs.get(k.user('lead'), doc.id)).version).toBe(1);
  expect(k.events.length).toBe(before);
  await k.knowledge.proposals.accept(k.user('lead'), first.id);
  await invariant(k, key, 'legacy-2');
});

it('classifies exact driver constraints without mistaking INSERT column names for the failed index', () => {
  const classify = (e: unknown) =>
    violatesUnique(e, 'kb_proposals_open_key', 'kb_proposals.open_key');
  expect(classify({ code: '23505', constraint: 'kb_proposals_open_key' })).toBe(
    true,
  );
  expect(
    classify({
      code: '23505',
      constraint: 'kb_proposals_pkey',
      message: 'insert into kb_proposals (open_key)',
    }),
  ).toBe(false);
  expect(
    classify({
      code: 'ER_DUP_ENTRY',
      errno: 1062,
      sqlMessage:
        "Duplicate entry 'x' for key 'kb_proposals.kb_proposals_open_key'",
    }),
  ).toBe(true);
  expect(
    classify({
      code: 'ER_DUP_ENTRY',
      sqlMessage: "Duplicate entry 'x' for key 'PRIMARY'",
      message: 'insert into kb_proposals (open_key)',
    }),
  ).toBe(false);
  expect(
    classify({ code: '23505', constraint: 'some_other_unique_index' }),
  ).toBe(false);
  expect(
    classify({ code: 'ECONNRESET', constraint: 'kb_proposals_open_key' }),
  ).toBe(false);
  expect(
    classify({
      cause: {
        code: 'SQLITE_CONSTRAINT_UNIQUE',
        message: 'UNIQUE constraint failed: kb_proposals.open_key',
      },
    }),
  ).toBe(true);
});

const realDatabase =
  !!process.env.NOCOBASE_TEST_DB_DIALECT &&
  process.env.NOCOBASE_TEST_DB_DIALECT !== 'sqlite';

it('cancels a waiting item before the active item finishes and skips it during handoff', async () => {
  const { k, first, key, repo } = await legacy();
  await k.knowledge.proposals.reject(k.user('lead'), 'legacy-2', {
    comment: 'Explicit decision',
  });
  await invariant(k, key, first.id);
  await k.knowledge.proposals.withdraw(k.agent('member', 'a1'), first.id);
  await invariant(k, key, 'legacy-3');
  expect(await repo.findOne({ filter: { id: 'legacy-2' } })).toMatchObject({
    status: 'rejected',
    comment: 'Explicit decision',
  });
  expect(
    k.events.filter((e) => e.type === 'proposal.changesRequested'),
  ).toHaveLength(0);
});

it('rolls a failed historical replacement back without handing its slot to waiting items', async () => {
  let collide: string | null = null;
  const { k, first, doc, key, repo } = await legacy('update', {
    newId: (next) => {
      const id = collide ?? next();
      collide = null;
      return id;
    },
  });
  const p = k.knowledge.proposals;
  await p.requestChanges(k.user('lead'), first.id, {
    comment: 'Keep this audit',
  });
  const before = k.events.length;
  collide = first.id;
  const input = {
    kind: 'update',
    docId: doc.id,
    content: 'Revised',
    reason: 'Test',
    source,
    replacesId: first.id,
  } as const;
  await expect(
    p.propose(k.agent('member', 'a1', 'r2'), input),
  ).rejects.toThrow();
  await invariant(k, key, first.id);
  expect(await repo.findOne({ filter: { id: first.id } })).toMatchObject({
    status: 'revising',
    comment: 'Keep this audit',
  });
  expect(await repo.findMany({ filter: { groupKey: key } })).toHaveLength(3);
  expect(k.events.length).toBe(before);
  const next = await p.propose(k.agent('member', 'a1', 'r3'), input);
  await invariant(k, key, next.id);
});

it('rolls back first-space allocation on refusal and keeps source-less proposals separate from sourced ones', async () => {
  const k = await setup();
  const p = k.knowledge.proposals;
  const input = {
    kind: 'create',
    space,
    slug: 'first',
    title: 'First',
    content: 'Synthetic',
    reason: 'Test',
  } as const;
  await expect(
    p.propose(k.agent('member', 'a1'), { ...input, replacesId: 'missing' }),
  ).rejects.toMatchObject({ code: 'KNOWLEDGE_PROPOSAL_NOT_REVISING' });
  expect(await spacesRepo(k.database.connection()).findMany({})).toHaveLength(
    0,
  );
  expect(await groupsRepo(k.database.connection()).findMany({})).toHaveLength(
    0,
  );
  expect(
    await proposalsRepo(k.database.connection()).findMany({}),
  ).toHaveLength(0);
  const first = await p.propose(k.agent('member', 'a1'), input);
  await p.requestChanges(k.user('lead'), first.id, { comment: 'Fix' });
  const other = await p.propose(k.agent('member', 'a1'), { ...input, source });
  expect(other.replaces).toBeNull();
  expect((await p.get(k.user('lead'), first.id)).status).toBe('revising');
  expect(await groupsRepo(k.database.connection()).findMany({})).toHaveLength(
    2,
  );
});
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

/** Pause at the actual group write, without allowing either transaction past the lock into a stale empty precheck. */
function observeGroupWrites(
  k: KnowledgeHarness,
  method: 'updateMany' | 'createOne',
  observe: (perform: () => Promise<unknown>) => Promise<unknown>,
) {
  const original = k.database.transaction;
  k.database.transaction = function (
    callback: (conn: DatabaseConnection) => Promise<unknown>,
  ) {
    return original.call(this, async (conn) =>
      callback(
        new Proxy(conn, {
          get(target, property) {
            if (property === 'repository')
              return (...args: unknown[]) => {
                const repo = Reflect.apply(target.repository, target, args);
                if (args[0] !== 'kbProposalGroups') return repo;
                return new Proxy(repo, {
                  get(record, name) {
                    const value = Reflect.get(record, name);
                    if (name === method)
                      return (...input: unknown[]) =>
                        observe(() => Reflect.apply(value, record, input));
                    return typeof value === 'function'
                      ? value.bind(record)
                      : value;
                  },
                });
              };
            const value = Reflect.get(target, property);
            return typeof value === 'function' ? value.bind(target) : value;
          },
        }),
      ),
    );
  } as typeof original;
  return () => {
    k.database.transaction = original;
  };
}

it.skipIf(!realDatabase)(
  'holds the real database group lock while a competing request waits, including both mixed orders',
  async () => {
    const k = await setup();
    const { docs, proposals: p } = k.knowledge;
    for (const order of ['two-requests', 'request-first', 'propose-first']) {
      const doc = await docs.create(k.user('lead'), {
        ...space,
        title: order,
        content: 'Base',
      });
      const learned = await p.propose(k.agent('member', 'a1', order), {
        kind: 'update',
        docId: doc.id,
        content: 'Learned',
        reason: 'Test',
        source,
      });
      await p.accept(k.user('lead'), learned.id);
      const held = deferred(),
        entered = deferred(),
        release = deferred();
      let calls = 0,
        secondAcquired = false;
      const restore = observeGroupWrites(k, 'updateMany', async (perform) => {
        const call = ++calls;
        if (call === 2) entered.resolve();
        const result = await perform();
        if (call === 1) {
          held.resolve();
          await release.promise;
        }
        if (call === 2) secondAcquired = true;
        return result;
      });
      const request = () =>
        p.requestDocChanges(k.user('lead'), doc.id, { comment: 'Fix' });
      const propose = () =>
        p.propose(k.agent('member', 'a1', `next-${order}`), {
          kind: 'update',
          docId: doc.id,
          content: 'Revised',
          reason: 'Test',
          source,
        });
      try {
        const first = order === 'propose-first' ? propose() : request();
        await held.promise;
        const second = order === 'request-first' ? propose() : request();
        // Attach rejection handlers immediately while waiting for the lock observation.
        const outcomes = Promise.allSettled([first, second]);
        await entered.promise;
        await new Promise((done) => setTimeout(done, 100));
        expect(secondAcquired).toBe(false);
        release.resolve();
        const results = await outcomes;
        expect(results[0].status).toBe('fulfilled');
        expect(secondAcquired).toBe(true);
        if (order === 'request-first')
          expect(results[1].status).toBe('fulfilled');
        else
          expect(results[1]).toMatchObject({
            status: 'rejected',
            reason: { status: 409, code: 'KNOWLEDGE_PROPOSAL_PENDING' },
          });
        const rows = await proposalsRepo(k.database.connection()).findMany({
          filter: { docId: doc.id },
        });
        expect(
          rows.filter(
            (row) => row.status === 'pending' || row.status === 'revising',
          ),
        ).toHaveLength(1);
        expect(
          k.events.filter(
            (e) =>
              e.type === 'proposal.changesRequested' && e.doc?.id === doc.id,
          ),
        ).toHaveLength(order === 'propose-first' ? 0 : 1);
      } finally {
        release.resolve();
        restore();
      }
    }
  },
  60000,
);

it.skipIf(!realDatabase)(
  'races first group creation using two real transactions and retries only in a new transaction',
  async () => {
    const k = await setup();
    const doc = await k.knowledge.docs.create(k.user('lead'), {
      ...space,
      title: 'First group',
      content: 'Base',
    });
    await versionsRepo(k.database.connection()).updateMany({
      filter: { docId: doc.id },
      values: {
        authorKind: 'agent',
        authorId: 'a1',
        sourceKind: source.kind,
        sourceId: source.id,
      },
    });
    const both = deferred();
    let arrived = 0;
    const restore = observeGroupWrites(k, 'createOne', async (perform) => {
      if (++arrived === 2) both.resolve();
      await both.promise;
      return perform();
    });
    try {
      const results = await Promise.allSettled(
        [1, 2].map((i) =>
          k.knowledge.proposals.requestDocChanges(k.user('lead'), doc.id, {
            comment: `Fix ${i}`,
          }),
        ),
      );
      expect(arrived).toBe(2);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(results.find((r) => r.status === 'rejected')).toMatchObject({
        reason: { status: 409, code: 'KNOWLEDGE_PROPOSAL_PENDING' },
      });
      expect(
        k.events.filter((e) => e.type === 'proposal.changesRequested'),
      ).toHaveLength(1);
    } finally {
      both.resolve();
      restore();
    }
  },
  60000,
);
