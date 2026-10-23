/**
 * The agent collection, `agAgents`. Only this file reads or writes it. An agent removed by an earlier version keeps its
 * row with `deletedAt`, so the runs, comments and conversations that name it still show its name; lists leave it out.
 */
import type { DatabaseConnection, Repository } from '@nocobase/db';

import { AGENT_TOOLS, type AgentTool } from '@nocobase/agent-protocol';

import {
  AGENT_STATUSES,
  type Agent,
  type AgentName,
  type AgentSource,
  type AgentStatus,
  type RunnerModelEntry,
} from '../../../shared/agents.js';
import type { I18nText } from '../../../shared/i18n.js';
import { jsonObject, stringArray } from '../../kernel/values.js';

const AGENTS = 'agAgents';

export interface AgentRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly nameText: Readonly<Record<string, unknown>> | null;
  readonly descriptionText: Readonly<Record<string, unknown>> | null;
  readonly avatar: string | null;
  readonly type: string;
  readonly source: string | null;
  readonly status: string;
  readonly tool: string | null;
  readonly model: string | null;
  readonly modelEntries: readonly unknown[];
  readonly instructions: string | null;
  readonly runnerIds: readonly unknown[];
  readonly actions: readonly unknown[];
  readonly confirmChanges: string;
  readonly access: string;
  readonly ownerUserId: string;
  readonly maxConcurrentRuns: number;
  readonly maxAttempts: number;
  readonly toolPolicy: Readonly<Record<string, unknown>> | null;
  readonly lastClaimAt: string | null;
  readonly lastReportedAt: string | null;
  readonly archivedAt: string | null;
  readonly deletedAt: string | null;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function agentsRepo(conn: DatabaseConnection): Repository<AgentRecord> {
  return conn.repository<AgentRecord>(AGENTS);
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

const isTool = (value: unknown): value is AgentTool =>
  typeof value === 'string' && AGENT_TOOLS.includes(value as AgentTool);

/** The stored entries, dropping any that names no coding tool (an online agent's, kept by earlier versions). */
export function entriesOf(value: unknown): RunnerModelEntry[] {
  let list: unknown = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list) as unknown;
    } catch {
      list = [];
    }
  }
  const entries: RunnerModelEntry[] = [];
  for (const item of Array.isArray(list) ? (list as unknown[]) : []) {
    if (item === null || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;
    if (isTool(raw.tool))
      entries.push({
        tool: raw.tool,
        model: text(raw.model),
        effort: text(raw.effort),
      });
  }
  return entries;
}

/** A stored `{ key, ns }` i18n reference, or null. */
function i18nTextOf(value: unknown): I18nText | null {
  const object = jsonObject(value);
  return typeof object.key === 'string' && typeof object.ns === 'string'
    ? { key: object.key, ns: object.ns }
    : null;
}

export function toAgent(record: AgentRecord): Agent {
  const toolPolicy =
    record.toolPolicy === null ? null : jsonObject(record.toolPolicy);
  const source: AgentSource = record.source === 'system' ? 'system' : 'runner';
  const status: AgentStatus =
    record.deletedAt || record.archivedAt
      ? 'disabled'
      : (AGENT_STATUSES as readonly string[]).includes(record.status)
        ? (record.status as AgentStatus)
        : 'pending';
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    nameText: i18nTextOf(record.nameText),
    descriptionText: i18nTextOf(record.descriptionText),
    avatar: record.avatar,
    source,
    status,
    tool: isTool(record.tool) ? record.tool : null,
    model: record.model,
    modelEntries: entriesOf(record.modelEntries),
    instructions: record.instructions,
    actions: stringArray(record.actions),
    confirmChanges: record.confirmChanges === 'always' ? 'always' : 'larger',
    maxConcurrentRuns: Number(record.maxConcurrentRuns),
    maxAttempts: Number(record.maxAttempts),
    toolPolicy,
    lastReportedAt: record.lastReportedAt,
    revision: Number(record.revision),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** Any agent by id, a removed one included: runs and comments name it. */
export async function findAgent(
  conn: DatabaseConnection,
  id: string,
): Promise<Agent | null> {
  const record = await agentsRepo(conn).findOne({ filter: { id } });
  if (!record) return null;
  return toAgent(record);
}

/** Load candidate agents in one query; skills belong to run scopes. */
export async function findAgents(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<Map<string, Agent>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const records = await agentsRepo(conn).findMany({
    filter: (f) => f.or(unique.map((id) => f.string('id').eq(id))),
  });
  return new Map(records.map((record) => [record.id, toAgent(record)]));
}

/** Whether the agent is gone, or was removed by an earlier version (its row kept for the names in its history). */
export async function isRemoved(
  conn: DatabaseConnection,
  id: string,
): Promise<boolean> {
  const record = await agentsRepo(conn).findOne({ filter: { id } });
  return !record || record.deletedAt !== null;
}

/** The names of agents by id, removed ones included: runs name them. */
export async function agentNamesOf(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const records = await agentsRepo(conn).findMany({
    filter: (f) => f.or(unique.map((id) => f.string('id').eq(id))),
  });
  return new Map(records.map((record) => [record.id, record.name]));
}

/** Every agent's name, removed ones included, by name. */
export async function agentDirectory(
  conn: DatabaseConnection,
): Promise<AgentName[]> {
  const records = await agentsRepo(conn).findMany({
    sort: (sort) => [sort.field('name').asc(), sort.field('id').asc()],
  });
  return records.map((record) => ({
    id: record.id,
    name: record.name,
    nameText: i18nTextOf(record.nameText),
  }));
}

/** The agents not removed, by name. */
export async function listAgents(conn: DatabaseConnection): Promise<Agent[]> {
  const records = await agentsRepo(conn).findMany({
    filter: (f) => f.date('deletedAt').empty(),
    sort: (sort) => [sort.field('name').asc(), sort.field('id').asc()],
  });
  return records.map(toAgent);
}

export async function insertAgent(
  conn: DatabaseConnection,
  values: Omit<
    AgentRecord,
    'lastClaimAt' | 'archivedAt' | 'deletedAt' | 'revision'
  >,
): Promise<void> {
  await agentsRepo(conn).createOne({
    values: {
      ...values,
      lastClaimAt: null,
      archivedAt: null,
      deletedAt: null,
      revision: 1,
    },
  });
}

export async function updateAgent(
  conn: DatabaseConnection,
  id: string,
  values: Partial<Omit<AgentRecord, 'id' | 'createdAt'>>,
): Promise<void> {
  await agentsRepo(conn).updateMany({ filter: { id }, values });
}

/** Removes an agent's row outright: only for one never enabled and never run, which keeps no history anyone reads. */
export async function deleteAgent(
  conn: DatabaseConnection,
  id: string,
): Promise<void> {
  await agentsRepo(conn).deleteMany({ filter: { id } });
}

/**
 * Writes a change made against `revision`, raising it by one. False, writing nothing, when the agent is no longer at
 * that revision.
 */
export async function reviseAgent(
  conn: DatabaseConnection,
  id: string,
  revision: number,
  values: Partial<Omit<AgentRecord, 'id' | 'createdAt' | 'revision'>>,
): Promise<boolean> {
  const { updatedCount } = await agentsRepo(conn).updateMany({
    filter: { id, revision },
    values: { ...values, revision: revision + 1 },
  });
  return updatedCount > 0;
}

/**
 * Takes the agent's claim lock: an update of its row, which on databases with row locks makes concurrent claims for
 * the same agent wait for each other until the claiming transaction ends.
 */
export async function lockAgentForClaim(
  conn: DatabaseConnection,
  id: string,
  now: string,
): Promise<void> {
  await agentsRepo(conn).updateMany({
    filter: { id },
    values: { lastClaimAt: now },
  });
}
