import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

// This list is frozen with the migration. It includes archived/deleted history and every run/request status.
const directReferences = [
  ['agRuns', 'agentId'],
  ['agSessions', 'agentId'],
  ['agRunTokens', 'agentId'],
  ['agRunRequests', 'agentId'],
  ['agRunRequests', 'inputActorId', 'inputActorKind', 'agent'],
  ['agRunInputs', 'actorId', 'actorKind', 'agent'],
  ['agConversations', 'agentId'],
  ['agConversations', 'fallbackFromAgentId'],
  ['agChatPreferences', 'defaultAgentId'],
  ['agAgentUsers', 'agentId'],
  ['agAgentChanges', 'agentId'],
  ['agSecrets', 'scopeId', 'scope', 'agent'],
  ['agSecretAudits', 'scopeId', 'scope', 'agent'],
  ['agSkillAttachments', 'scopeId', 'scope', 'agent'],
  ['pmIssues', 'executorId', 'executorType', 'agent'],
  ['pmComments', 'authorId', 'authorType', 'agent'],
  ['pmComments', 'deletedById', 'deletedByType', 'agent'],
  ['pmActivities', 'actorId', 'actorType', 'agent'],
  ['pmPlans', 'createdById', 'createdByType', 'agent'],
  // ExecutedById has no kind column; retain any exact match conservatively.
  ['pmPlans', 'executedById'],
  ['studioProjectInits', 'agentId'],
  ['studioDelegations', 'agentId'],
  ['studioStageRunGuards', 'agentId'],
  ['studioInboxNotices', 'actorId', 'actorType', 'agent'],
] as const;

// Only structured reference-bearing columns are read, never comment bodies or secret values.
const jsonReferences = [
  ['agSettings', 'key', ['value']],
  ['pmComments', 'id', ['origin']],
  ['pmActivities', 'id', ['details']],
  ['pmPlans', 'id', ['proposer', 'sourceData']],
  ['pmPlanRows', 'id', ['params', 'result']],
  ['studioSettings', 'key', ['value']],
  ['studioStageRunGuards', 'id', ['ruleConfig']],
  ['studioInboxNotices', 'id', ['data']],
] as const;

export interface PendingRunnerClassification {
  readonly candidates: string[];
  readonly remove: string[];
  readonly disable: string[];
  readonly reasons: Record<string, number>;
}

/** Also used by the operator's read-only preflight; no writes or application services. */
export async function classifyPendingRunnerAgents({
  builder,
  query,
}: Pick<
  MigrationContext,
  'builder' | 'query'
>): Promise<PendingRunnerClassification> {
  const rows = await query
    .selectFrom('agAgents')
    .select('id')
    .where('source', '=', 'runner')
    .where('status', '=', 'pending')
    .execute();
  const candidates = rows.map((row) => String(row.id));
  const ids = new Set(candidates);
  const retained = new Set<string>();
  const reasons = new Map<string, Set<string>>();
  const protect = (id: string, reason: string): void => {
    if (!ids.has(id)) return;
    retained.add(id);
    const matches = reasons.get(reason) ?? new Set<string>();
    matches.add(id);
    reasons.set(reason, matches);
  };
  if (ids.size === 0)
    return { candidates, remove: [], disable: [], reasons: {} };

  for (const reference of directReferences) {
    const [table, column, kindColumn, kind] = reference;
    if (!(await builder.hasCollection(table))) continue;
    for (let offset = 0; offset < candidates.length; offset += 200) {
      let selection = query
        .selectFrom(table)
        .select(column)
        .where(column, 'in', candidates.slice(offset, offset + 200));
      if (kindColumn) selection = selection.where(kindColumn, '=', kind);
      for (const row of await selection.execute())
        protect(String(row[column]), `${table}.${column}`);
    }
  }

  const visit = (value: unknown, reason: string): void => {
    if (typeof value === 'string') protect(value, reason);
    else if (Array.isArray(value))
      for (const item of value) visit(item, reason);
    else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        protect(key, reason);
        visit(item, reason);
      }
    }
  };
  for (const [table, key, columns] of jsonReferences) {
    if (!(await builder.hasCollection(table))) continue;
    let after: string | undefined;
    for (;;) {
      let selection = query
        .selectFrom(table)
        .select([key, ...columns])
        .orderBy(key)
        .limit(200);
      if (after !== undefined) selection = selection.where(key, '>', after);
      const page = await selection.execute();
      for (const row of page)
        for (const column of columns) {
          let value: unknown = row[column];
          if (typeof value === 'string') {
            // A malformed reference cannot prove absence. Fail atomically before any update/delete.
            try {
              value = JSON.parse(value) as unknown;
            } catch {
              throw new Error(
                `Cannot classify runner agents: invalid JSON in ${table}.${column}.`,
              );
            }
          }
          visit(value, `${table}.${column}`);
        }
      if (page.length < 200) break;
      after = String(page[page.length - 1][key]);
    }
  }
  return {
    candidates,
    remove: candidates.filter((id) => !retained.has(id)),
    disable: candidates.filter((id) => retained.has(id)),
    reasons: Object.fromEntries(
      [...reasons].map(([reason, matches]) => [reason, matches.size]),
    ),
  };
}

const migration: MigrationDefinition = defineMigration({
  name: '202610310001_ag_retire_pending_runner_agents',
  async up(context): Promise<void> {
    const classification = await classifyPendingRunnerAgents(context);
    // Classification completes before writes. The migration runner already owns the transaction.
    for (const [status, ids] of [
      ['disabled', classification.disable],
      ['delete', classification.remove],
    ] as const) {
      for (let offset = 0; offset < ids.length; offset += 200) {
        const batch = ids.slice(offset, offset + 200);
        if (status === 'delete') {
          await context.query
            .deleteFrom('agAgents')
            .where('source', '=', 'runner')
            .where('status', '=', 'pending')
            .where('id', 'in', batch)
            .execute();
        } else {
          await context.query
            .updateTable('agAgents')
            .set({ status: 'disabled' })
            .where('source', '=', 'runner')
            .where('status', '=', 'pending')
            .where('id', 'in', batch)
            .execute();
        }
      }
    }
  },
  // Irreversible: deleted rows have no backup here, and disabled rows must not regain the retired state.
  // Restore from an operator's database backup if the deleted records are needed after a deployment rollback.
  async down(): Promise<void> {},
});
export default migration;
