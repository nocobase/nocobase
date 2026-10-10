// @vitest-environment node
/**
 * Sending knowledge back for changes: a pending proposal, or a document's version an agent wrote, goes back to its
 * proposer with a comment; the next proposal from the same source replaces it, and the version it becomes records what
 * it was sent back with.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  ADMIN,
  createKnowledgeHarness,
  type KnowledgeHarness,
} from './harness.js';

const project = { scope: 'project', scopeId: 'p1' } as const;
const issue = { kind: 'issue', id: 'i1', title: 'PM-54 Plugin pages' };

describe('sending knowledge back for changes', () => {
  let h: KnowledgeHarness;
  let docId: string;
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('admin', ADMIN);
    h.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
    docId = (
      await h.knowledge.docs.create(h.user('lead'), {
        ...project,
        title: 'Plugin pages',
        slug: 'plugin-pages',
        content: '# Plugin pages\n\nUnknown.',
      })
    ).id;
  });
  afterEach(async () => {
    await h?.close();
  });

  it('sends a proposal back, and the revision from the same source replaces it and shows the diff from it', async () => {
    const { proposals, docs } = h.knowledge;
    const first = await proposals.propose(
      h.agent('member', 'agent-1', 'run-1'),
      {
        kind: 'update',
        docId,
        content: '# Plugin pages\n\nExport a patch.',
        reason: 'Learned in PM-54.',
        source: issue,
      },
    );

    // Only a decider sends it back, and says why.
    await expect(
      proposals.requestChanges(h.user('member'), first.id, {
        comment: 'No.',
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      proposals.requestChanges(
        h.agent('member', 'agent-1', 'run-1'),
        first.id,
        { comment: 'No.' },
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      proposals.requestChanges(h.user('lead'), first.id, { comment: ' ' }),
    ).rejects.toMatchObject({ code: 'INVALID_COMMENT' });

    const sent = await proposals.requestChanges(h.user('lead'), first.id, {
      comment: 'Edit the plugin in place; do not export a patch.',
    });
    expect(sent).toMatchObject({
      status: 'revising',
      origin: 'proposal',
      decidedBy: { id: 'lead' },
      comment: 'Edit the plugin in place; do not export a patch.',
      canDecide: true,
    });
    expect(h.events.at(-1)).toMatchObject({
      type: 'proposal.changesRequested',
      proposal: {
        id: first.id,
        sourceKind: 'issue',
        sourceId: 'i1',
        proposerId: 'agent-1',
        runId: 'run-1',
      },
      comment: 'Edit the plugin in place; do not export a patch.',
      byUserId: 'lead',
      doc: { id: docId },
    });
    // Sent back, it is not accepted, and not sent back twice.
    await expect(
      proposals.accept(h.user('lead'), first.id),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_PROPOSAL_DECIDED' });
    await expect(
      proposals.requestChanges(h.user('lead'), first.id, { comment: 'Again' }),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_PROPOSAL_DECIDED' });
    expect(
      (await proposals.list(h.user('lead'), { status: 'revising' })).map(
        (item) => item.id,
      ),
    ).toEqual([first.id]);

    // The agent, woken on the same issue, proposes again in a run of its own.
    const revision = await proposals.propose(
      h.agent('member', 'agent-1', 'run-2'),
      {
        kind: 'update',
        docId,
        content: '# Plugin pages\n\nEdit the plugin in its checkout.',
        reason: 'As the lead asked.',
        source: issue,
      },
    );
    expect(revision).toMatchObject({
      status: 'pending',
      replaces: {
        proposalId: first.id,
        origin: 'proposal',
        comment: 'Edit the plugin in place; do not export a patch.',
        requestedBy: { id: 'lead' },
      },
    });
    expect(await proposals.get(h.user('lead'), revision.id)).toMatchObject({
      replacedContent: '# Plugin pages\n\nExport a patch.',
      baseContent: '# Plugin pages\n\nUnknown.',
    });
    expect(await proposals.get(h.user('lead'), first.id)).toMatchObject({
      status: 'superseded',
      supersededById: revision.id,
      canDecide: false,
    });

    const accepted = await proposals.accept(h.user('lead'), revision.id);
    expect(accepted).toMatchObject({ status: 'accepted', appliedVersion: 2 });
    const [latest] = await docs.versions(h.user('lead'), docId);
    expect(latest).toMatchObject({
      version: 2,
      proposalId: revision.id,
      source: { kind: 'issue', id: 'i1' },
      revision: {
        proposalId: first.id,
        origin: 'proposal',
        comment: 'Edit the plugin in place; do not export a patch.',
        requestedBy: { id: 'lead' },
      },
    });
    expect(await docs.version(h.user('lead'), docId, 2)).toMatchObject({
      revision: { proposalId: first.id },
    });
    expect(await docs.version(h.user('lead'), docId, 1)).toMatchObject({
      revision: null,
    });
  });

  it("sends a document's version an agent wrote back to it, and accepts the revision as the next version", async () => {
    const { proposals, docs } = h.knowledge;
    // A person wrote version 1: there is nobody to send it back to.
    await expect(
      proposals.requestDocChanges(h.user('lead'), docId, { comment: 'Fix' }),
    ).rejects.toMatchObject({ code: 'NOT_REVISABLE' });

    const learned = await proposals.propose(
      h.agent('member', 'agent-1', 'run-1'),
      {
        kind: 'update',
        docId,
        content: '# Plugin pages\n\nExport a patch.',
        reason: 'Learned in PM-54.',
        source: issue,
      },
    );
    await proposals.accept(h.user('lead'), learned.id);

    await expect(
      proposals.requestDocChanges(h.user('member'), docId, { comment: 'Fix' }),
    ).rejects.toMatchObject({ status: 403 });
    const sent = await proposals.requestDocChanges(h.user('lead'), docId, {
      comment: 'The code is in the nocobase3 checkout; edit it there.',
    });
    expect(sent).toMatchObject({
      kind: 'update',
      status: 'revising',
      origin: 'document',
      docId,
      baseVersion: 2,
      content: '# Plugin pages\n\nExport a patch.',
      proposer: { kind: 'agent', id: 'agent-1' },
      authorizedBy: { id: 'lead' },
      source: { kind: 'issue', id: 'i1' },
      runId: 'run-1',
      comment: 'The code is in the nocobase3 checkout; edit it there.',
    });
    expect(h.events.at(-1)).toMatchObject({
      type: 'proposal.changesRequested',
      proposal: { id: sent.id, origin: 'document', sourceId: 'i1' },
      byUserId: 'lead',
    });
    await expect(
      proposals.requestDocChanges(h.user('lead'), docId, { comment: 'Again' }),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_PROPOSAL_PENDING' });

    const revision = await proposals.propose(
      h.agent('member', 'agent-1', 'run-2'),
      {
        kind: 'update',
        docId,
        content: '# Plugin pages\n\nEdit the code in the nocobase3 checkout.',
        reason: 'As the lead asked.',
        source: issue,
      },
    );
    expect(revision).toMatchObject({
      replaces: { proposalId: sent.id, origin: 'document' },
    });
    await proposals.accept(h.user('lead'), revision.id);
    const doc = await docs.get(h.user('lead'), docId);
    expect(doc.version).toBe(3);
    const [latest] = await docs.versions(h.user('lead'), docId);
    expect(latest).toMatchObject({
      version: 3,
      revision: {
        origin: 'document',
        comment: 'The code is in the nocobase3 checkout; edit it there.',
        requestedBy: { id: 'lead' },
      },
    });
  });

  it('takes a revision naming what it replaces, from its proposer only, and lets one sent back be rejected or withdrawn', async () => {
    const { proposals } = h.knowledge;
    const first = await proposals.propose(
      h.agent('member', 'agent-1', 'run-1'),
      {
        kind: 'update',
        docId,
        content: 'A',
        reason: 'A.',
        source: issue,
      },
    );
    await proposals.requestChanges(h.user('lead'), first.id, {
      comment: 'Say more.',
    });
    // Another agent cannot claim it, nor can a pending proposal be named.
    await expect(
      proposals.propose(h.agent('member', 'agent-2', 'run-9'), {
        kind: 'update',
        docId,
        content: 'B',
        reason: 'B.',
        source: { kind: 'issue', id: 'i9', title: 'Other' },
        replacesId: first.id,
      }),
    ).rejects.toMatchObject({ code: 'KNOWLEDGE_PROPOSAL_NOT_REVISING' });
    // Its proposer, from elsewhere, can.
    const revision = await proposals.propose(
      h.agent('member', 'agent-1', 'run-2'),
      {
        kind: 'update',
        docId,
        content: 'A, with more.',
        reason: 'More.',
        source: { kind: 'conversation', id: 'c1', title: 'Chat' },
        replacesId: first.id,
      },
    );
    expect(revision.replaces?.proposalId).toBe(first.id);

    await proposals.requestChanges(h.user('lead'), revision.id, {
      comment: 'Still not it.',
    });
    const rejected = await proposals.reject(h.user('lead'), revision.id);
    expect(rejected).toMatchObject({
      status: 'rejected',
      comment: 'Still not it.',
    });

    const third = await proposals.propose(
      h.agent('member', 'agent-1', 'run-3'),
      {
        kind: 'update',
        docId,
        content: 'C',
        reason: 'C.',
        source: issue,
      },
    );
    await proposals.requestChanges(h.user('lead'), third.id, {
      comment: 'Hmm.',
    });
    expect(
      await proposals.withdraw(h.agent('member', 'agent-1', 'run-4'), third.id),
    ).toMatchObject({ status: 'withdrawn' });
  });
});
