import type { KnowledgeAccess, SpaceRef } from '../../shared/knowledge.js';
import type { AccessCheck } from './access.js';
import type { KnowledgeContext } from './context.js';
import type { DatabaseConnection } from '@nocobase/db';
import { conflict } from '../errors.js';
import { findDoc, findSpaceById, type ProposalRecord } from './store.js';

export function ownsProposal(
  access: AccessCheck,
  record: ProposalRecord,
): boolean {
  return (
    record.authorizedById === access.reader.userId ||
    (!!access.reader.actor &&
      record.proposerKind === access.reader.actor.kind &&
      record.proposerId === access.reader.actor.id)
  );
}

export async function proposalRights(
  context: KnowledgeContext,
  access: AccessCheck,
  record: ProposalRecord,
  space: SpaceRef,
): Promise<KnowledgeAccess> {
  const target = record.docId
    ? await findDoc(context.read(), record.docId)
    : record.parentId
      ? await findDoc(context.read(), record.parentId)
      : null;
  if (target && target.spaceId === record.spaceId)
    return (await access.doc(target)).access;
  return access.access(space);
}

/** Authorize each associated proposal before resolving its people or exposing its audit fields. */
export async function canReadProposal(
  context: KnowledgeContext,
  access: AccessCheck | null,
  record: ProposalRecord,
): Promise<boolean> {
  if (!access) return false;
  const space = await findSpaceById(context.read(), record.spaceId);
  if (!space) return false;
  if (ownsProposal(access, record)) return true;
  return (
    !!space &&
    (
      await proposalRights(context, access, record, {
        scope: space.scope,
        scopeId: space.scopeId ?? '',
      })
    ).read
  );
}

/** Detect target moves and inherited ACL changes between authorization and the group transaction. */
export async function proposalTargetSnapshot(
  conn: DatabaseConnection,
  targetId: string | null,
): Promise<string> {
  const chain = [];
  let id = targetId;
  for (let depth = 0; id && depth < 18; depth += 1) {
    const doc = await findDoc(conn, id);
    if (!doc) {
      chain.push(null);
      break;
    }
    chain.push([
      doc.id,
      doc.spaceId,
      doc.parentId,
      doc.accessMode,
      doc.aclKey,
      doc.updatedAt,
      doc.archivedAt,
    ]);
    id = doc.parentId;
  }
  return JSON.stringify(chain);
}

export async function checkProposalTarget(
  conn: DatabaseConnection,
  targetId: string | null,
  before: string,
): Promise<void> {
  if ((await proposalTargetSnapshot(conn, targetId)) !== before)
    throw conflict(
      'KNOWLEDGE_PROPOSAL_STALE',
      'The target or its access changed; reload before trying again.',
    );
}
