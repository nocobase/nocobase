/**
 * The agent collections: `agAgents` and the `agAgentUsers` allow-list. Only this file reads or writes them.
 */
import type { DatabaseConnection, Repository } from '@nocobase/db';

import { AGENT_TOOLS, type AgentTool } from '@nocobase/agent-protocol';

import type {
  Agent,
  AgentAccess,
  AgentModelEntry,
  AgentType,
} from '../../../shared/agents.js';
import type { I18nText } from '../../../shared/i18n.js';
import { jsonObject, stringArray } from '../../kernel/values.js';
import { attachedSkillIdsOf } from '../skills/skill.store.js';

const AGENTS = 'agAgents';
const AGENT_USERS = 'agAgentUsers';

export interface AgentRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly nameText: Readonly<Record<string, unknown>> | null;
  readonly descriptionText: Readonly<Record<string, unknown>> | null;
  readonly avatar: string | null;
  readonly type: string;
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
  readonly archivedAt: string | null;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface AgentUserRecord {
  readonly id: string;
  readonly agentId: string;
  readonly userId: string;
  readonly createdAt: string;
}

export function agentsRepo(conn: DatabaseConnection): Repository<AgentRecord> {
  return conn.repository<AgentRecord>(AGENTS);
}

function agentUsers(conn: DatabaseConnection): Repository<AgentUserRecord> {
  return conn.repository<AgentUserRecord>(AGENT_USERS);
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

/** The stored entries of an agent of `type`, dropping what does not fit it. */
export function entriesOf(type: AgentType, value: unknown): AgentModelEntry[] {
  let list: unknown = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list) as unknown;
    } catch {
      list = [];
    }
  }
  const entries: AgentModelEntry[] = [];
  for (const item of Array.isArray(list) ? (list as unknown[]) : []) {
    if (item === null || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;
    const model = text(raw.model);
    const effort = text(raw.effort);
    if (type === 'runner') {
      const tool = raw.tool;
      if (typeof tool === 'string' && AGENT_TOOLS.includes(tool as AgentTool))
        entries.push({ tool: tool as AgentTool, model, effort });
      continue;
    }
    const modelService = text(raw.modelService);
    if (modelService && model) entries.push({ modelService, model, effort });
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

export function toAgent(
  record: AgentRecord,
  userIds: readonly string[],
  skillIds: readonly string[],
): Agent {
  const toolPolicy =
    record.toolPolicy === null ? null : jsonObject(record.toolPolicy);
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    nameText: i18nTextOf(record.nameText),
    descriptionText: i18nTextOf(record.descriptionText),
    avatar: record.avatar,
    type: record.type as AgentType,
    modelEntries: entriesOf(record.type as AgentType, record.modelEntries),
    instructions: record.instructions,
    actions: stringArray(record.actions),
    confirmChanges: record.confirmChanges === 'always' ? 'always' : 'larger',
    access: record.access as AgentAccess,
    userIds,
    ownerUserId: record.ownerUserId,
    runnerIds: stringArray(record.runnerIds),
    skillIds,
    maxConcurrentRuns: Number(record.maxConcurrentRuns),
    maxAttempts: Number(record.maxAttempts),
    toolPolicy,
    archivedAt: record.archivedAt,
    revision: Number(record.revision),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function usersOf(
  conn: DatabaseConnection,
  agentIds: readonly string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (agentIds.length === 0) return result;
  const rows = await agentUsers(conn).findMany({
    filter: (f) => f.or(agentIds.map((id) => f.string('agentId').eq(id))),
    sort: (sort) => sort.field('createdAt').asc(),
  });
  for (const row of rows) {
    const list = result.get(row.agentId) ?? [];
    list.push(row.userId);
    result.set(row.agentId, list);
  }
  return result;
}

export async function findAgent(
  conn: DatabaseConnection,
  id: string,
): Promise<Agent | null> {
  const record = await agentsRepo(conn).findOne({ filter: { id } });
  if (!record) return null;
  return toAgent(
    record,
    (await usersOf(conn, [id])).get(id) ?? [],
    (await attachedSkillIdsOf(conn, 'agent', [id])).get(id) ?? [],
  );
}

export async function listAgents(
  conn: DatabaseConnection,
  includeArchived: boolean,
): Promise<Agent[]> {
  const records = await agentsRepo(conn).findMany({
    ...(includeArchived ? {} : { filter: (f) => f.date('archivedAt').empty() }),
    sort: (sort) => [sort.field('name').asc(), sort.field('id').asc()],
  });
  const ids = records.map((record) => record.id);
  const users = await usersOf(conn, ids);
  const skills = await attachedSkillIdsOf(conn, 'agent', ids);
  return records.map((record) =>
    toAgent(record, users.get(record.id) ?? [], skills.get(record.id) ?? []),
  );
}

export async function insertAgent(
  conn: DatabaseConnection,
  values: Omit<AgentRecord, 'lastClaimAt' | 'archivedAt' | 'revision'>,
): Promise<void> {
  await agentsRepo(conn).createOne({
    values: { ...values, lastClaimAt: null, archivedAt: null, revision: 1 },
  });
}

export async function updateAgent(
  conn: DatabaseConnection,
  id: string,
  values: Partial<Omit<AgentRecord, 'id' | 'createdAt'>>,
): Promise<void> {
  await agentsRepo(conn).updateMany({ filter: { id }, values });
}

/**
 * Writes a change to the agent's configuration made against `revision`, raising it by one. False, writing nothing,
 * when the agent is no longer at that revision.
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

export async function deleteAgent(
  conn: DatabaseConnection,
  id: string,
): Promise<void> {
  await agentUsers(conn).deleteMany({ filter: { agentId: id } });
  await conn
    .repository('agAgentChanges')
    .deleteMany({ filter: { agentId: id } });
  await agentsRepo(conn).deleteMany({ filter: { id } });
}

export async function replaceUsers(
  conn: DatabaseConnection,
  agentId: string,
  userIds: readonly string[],
  ids: () => string,
  now: string,
): Promise<void> {
  await agentUsers(conn).deleteMany({ filter: { agentId } });
  for (const userId of userIds)
    await agentUsers(conn).createOne({
      values: { id: ids(), agentId, userId, createdAt: now },
    });
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
