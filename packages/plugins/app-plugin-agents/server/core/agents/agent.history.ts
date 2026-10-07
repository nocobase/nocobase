/**
 * The history of an agent's configuration (`agAgentChanges`): who changed what and when, a field at a time. Only this
 * file reads or writes it. A variable is a secret, so its entry names it and says whether it was added, changed or
 * removed, never what it holds.
 */
import type { DatabaseConnection, Repository } from '@nocobase/db';

import {
  AGENT_CHANGE_ACTIONS,
  AGENT_HISTORY_FIELDS,
  type Agent,
  type AgentChange,
  type AgentChangeAction,
  type AgentFieldChange,
} from '../../../shared/agents.js';
import type { People } from '../../kernel/people.js';
import { asJson, type JsonColumn } from '../../kernel/values.js';

const CHANGES = 'agAgentChanges';

interface ChangeRecord {
  readonly id: string;
  readonly agentId: string;
  readonly revision: number;
  readonly action: string;
  readonly actorUserId: string | null;
  readonly changes: JsonColumn;
  readonly createdAt: string;
}

function changesRepo(conn: DatabaseConnection): Repository<ChangeRecord> {
  return conn.repository<ChangeRecord>(CHANGES);
}

/** Lists of strings compare as sets, everything else (the ordered model entries too) as JSON. */
function same(before: unknown, after: unknown): boolean {
  if (
    Array.isArray(before) &&
    Array.isArray(after) &&
    (before as unknown[])
      .concat(after as unknown[])
      .every((item) => typeof item === 'string')
  )
    return (
      before.length === after.length &&
      before.every((item: unknown) => after.includes(item))
    );
  return JSON.stringify(before ?? null) === JSON.stringify(after ?? null);
}

/** The fields that differ between two states of an agent, in the order the history shows them. */
export function diffAgents(before: Agent, after: Agent): AgentFieldChange[] {
  const changes: AgentFieldChange[] = [];
  for (const field of AGENT_HISTORY_FIELDS) {
    const from = before[field] ?? null;
    const to = after[field] ?? null;
    if (!same(from, to)) changes.push({ field, before: from, after: to });
  }
  return changes;
}

export async function recordChange(
  conn: DatabaseConnection,
  entry: {
    readonly id: string;
    readonly agentId: string;
    readonly revision: number;
    readonly action: AgentChangeAction;
    readonly actorUserId: string | null;
    readonly changes: readonly AgentFieldChange[];
    readonly createdAt: string;
  },
): Promise<void> {
  await changesRepo(conn).createOne({
    values: { ...entry, changes: asJson(entry.changes) },
  });
}

function changesOf(value: JsonColumn): AgentFieldChange[] {
  const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? (parsed as AgentFieldChange[]) : [];
}

/** The agent's history, newest first; with `afterRevision`, only the changes that came after it. */
/** Which changes to read: after a revision, and a page at a time (`cursor`: the last change of the previous page). */
export interface HistoryOptions {
  readonly afterRevision?: number;
  readonly limit?: number;
  readonly cursor?: {
    readonly createdAt: string;
    readonly revision: number;
    readonly id: string;
  };
}

export async function listChanges(
  conn: DatabaseConnection,
  people: People,
  agentId: string,
  options: HistoryOptions = {},
): Promise<AgentChange[]> {
  const { afterRevision } = options;
  const records = await changesRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('agentId').eq(agentId),
        ...(afterRevision === undefined
          ? []
          : [f.number('revision').gt(afterRevision)]),
      ]),
    sort: (sort) => [
      sort.field('createdAt').desc(),
      sort.field('revision').desc(),
      sort.field('id').desc(),
    ],
    limit: options.limit ?? 200,
    ...(options.cursor ? { cursor: options.cursor } : {}),
  });
  const names = await people.names(
    conn,
    records.flatMap((record) =>
      record.actorUserId ? [record.actorUserId] : [],
    ),
  );
  return records.map((record) => ({
    id: record.id,
    agentId: record.agentId,
    revision: Number(record.revision),
    action: (AGENT_CHANGE_ACTIONS as readonly string[]).includes(record.action)
      ? (record.action as AgentChangeAction)
      : 'updated',
    actorUserId: record.actorUserId,
    actorName: record.actorUserId
      ? (names.get(record.actorUserId) ?? null)
      : null,
    changes: changesOf(record.changes),
    createdAt: record.createdAt,
  }));
}
