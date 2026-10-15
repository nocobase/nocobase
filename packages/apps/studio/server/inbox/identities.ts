/** Current names for identity labels; the stored notice, its body and audit snapshots are never rewritten. */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import type { InboxNotice } from '../../shared/inbox.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { commentGuardId, commentGuards } from '../agents/comment-guard.js';
import type { NoticeRow } from './service.js';

const text = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

/** Rows must have been selected for this recipient by the inbox service before this projection runs. */
export async function noticeIdentities(
  conn: DatabaseConnection,
  agents: Agents,
  rows: readonly NoticeRow[],
  notices: InboxNotice[],
): Promise<InboxNotice[]> {
  const data = notices.map((notice) => ({ ...notice.data }));
  const runIds = [
    ...new Set(
      data.flatMap((params) =>
        text(params.runId) ? [text(params.runId)!] : [],
      ),
    ),
  ];
  const runs = runIds.length
    ? await conn.query
        .selectFrom('agRuns')
        .select(['id', 'agentId'])
        .where('id', 'in', runIds)
        .execute()
    : [];
  const runAgents = new Map(
    runs.map((run) => [String(run.id), String(run.agentId)]),
  );
  const guardIds = notices.flatMap((notice, index) =>
    notice.type === 'comment_runs_limited' &&
    !text(data[index].agentId) &&
    notice.subject?.type === 'issue'
      ? [commentGuardId(notice.subject.id)]
      : [],
  );
  const guards = guardIds.length
    ? await commentGuards(conn).findMany({
        filter: (f) => f.or(guardIds.map((id) => f.string('id').eq(id))),
      })
    : [];
  const byGuard = new Map(guards.map((guard) => [guard.id, guard]));
  for (const [index, notice] of notices.entries()) {
    const params = data[index];
    if (!text(params.agentId) && text(params.runId))
      params.agentId = runAgents.get(text(params.runId)!) ?? null;
    if (notice.type !== 'comment_runs_limited' || text(params.agentId))
      continue;
    const guard =
      notice.subject?.type === 'issue'
        ? byGuard.get(commentGuardId(notice.subject.id))
        : undefined;
    const actor = guard?.ruleConfig?.actor as
      { kind?: unknown; id?: unknown } | undefined;
    if (
      text(params.continueToken) &&
      guard?.pendingToken === params.continueToken &&
      actor?.kind === 'agent' &&
      text(actor.id)
    )
      params.agentId = text(actor.id);
    else {
      delete params.agentName;
      params.agentIdentityUnknown = true;
    }
  }
  const ids = [
    ...new Set(
      rows.flatMap((row, index) => [
        ...(row.actorType === 'agent' && row.actorId ? [row.actorId] : []),
        ...(text(data[index].agentId) ? [text(data[index].agentId)!] : []),
      ]),
    ),
  ];
  const names = await agents.agents.names(conn, ids);
  return notices.map((notice, index) => {
    const params = data[index];
    const row = rows[index];
    const actorName =
      row.actorType === 'agent' && row.actorId
        ? names.get(row.actorId)
        : undefined;
    const agentId = text(params.agentId);
    const agentName = agentId ? names.get(agentId) : undefined;
    if (actorName !== undefined) params.actorName = actorName;
    if (agentName !== undefined) params.agentName = agentName;
    // Actor and target are separate identities; the old key cannot translate both.
    if (row.actorType === 'agent' && row.actorId === PROJECT_MANAGER_ID)
      params.actorDatabaseName = true;
    if (agentId === PROJECT_MANAGER_ID) params.agentDatabaseName = true;
    if (params.agentNameKey === 'studioAgents.projectManager.name') {
      delete params.agentNameKey;
      delete params.agentNameNs;
    }
    return {
      ...notice,
      data: Object.keys(params).length ? params : notice.data,
    };
  });
}
