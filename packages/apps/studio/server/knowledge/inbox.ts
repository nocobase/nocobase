/**
 * The knowledge base in Studio's inbox (source `knowledge`), after each change commits:
 *
 * - `knowledge_proposal`: a decision card for each decider of a new proposal (the project's lead, or the
 *   administrators), keyed by the proposal's id, whether or not it came from an issue. Accepting or rejecting goes
 *   through the knowledge plugin's `/api/knowledge/proposals/:proposalId/{accept,reject}`, which checks the decider again.
 * - when a proposal is decided, every card of it is settled with the outcome (`accepted`, `rejected`), or withdrawn;
 *   the person it was made for hears how someone else decided (`knowledge_decided`).
 *
 * The cards carry the names they show; the browser words them from Studio's locales (`client/inbox/contributions`).
 */
import type {
  Knowledge,
  KnowledgeEvent,
  ProposalDoc,
  ProposalRecord,
} from '@nocobase/app-plugin-knowledge/server/tokens';
import type { SpaceRef } from '@nocobase/app-plugin-knowledge/shared/knowledge';

import {
  KNOWLEDGE_DECIDED,
  KNOWLEDGE_INBOX_SOURCE,
  KNOWLEDGE_PROPOSAL,
  PROJECT_SCOPE,
} from '../../shared/knowledge.js';
import type { StudioInboxPort, InboxSend } from '../inbox/port.js';
import { decidersOf, type KnowledgeDirectory } from './access.js';

/** Numbers as numbers: some dialects hand integers back as text. */
const num = (value: unknown): number => Number(value);

/** Where a proposal is decided in the app: its space's knowledge view, opened on it. */
export function proposalPath(space: SpaceRef, proposalId: string): string {
  const query = new URLSearchParams();
  if (space.scope === PROJECT_SCOPE) query.set('tab', 'knowledge');
  query.set('proposal', proposalId);
  return space.scope === PROJECT_SCOPE
    ? `/projects/${encodeURIComponent(space.scopeId)}?${query.toString()}`
    : `/knowledge?${query.toString()}`;
}

export interface KnowledgeInboxDeps {
  readonly knowledge: Pick<Knowledge, 'events'>;
  readonly directory: KnowledgeDirectory;
  readonly port: () => StudioInboxPort | undefined;
  readonly onError?: (message: string, error: unknown) => void;
}

async function namesOf(
  directory: KnowledgeDirectory,
  record: ProposalRecord,
  decider: string | null,
) {
  const names = await directory.names([
    { kind: record.proposerKind, id: record.proposerId },
    { kind: 'user', id: record.authorizedById },
    ...(decider ? [{ kind: 'user', id: decider }] : []),
  ]);
  return {
    proposer: names.get(`${record.proposerKind}:${record.proposerId}`) ?? null,
    authorizer: names.get(`user:${record.authorizedById}`) ?? null,
    decider: decider ? (names.get(`user:${decider}`) ?? null) : null,
  };
}

/** The values a card shows. */
async function cardData(
  deps: KnowledgeInboxDeps,
  record: ProposalRecord,
  space: SpaceRef,
  doc: ProposalDoc | null,
) {
  const project =
    space.scope === PROJECT_SCOPE
      ? await deps.directory.project(space.scopeId)
      : null;
  return {
    doc,
    data: {
      proposalId: record.id,
      kind: record.kind,
      title: doc?.title ?? record.title ?? '',
      docId: record.docId,
      docSlug: doc?.slug ?? record.slug,
      scope: space.scope,
      scopeId: space.scopeId,
      spaceTitle: project?.name ?? null,
      reason: record.reason,
      summary: record.summary,
      baseVersion: record.baseVersion === null ? null : num(record.baseVersion),
      sourceKind: record.sourceKind,
      sourceId: record.sourceId,
      sourceTitle: record.sourceTitle,
    },
  };
}

export async function proposalNotice(
  deps: KnowledgeInboxDeps,
  record: ProposalRecord,
  space: SpaceRef,
  doc: ProposalDoc | null,
  userIds: readonly string[],
): Promise<InboxSend> {
  const names = await namesOf(deps.directory, record, null);
  const { data } = await cardData(deps, record, space, doc);
  return {
    key: `knowledge:proposal:${record.id}`,
    source: KNOWLEDGE_INBOX_SOURCE,
    kind: 'decision',
    type: KNOWLEDGE_PROPOSAL,
    userIds,
    // Kept by the in-app item for a reader without the renderer.
    title: `Knowledge proposal: ${data.title}`,
    body: record.reason,
    path: proposalPath(space, record.id),
    subject: {
      type: 'knowledge',
      id: record.docId ?? record.id,
      label: data.title.slice(0, 191) || null,
    },
    decisionKey: record.id,
    actor: {
      type: record.proposerKind,
      id: record.proposerId,
      name: names.proposer,
    },
    data: {
      ...data,
      proposerKind: record.proposerKind,
      proposerName: names.proposer,
      authorizerName: names.authorizer,
    },
  };
}

/** Listens to the knowledge base and keeps the inboxes in step; returns what stops it. */
export function bindKnowledgeInbox(deps: KnowledgeInboxDeps): () => void {
  const onError =
    deps.onError ?? ((message, error) => console.error(message, error));
  async function handle(event: KnowledgeEvent): Promise<void> {
    const port = deps.port();
    if (!port) return;
    if (event.type === 'proposal.created') {
      const deciders = await decidersOf(deps.directory, event.space);
      if (deciders.length === 0) return;
      await port.send(
        await proposalNotice(
          deps,
          event.proposal,
          event.space,
          event.doc,
          deciders,
        ),
      );
      return;
    }
    if (event.type !== 'proposal.decided') return;
    const ref = {
      source: KNOWLEDGE_INBOX_SOURCE,
      decisionKey: event.proposal.id,
    };
    if (event.decision === 'withdrawn') {
      await port.withdraw(ref);
      return;
    }
    await port.resolve({ ...ref, outcome: event.decision });
    const record = event.proposal;
    if (!event.byUserId || event.byUserId === record.authorizedById) return;
    const names = await namesOf(deps.directory, record, event.byUserId);
    const { data } = await cardData(deps, record, event.space, event.doc);
    await port.send({
      key: `knowledge:decided:${record.id}`,
      source: KNOWLEDGE_INBOX_SOURCE,
      kind: 'info',
      type: KNOWLEDGE_DECIDED,
      userIds: [record.authorizedById],
      title: `Knowledge proposal ${event.decision}: ${data.title}`,
      body: record.comment ?? '',
      path: proposalPath(event.space, record.id),
      subject: {
        type: 'knowledge',
        id: record.docId ?? record.id,
        label: data.title.slice(0, 191) || null,
      },
      actor: { type: 'user', id: event.byUserId, name: names.decider },
      data: {
        ...data,
        decision: event.decision,
        comment: record.comment,
        version:
          record.appliedVersion === null ? null : num(record.appliedVersion),
        deciderName: names.decider,
        proposerName: names.proposer,
      },
    });
  }
  return deps.knowledge.events.on((event) =>
    handle(event).catch((error: unknown) =>
      onError('Could not put a knowledge proposal in the inbox.', error),
    ),
  );
}
