// @vitest-environment node
/**
 * What sending back must not do: show a proposal's content, comment or people to someone who may not read it, replace
 * one beyond the target its revision is for, or leave two open proposals for one target and source when requests race.
 * The database holds the last of these (`openKey`, unique); the races here run on whichever dialect the tests select.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { openKeyOf } from '../server/services/proposals.js';
import {
  proposalsRepo,
  type ProposalRecord,
} from '../server/services/store.js';
import {
  ADMIN,
  createKnowledgeHarness,
  type HarnessOptions,
  type KnowledgeHarness,
} from './harness.js';

const project = { scope: 'project', scopeId: 'p1' } as const;
const issue = { kind: 'issue', id: 'i1', title: 'PM-54 Plugin pages' };

let h: KnowledgeHarness | undefined;
afterEach(async () => {
  await h?.close();
  h = undefined;
});

async function harness(options: HarnessOptions = {}) {
  h = await createKnowledgeHarness(options);
  h.levels.set('admin', ADMIN);
  h.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
  return h;
}

const rows = (k: KnowledgeHarness) =>
  proposalsRepo(k.database.connection()).findMany({});

const changesRequested = (k: KnowledgeHarness, docId: string) =>
  k.events.filter(
    (event) =>
      event.type === 'proposal.changesRequested' && event.doc?.id === docId,
  );

/** A document whose current version agent-1 wrote from the issue. */
async function agentDoc(k: KnowledgeHarness, slug: string): Promise<string> {
  const { docs, proposals } = k.knowledge;
  const docId = (
    await docs.create(k.user('lead'), {
      ...project,
      title: slug,
      slug,
      content: '# Draft',
    })
  ).id;
  const learned = await proposals.propose(
    k.agent('member', 'agent-1', `run-${slug}`),
    {
      kind: 'update',
      docId,
      content: `# ${slug}\n\nLearned.`,
      reason: 'Learned.',
      source: issue,
    },
  );
  await proposals.accept(k.user('lead'), learned.id);
  return docId;
}

/** Writes a row the services would not, for the races the checks before a write cannot see. */
async function insertRow(
  k: KnowledgeHarness,
  values: Partial<ProposalRecord> &
    Pick<ProposalRecord, 'id' | 'spaceId' | 'openKey'>,
) {
  const now = new Date().toISOString();
  await proposalsRepo(k.database.connection()).createOne({
    values: {
      docId: null,
      kind: 'update',
      parentId: null,
      slug: null,
      title: null,
      summary: null,
      content: 'Raced.',
      contentHash: null,
      fileId: null,
      baseVersion: null,
      reason: 'Raced.',
      proposerKind: 'agent',
      proposerId: 'agent-9',
      authorizedById: 'admin',
      sourceKind: null,
      sourceId: null,
      sourceTitle: null,
      sourceUrl: null,
      runId: null,
      status: 'pending',
      decidedById: null,
      decidedAt: null,
      comment: null,
      appliedVersion: null,
      replacesId: null,
      origin: null,
      createdAt: now,
      updatedAt: now,
      ...values,
    },
  });
}

describe('what a proposal shows of another', () => {
  it('does not replace, nor show, one sent back under a parent the proposer may not reach', async () => {
    const k = await harness();
    const { docs, proposals, permissions } = k.knowledge;
    const folder = await docs.create(k.user('lead'), {
      ...project,
      kind: 'folder',
      title: 'Private',
    });
    const first = await proposals.propose(k.agent('member', 'a1', 'r1'), {
      kind: 'create',
      ...{ space: project },
      parentId: folder.id,
      slug: 'draft',
      title: 'Draft',
      content: 'PRIVATE_SYNTHETIC_CONTENT',
      reason: 'Test',
      source: issue,
    });
    await proposals.requestChanges(k.user('lead'), first.id, {
      comment: 'PRIVATE_SYNTHETIC_COMMENT',
    });
    await permissions.replace(k.user('lead'), folder.id, {
      mode: 'custom',
      entries: [],
    });
    await expect(
      proposals.get(k.user('outsider'), first.id),
    ).rejects.toMatchObject({ status: 404 });

    // The same slug from the same source at the root is a proposal of its own: nothing replaced, nothing shown.
    const separate = await proposals.propose(k.agent('outsider', 'a2', 'r2'), {
      kind: 'create',
      space: project,
      slug: 'draft',
      title: 'Draft',
      content: 'Public replacement',
      reason: 'Test',
      source: issue,
    });
    const seen = await proposals.get(k.user('outsider'), separate.id);
    expect(seen).toMatchObject({ replaces: null, replacedContent: null });
    expect(JSON.stringify(seen)).not.toContain('PRIVATE_SYNTHETIC');
    expect(
      JSON.stringify(
        await proposals.list(k.user('outsider'), { status: 'pending' }),
      ),
    ).not.toContain('PRIVATE_SYNTHETIC');
    expect(await proposals.get(k.user('lead'), first.id)).toMatchObject({
      status: 'revising',
      content: 'PRIVATE_SYNTHETIC_CONTENT',
      comment: 'PRIVATE_SYNTHETIC_COMMENT',
      supersededById: null,
    });

    // Naming it is refused exactly as naming nothing is, and changes nothing.
    const named = await proposals
      .propose(k.agent('outsider', 'a2', 'r3'), {
        kind: 'create',
        space: project,
        slug: 'draft-2',
        title: 'Draft',
        content: 'Claim',
        reason: 'Test',
        source: issue,
        replacesId: first.id,
      })
      .catch((error: unknown) => error);
    const nothing = await proposals
      .propose(k.agent('outsider', 'a2', 'r4'), {
        kind: 'create',
        space: project,
        slug: 'draft-3',
        title: 'Draft',
        content: 'Claim',
        reason: 'Test',
        source: issue,
        replacesId: 'no-such-proposal',
      })
      .catch((error: unknown) => error);
    for (const refused of [named, nothing])
      expect(refused).toMatchObject({
        status: 409,
        code: 'KNOWLEDGE_PROPOSAL_NOT_REVISING',
        message:
          'replacesId names no proposal from this source sent back for changes to this document.',
        details: undefined,
      });
    expect(await proposals.get(k.user('lead'), first.id)).toMatchObject({
      status: 'revising',
    });
  });

  it('refuses a revision naming one sent back for another parent, even with access to both', async () => {
    const k = await harness();
    const { docs, proposals } = k.knowledge;
    const [left, right] = await Promise.all(
      ['Left', 'Right'].map((title) =>
        docs.create(k.user('lead'), { ...project, kind: 'folder', title }),
      ),
    );
    const first = await proposals.propose(k.agent('member', 'a1', 'r1'), {
      kind: 'create',
      space: project,
      parentId: left.id,
      slug: 'draft',
      title: 'Draft',
      content: 'Left',
      reason: 'Test',
      source: issue,
    });
    await proposals.requestChanges(k.user('lead'), first.id, {
      comment: 'Move it.',
    });
    await expect(
      proposals.propose(k.agent('member', 'a1', 'r2'), {
        kind: 'create',
        space: project,
        parentId: right.id,
        slug: 'draft',
        title: 'Draft',
        content: 'Right',
        reason: 'Test',
        source: issue,
        replacesId: first.id,
      }),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_PROPOSAL_NOT_REVISING' });
    expect(await proposals.get(k.user('lead'), first.id)).toMatchObject({
      status: 'revising',
    });
  });

  it('stops showing what a revision replaced once its reader may no longer read it', async () => {
    const k = await harness();
    const { docs, proposals, permissions } = k.knowledge;
    const folder = await docs.create(k.user('lead'), {
      ...project,
      kind: 'folder',
      title: 'Runbooks',
    });
    const create = {
      kind: 'create',
      space: project,
      parentId: folder.id,
      slug: 'deploy',
      title: 'Deploy',
      reason: 'Test',
      source: issue,
    } as const;
    const first = await proposals.propose(k.agent('member', 'a1', 'r1'), {
      ...create,
      content: 'FIRST_CONTENT',
    });
    await proposals.requestChanges(k.user('lead'), first.id, {
      comment: 'FIRST_COMMENT',
    });
    // The revision is made for someone else, from the same issue.
    const revision = await proposals.propose(k.agent('member2', 'a1', 'r2'), {
      ...create,
      content: 'Second',
    });
    expect(await proposals.get(k.user('member2'), revision.id)).toMatchObject({
      replaces: { proposalId: first.id, comment: 'FIRST_COMMENT' },
      replacedContent: 'FIRST_CONTENT',
    });

    await permissions.replace(k.user('lead'), folder.id, {
      mode: 'custom',
      entries: [],
    });
    // Still theirs to see, but not the one before it, which was not.
    const now = await proposals.get(k.user('member2'), revision.id);
    expect(now).toMatchObject({ replaces: null, replacedContent: null });
    expect(JSON.stringify(now)).not.toMatch(/FIRST_(CONTENT|COMMENT)/);
    const listed = await proposals.list(k.user('member2'), {
      status: 'pending',
    });
    expect(listed.map((item) => item.id)).toEqual([revision.id]);
    expect(JSON.stringify(listed)).not.toMatch(/FIRST_(CONTENT|COMMENT)/);
    await expect(
      proposals.get(k.user('member2'), first.id),
    ).rejects.toMatchObject({ status: 404 });
    // Whoever still reads both sees both.
    expect(await proposals.get(k.user('lead'), revision.id)).toMatchObject({
      replaces: { proposalId: first.id, comment: 'FIRST_COMMENT' },
      replacedContent: 'FIRST_CONTENT',
    });
    expect(await proposals.get(k.user('lead'), first.id)).toMatchObject({
      supersededById: revision.id,
    });
  });

  it('names the proposal holding the key only to whoever may read it', async () => {
    const k = await harness();
    const { proposals } = k.knowledge;
    const docId = await agentDoc(k, 'hidden-holder');
    const spaceId = (await rows(k)).find((row) => row.docId === docId)!.spaceId;
    // A row nobody reads (its space is gone) holds the key the member's proposal would take.
    await insertRow(k, {
      id: 'held',
      spaceId: 'gone',
      openKey: openKeyOf({
        docId,
        spaceId,
        parentId: null,
        slug: null,
        sourceKind: 'issue',
        sourceId: 'i1',
        proposerKind: 'agent',
        proposerId: 'agent-1',
      }),
    });
    const refused = await proposals
      .propose(k.agent('member', 'agent-1', 'run-x'), {
        kind: 'update',
        docId,
        content: 'Again.',
        reason: 'Again.',
        source: issue,
      })
      .catch((error: unknown) => error);
    expect(refused).toMatchObject({
      status: 409,
      code: 'KNOWLEDGE_PROPOSAL_PENDING',
      details: undefined,
    });
  });
});

describe('one open proposal per target and source', () => {
  it('is kept by the database, whatever writes the row', async () => {
    const k = await harness();
    const key = `open:${'0'.repeat(64)}`;
    await insertRow(k, { id: 'r1', spaceId: 's', openKey: key });
    await expect(
      insertRow(k, { id: 'r2', spaceId: 's', openKey: key }),
    ).rejects.toThrow();
    expect((await rows(k)).map((row) => row.id)).toEqual(['r1']);
  });

  it('sends a document back once when two people send it at once', async () => {
    const k = await harness();
    const { proposals } = k.knowledge;
    for (let round = 0; round < 20; round += 1) {
      const docId = await agentDoc(k, `doc-${round}`);
      const results = await Promise.allSettled(
        ['lead', 'admin'].map((who) =>
          proposals.requestDocChanges(k.user(who), docId, {
            comment: `Fix it (${who}).`,
          }),
        ),
      );
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const [failure] = results.filter((r) => r.status === 'rejected');
      expect(failure.reason).toMatchObject({
        status: 409,
        code: 'KNOWLEDGE_PROPOSAL_PENDING',
      });
      const open = (await rows(k)).filter(
        (row) => row.docId === docId && row.status === 'revising',
      );
      expect(open).toHaveLength(1);
      expect(open[0].openKey).toMatch(/^open:[0-9a-f]{64}$/);
      expect(changesRequested(k, docId)).toHaveLength(1);
    }
  });

  it('settles a document sent back while its agent proposes, by whichever wins', async () => {
    const k = await harness();
    const { proposals } = k.knowledge;
    const outcomes = new Set<string>();
    for (let round = 0; round < 20; round += 1) {
      const docId = await agentDoc(k, `mixed-${round}`);
      const sendBack = () =>
        proposals.requestDocChanges(k.user('lead'), docId, {
          comment: 'Fix it.',
        });
      const propose = () =>
        proposals.propose(k.agent('member', 'agent-1', `run-m${round}`), {
          kind: 'update',
          docId,
          content: `# Revised ${round}`,
          reason: 'Again.',
          source: issue,
        });
      // Each order first, then both at once.
      const calls =
        round === 0
          ? [await settle(sendBack()), await settle(propose())]
          : round === 1
            ? [await settle(propose()), await settle(sendBack())].reverse()
            : round % 2
              ? await Promise.allSettled([sendBack(), propose()])
              : (await Promise.allSettled([propose(), sendBack()])).reverse();
      const [sent, proposed] = calls;
      const all = (await rows(k)).filter((row) => row.docId === docId);
      const open = all.filter(
        (row) => row.status === 'pending' || row.status === 'revising',
      );
      // Never two open, and the key of every closed one is its own id.
      expect(open).toHaveLength(1);
      for (const row of all)
        if (!open.includes(row)) expect(row.openKey).toBe(row.id);
      const sentBack = all.filter((row) => row.origin === 'document');
      if (sent.status === 'fulfilled') {
        // Sent back first: one event, and the proposal, if it got through, replaced it.
        expect(sentBack).toHaveLength(1);
        expect(changesRequested(k, docId)).toHaveLength(1);
        if (proposed.status === 'fulfilled') {
          expect(sentBack[0].status).toBe('superseded');
          expect(open[0]).toMatchObject({
            status: 'pending',
            replacesId: sentBack[0].id,
          });
          outcomes.add('sent back, then replaced');
        } else {
          expect(proposed.reason).toMatchObject({ status: 409 });
          expect(open[0].id).toBe(sentBack[0].id);
          outcomes.add('sent back, proposal refused');
        }
      } else {
        // Proposed first: pending, nothing sent back, no event.
        expect(sent.reason).toMatchObject({
          status: 409,
          code: 'KNOWLEDGE_PROPOSAL_PENDING',
        });
        expect(proposed.status).toBe('fulfilled');
        expect(sentBack).toHaveLength(0);
        expect(open[0]).toMatchObject({ status: 'pending', replacesId: null });
        expect(changesRequested(k, docId)).toHaveLength(0);
        outcomes.add('proposed, sending back refused');
      }
    }
    expect(outcomes).toContain('sent back, then replaced');
    expect(outcomes).toContain('proposed, sending back refused');
  });

  it('refuses a write that loses the race at the index, leaving nothing of it', async () => {
    const k = await harness();
    const { proposals } = k.knowledge;
    const docId = await agentDoc(k, 'raced');
    const spaceId = (await rows(k)).find((row) => row.docId === docId)!.spaceId;
    // Another request's proposal the checks before the write cannot see (it names no document) holds the key.
    await insertRow(k, {
      id: 'raced-holder',
      spaceId,
      authorizedById: 'lead',
      openKey: openKeyOf({
        docId,
        spaceId,
        parentId: null,
        slug: null,
        sourceKind: 'issue',
        sourceId: 'i1',
        proposerKind: 'agent',
        proposerId: 'agent-1',
      }),
    });
    const before = (await rows(k)).length;
    const events = k.events.length;
    await expect(
      proposals.requestDocChanges(k.user('lead'), docId, { comment: 'Fix.' }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'KNOWLEDGE_PROPOSAL_PENDING',
      details: { proposalId: 'raced-holder' },
    });
    await expect(
      proposals.propose(k.agent('member', 'agent-1', 'run-r'), {
        kind: 'update',
        docId,
        content: 'Raced.',
        reason: 'Raced.',
        source: issue,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'KNOWLEDGE_PROPOSAL_PENDING',
    });
    expect((await rows(k)).length).toBe(before);
    expect(k.events.length).toBe(events);
  });

  it('rolls a replacement back when its revision is not written, and passes on what failed', async () => {
    let collide: string | null = null;
    const k = await harness({
      newId: (next) => {
        const id = collide ?? next();
        collide = null;
        return id;
      },
    });
    const { proposals } = k.knowledge;
    const docId = await agentDoc(k, 'rollback');
    const sent = await proposals.requestDocChanges(k.user('lead'), docId, {
      comment: 'Fix.',
    });
    const events = k.events.length;
    // The revision's id is taken: an unrelated unique violation, not a proposal from the same source.
    collide = sent.id;
    const failure = await proposals
      .propose(k.agent('member', 'agent-1', 'run-r'), {
        kind: 'update',
        docId,
        content: 'Revised.',
        reason: 'Revised.',
        source: issue,
      })
      .catch((error: unknown) => error);
    expect(failure).not.toMatchObject({ code: 'KNOWLEDGE_PROPOSAL_PENDING' });
    expect(failure).not.toMatchObject({ status: 409 });
    expect(k.events.length).toBe(events);
    const after = (await rows(k)).find((row) => row.id === sent.id)!;
    expect(after).toMatchObject({ status: 'revising' });
    expect(after.openKey).toMatch(/^open:/);

    // Written this time, it replaces the one sent back.
    const revision = await proposals.propose(
      k.agent('member', 'agent-1', 'run-r2'),
      {
        kind: 'update',
        docId,
        content: 'Revised.',
        reason: 'Revised.',
        source: issue,
      },
    );
    expect(revision.replaces?.proposalId).toBe(sent.id);
  });

  it('lets go of the key once a proposal is closed, however it closes', async () => {
    const k = await harness();
    const { proposals } = k.knowledge;
    const docId = await agentDoc(k, 'released');
    const agent = (run: string) => k.agent('member', 'agent-1', run);
    const next = (run: string, content: string) =>
      proposals.propose(agent(run), {
        kind: 'update',
        docId,
        content,
        reason: 'Again.',
        source: issue,
      });
    const keyOf = async (id: string) =>
      (await rows(k)).find((row) => row.id === id)!.openKey;

    const rejected = await next('r1', 'One');
    await proposals.reject(k.user('lead'), rejected.id);
    expect(await keyOf(rejected.id)).toBe(rejected.id);

    const withdrawn = await next('r2', 'Two');
    await proposals.withdraw(agent('r2'), withdrawn.id);
    expect(await keyOf(withdrawn.id)).toBe(withdrawn.id);

    const sentBack = await proposals.requestDocChanges(k.user('lead'), docId, {
      comment: 'Fix.',
    });
    const revision = await next('r3', 'Three');
    expect(await keyOf(sentBack.id)).toBe(sentBack.id);
    const open = await keyOf(revision.id);
    expect(open).toMatch(/^open:/);

    await proposals.accept(k.user('lead'), revision.id);
    expect(await keyOf(revision.id)).toBe(revision.id);
    expect((await next('r4', 'Four')).status).toBe('pending');
  });
});

async function settle<T>(
  promise: Promise<T>,
): Promise<PromiseSettledResult<T>> {
  try {
    return { status: 'fulfilled', value: await promise };
  } catch (reason) {
    return { status: 'rejected', reason };
  }
}
