import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, Repository } from '@nocobase/db';
import { conflict } from '../errors.js';
import type { KnowledgeContext, KnowledgeTx } from './context.js';
import { findDocBySlug, proposalsRepo, type ProposalRecord } from './store.js';

export interface ProposalGroup {
  readonly groupKey: string;
  readonly activeProposalId: string | null;
  readonly lockToken: string;
}
export const groupsRepo = (
  conn: DatabaseConnection,
): Repository<ProposalGroup> =>
  conn.repository<ProposalGroup>('kbProposalGroups');

/** Match only driver diagnostics, never Knex's message containing the submitted SQL. */
export function violatesUnique(
  error: unknown,
  constraint: string,
  sqliteColumns: string,
): boolean {
  const seen = new Set<unknown>();
  let current = error;
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    const e = current as Record<string, unknown>;
    if (e.code === '23505' && e.constraint === constraint) return true;
    if (
      (e.code === 'ER_DUP_ENTRY' || e.errno === 1062) &&
      typeof e.sqlMessage === 'string'
    ) {
      const key = /for key ['`]([^'`]+)['`]\s*$/i
        .exec(e.sqlMessage)?.[1]
        ?.split('.')
        .at(-1);
      if (key === constraint) return true;
    }
    if (
      (e.code === 'SQLITE_CONSTRAINT' ||
        e.code === 'SQLITE_CONSTRAINT_UNIQUE') &&
      typeof e.message === 'string'
    ) {
      const columns = /UNIQUE constraint failed: ([\w., ]+)\s*$/.exec(
        e.message,
      )?.[1];
      if (columns === sqliteColumns) return true;
    }
    current = e.cause ?? e.originalError;
  }
  return false;
}

class GroupCreationRace extends Error {}

/** The UPDATE is the first database operation: wait for the write lock before establishing a read snapshot. */
export async function withProposalGroup<T>(
  context: KnowledgeContext,
  groupKey: string,
  fn: (tx: KnowledgeTx, group: ProposalGroup) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    // Groups are never deleted. Discover existence outside the transaction, avoiding MySQL gap-lock upgrades when
    // two first requests both UPDATE a missing key and then INSERT. This read cannot establish the transaction snapshot.
    const exists = await groupsRepo(context.read()).findOne({
      filter: { groupKey },
    });
    try {
      return await context.transaction(async (tx) => {
        const repo = groupsRepo(tx.conn);
        const token = randomUUID();
        if (!exists) {
          try {
            await repo.createOne({
              values: { groupKey, activeProposalId: null, lockToken: token },
            });
          } catch (error) {
            if (
              violatesUnique(
                error,
                'kb_proposal_groups_pkey',
                'kb_proposal_groups.group_key',
              ) ||
              violatesUnique(error, 'PRIMARY', 'kb_proposal_groups.group_key')
            )
              throw new GroupCreationRace();
            throw error;
          }
        } else {
          const updated = await repo.updateMany({
            filter: { groupKey },
            values: { lockToken: token },
          });
          if (updated.updatedCount !== 1)
            throw conflict(
              'KNOWLEDGE_PROPOSAL_PENDING',
              'The proposal coordination record changed; retry the request.',
            );
        }
        const group = (await repo.findOne({ filter: { groupKey } }))!;
        return fn(tx, group);
      });
    } catch (error) {
      // PostgreSQL aborts a transaction after a unique violation. Retry only after the failed transaction has exited.
      if (!(error instanceof GroupCreationRace) || attempt >= 2) throw error;
    }
  }
}

export async function requireActive(
  tx: KnowledgeTx,
  group: ProposalGroup,
  record: ProposalRecord,
): Promise<void> {
  if (group.activeProposalId !== record.id)
    throw conflict(
      'KNOWLEDGE_PROPOSAL_WAITING',
      'This historical duplicate is waiting for earlier proposals to finish.',
    );
  if (
    record.legacyDuplicate &&
    record.kind === 'create' &&
    record.slug &&
    (await findDocBySlug(tx.conn, record.spaceId, record.slug))
  )
    throw conflict(
      'KNOWLEDGE_PROPOSAL_TARGET_EXISTS',
      'The target already exists. Reject or withdraw this historical duplicate and propose an update instead.',
    );
}

/** Release and hand off while holding the same group lock. No audit mutation or event accompanies handoff. */
export async function handoff(
  tx: KnowledgeTx,
  group: ProposalGroup,
  closedId: string,
): Promise<void> {
  if (group.activeProposalId !== closedId) return;
  const [next] = await proposalsRepo(tx.conn).findMany({
    filter: (f) =>
      f.and([
        f.string('groupKey').eq(group.groupKey),
        f.or([
          f.string('status').eq('pending'),
          f.string('status').eq('revising'),
        ]),
      ]),
    sort: (s) => [s.field('createdAt').asc(), s.field('id').asc()],
    limit: 1,
  });
  if (next)
    await proposalsRepo(tx.conn).updateMany({
      filter: { id: next.id },
      values: { openKey: group.groupKey },
    });
  await groupsRepo(tx.conn).updateMany({
    filter: { groupKey: group.groupKey },
    values: { activeProposalId: next?.id ?? null },
  });
}
