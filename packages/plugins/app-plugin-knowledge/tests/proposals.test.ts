// @vitest-environment node
/** Knowledge proposals: who proposes and decides, the rules a proposal must pass, stale proposals and their two diffs. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  ADMIN,
  READER,
  createKnowledgeHarness,
  type KnowledgeHarness,
} from './harness.js';

const project = { scope: 'project', scopeId: 'p1' } as const;
const issue = { kind: 'issue', id: 'i1', title: 'PM-1 Faster lists' };

describe('knowledge proposals', () => {
  let h: KnowledgeHarness;
  let docId: string;
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('admin', ADMIN);
    h.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
    docId = (
      await h.knowledge.docs.create(h.user('lead'), {
        ...project,
        title: 'Pitfalls',
        slug: 'pitfalls',
        content: '# Pitfalls\n\nNone yet.',
      })
    ).id;
  });
  afterEach(async () => {
    await h?.close();
  });

  it('turns an accepted update into the next version, authored by the agent with its run', async () => {
    const { proposals, docs } = h.knowledge;
    const agent = h.agent('member', 'agent-1', 'run-1');
    const proposal = await proposals.propose(agent, {
      kind: 'update',
      docId,
      content: '# Pitfalls\n\nSQLite holds one connection.',
      reason: 'Found while fixing PM-1.',
      source: issue,
    });
    expect(proposal).toMatchObject({
      kind: 'update',
      status: 'pending',
      baseVersion: 1,
      currentVersion: 1,
      stale: false,
      proposer: { kind: 'agent', id: 'agent-1' },
      authorizedBy: { kind: 'user', id: 'member' },
      source: { kind: 'issue', id: 'i1' },
      canDecide: false,
    });
    const created = h.events.find((event) => event.type === 'proposal.created');
    expect(created).toMatchObject({ space: project });

    // The member who woke the agent cannot decide; the lead can.
    await expect(
      proposals.accept(h.user('member'), proposal.id),
    ).rejects.toMatchObject({
      status: 403,
    });
    expect(
      (
        await proposals.list(h.user('lead'), {
          space: project,
          decidable: true,
        })
      ).map((item) => [item.id, item.canDecide]),
    ).toEqual([[proposal.id, true]]);
    const accepted = await proposals.accept(h.user('lead'), proposal.id, {
      comment: 'Thanks.',
    });
    expect(accepted).toMatchObject({
      status: 'accepted',
      appliedVersion: 2,
      decidedBy: { id: 'lead' },
      comment: 'Thanks.',
    });
    const versions = await docs.versions(h.user('lead'), docId);
    expect(versions[0]).toMatchObject({
      version: 2,
      author: { kind: 'agent', id: 'agent-1' },
      source: { kind: 'issue', id: 'i1' },
      runId: 'run-1',
      proposalId: proposal.id,
      approvedBy: { id: 'lead' },
      note: 'Thanks.',
    });
    await expect(
      proposals.reject(h.user('lead'), proposal.id),
    ).rejects.toMatchObject({
      code: 'KNOWLEDGE_PROPOSAL_DECIDED',
    });
    expect(h.events.at(-1)).toMatchObject({
      type: 'proposal.decided',
      decision: 'accepted',
      byUserId: 'lead',
    });
  });

  it('keeps one pending proposal per source and document, three per run, and refuses rejected content again', async () => {
    const { proposals, docs } = h.knowledge;
    const agent = h.agent('member', 'agent-1', 'run-1');
    const first = await proposals.propose(agent, {
      kind: 'update',
      docId,
      content: 'Version A',
      reason: 'A.',
      source: issue,
    });
    await expect(
      proposals.propose(agent, {
        kind: 'update',
        docId,
        content: 'Version B',
        reason: 'B.',
        source: issue,
      }),
    ).rejects.toMatchObject({
      code: 'KNOWLEDGE_PROPOSAL_PENDING',
      details: { proposalId: first.id },
    });
    // Another source may propose for the same document.
    const elsewhere = await proposals.propose(
      h.agent('member', 'agent-2', 'run-2'),
      {
        kind: 'update',
        docId,
        content: 'Version C',
        reason: 'C.',
        source: { kind: 'issue', id: 'i2' },
      },
    );
    await proposals.reject(h.user('lead'), first.id, { comment: 'Not true.' });
    await expect(
      proposals.propose(agent, {
        kind: 'update',
        docId,
        content: 'Version A',
        reason: 'A again.',
        source: issue,
      }),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_PROPOSAL_REJECTED' });
    await proposals.propose(agent, {
      kind: 'create',
      title: 'Setup',
      content: '# Setup',
      reason: 'Missing.',
      source: issue,
      primary: project,
    });
    await proposals.propose(agent, {
      kind: 'create',
      title: 'Release',
      content: '# Release',
      reason: 'Missing too.',
      source: issue,
      primary: project,
    });
    // The run has made three (the refused one does not count): a fourth is refused whatever it is.
    await expect(
      proposals.propose(agent, {
        kind: 'verify',
        docId: (
          await docs.create(h.user('lead'), {
            ...project,
            title: 'Other',
            content: 'x',
          })
        ).id,
        reason: 'Checked.',
        source: issue,
      }),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_PROPOSAL_LIMIT' });
    // Withdrawn by the person it was made for.
    expect(
      (await proposals.withdraw(h.user('member'), elsewhere.id)).status,
    ).toBe('withdrawn');
    await expect(
      proposals.withdraw(h.user('lead'), elsewhere.id),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it('shows a stale proposal with both diffs and accepts it anyway only when confirmed', async () => {
    const { proposals, docs } = h.knowledge;
    const proposal = await proposals.propose(
      h.agent('member', 'agent-1', 'run-1'),
      {
        kind: 'update',
        docId,
        content: '# Pitfalls\n\nFrom the agent.',
        reason: 'Learned.',
        source: issue,
      },
    );
    await docs.update(h.user('lead'), docId, {
      expectedVersion: 1,
      content: '# Pitfalls\n\nFrom the lead.',
    });
    const stale = await proposals.get(h.user('lead'), proposal.id);
    expect(stale).toMatchObject({
      stale: true,
      baseVersion: 1,
      currentVersion: 2,
      baseContent: '# Pitfalls\n\nNone yet.',
      currentContent: '# Pitfalls\n\nFrom the lead.',
      content: '# Pitfalls\n\nFrom the agent.',
    });
    await expect(
      proposals.accept(h.user('lead'), proposal.id),
    ).rejects.toMatchObject({
      status: 409,
      code: 'KNOWLEDGE_PROPOSAL_STALE',
      details: { currentVersion: 2, baseVersion: 1 },
    });
    const accepted = await proposals.accept(h.user('lead'), proposal.id, {
      confirmStale: true,
    });
    expect(accepted.appliedVersion).toBe(3);
    expect((await docs.get(h.user('lead'), docId)).content).toBe(
      '# Pitfalls\n\nFrom the agent.',
    );
  });

  it('creates a new document in its parent’s space, files it at the root when the parent went, and verifies', async () => {
    const { proposals, docs } = h.knowledge;
    const agent = h.agent('member', 'agent-1', 'run-1');
    const parent = await docs.create(h.user('lead'), {
      ...project,
      title: 'Guides',
      content: '# Guides',
    });
    const child = await proposals.propose(agent, {
      kind: 'create',
      parentId: parent.id,
      title: 'Release guide',
      content: '# Release guide',
      reason: 'Needed.',
      source: issue,
    });
    expect(child).toMatchObject({
      scope: 'project',
      parentId: parent.id,
      slug: 'release-guide',
    });
    await expect(
      proposals.propose(h.agent('member', 'agent-2'), {
        kind: 'create',
        title: 'Pitfalls',
        slug: 'pitfalls',
        content: 'x',
        reason: 'Dup.',
        primary: project,
      }),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_SLUG_TAKEN' });
    await docs.archive(h.user('lead'), parent.id);
    const accepted = await proposals.accept(h.user('lead'), child.id);
    expect(accepted.comment).toContain('filed at the root');
    const doc = await docs.get(h.user('lead'), accepted.docId!);
    expect(doc).toMatchObject({
      parentId: null,
      slug: 'release-guide',
      version: 1,
    });

    const verify = await proposals.propose(
      h.agent('member', 'agent-1', 'run-2'),
      {
        kind: 'verify',
        docId,
        reason: 'Checked the manual; nothing changed.',
        source: { kind: 'issue', id: 'i9' },
      },
    );
    expect(verify.content).toBeNull();
    await proposals.accept(h.user('lead'), verify.id);
    expect(await docs.get(h.user('lead'), docId)).toMatchObject({
      version: 1,
      verifiedBy: { id: 'lead' },
    });
  });

  it('refuses proposals from people and agents without the right, and on the system space sends them to administrators', async () => {
    const { proposals, docs } = h.knowledge;
    h.levels.set('reader', READER);
    await expect(
      proposals.propose(h.agent('reader', 'agent-1'), {
        kind: 'update',
        docId,
        content: 'x',
        reason: 'y',
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      proposals.propose(h.agent('member', 'agent-1'), {
        kind: 'update',
        docId,
        content: 'x',
        reason: '',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REASON' });
    const rules = await docs.create(h.user('admin'), {
      scope: 'system',
      scopeId: '',
      title: 'Rules',
      content: '# Rules',
    });
    const system = await proposals.propose(h.agent('member', 'agent-1'), {
      kind: 'update',
      docId: rules.id,
      content: '# Rules\n\nMore.',
      reason: 'More.',
    });
    expect(system.scope).toBe('system');
    // The lead decides projects, not the system's.
    await expect(
      proposals.accept(h.user('lead'), system.id),
    ).rejects.toMatchObject({
      status: 403,
    });
    expect((await proposals.accept(h.user('admin'), system.id)).status).toBe(
      'accepted',
    );
  });
});
