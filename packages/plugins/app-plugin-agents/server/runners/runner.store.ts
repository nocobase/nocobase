/**
 * The runner collections: `agRunners`, their keys (`agRunnerCredentials`) and the one-time registration tokens
 * (`agRegistrationTokens`). Only this file reads or writes them.
 */
import {
  AGENT_TOOLS,
  RunnerPolicySchema,
  type AgentTool,
  type RunnerFeature,
  type RunnerPolicy,
  type ToolInfo,
} from '@nocobase/agent-protocol';
import type { DatabaseConnection, Repository } from '@nocobase/db';

import type {
  Runner,
  RunnerStatus,
  RunnerTrust,
} from '../../shared/runners.js';
import { jsonObject, stringArray } from '../kernel/values.js';

export interface RunnerRecord {
  readonly id: string;
  readonly name: string;
  readonly hostname: string;
  readonly os: string;
  readonly arch: string;
  readonly version: string;
  readonly product: string | null;
  readonly protocolVersion: number;
  readonly features: readonly unknown[];
  readonly tools: readonly unknown[];
  readonly enabledTools: readonly unknown[] | null;
  readonly trust: RunnerTrust;
  readonly ownerUserId: string | null;
  readonly status: RunnerStatus;
  readonly slots: number;
  readonly acceptJobs: boolean;
  readonly policy: unknown;
  readonly lastSeenAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CredentialRecord {
  readonly id: string;
  readonly runnerId: string;
  readonly keyHash: string;
  readonly keyPrefix: string;
  readonly revokedAt: string | null;
  readonly lastUsedAt: string | null;
  readonly createdAt: string;
}

export interface RegistrationTokenRecord {
  readonly id: string;
  readonly tokenHash: string;
  readonly createdById: string | null;
  readonly trust: RunnerTrust;
  readonly enabledTools: readonly unknown[] | null;
  readonly slots: number | null;
  readonly expiresAt: string;
  readonly usedAt: string | null;
  readonly runnerId: string | null;
  readonly createdAt: string;
}

export function runnersRepo(
  conn: DatabaseConnection,
): Repository<RunnerRecord> {
  return conn.repository<RunnerRecord>('agRunners');
}

export function credentialsRepo(
  conn: DatabaseConnection,
): Repository<CredentialRecord> {
  return conn.repository<CredentialRecord>('agRunnerCredentials');
}

export function registrationTokensRepo(
  conn: DatabaseConnection,
): Repository<RegistrationTokenRecord> {
  return conn.repository<RegistrationTokenRecord>('agRegistrationTokens');
}

function toolList(value: unknown): ToolInfo[] {
  const list = Array.isArray(value) ? (value as unknown[]) : [];
  return list.filter(
    (item): item is ToolInfo =>
      !!item &&
      typeof item === 'object' &&
      typeof (item as { kind?: unknown }).kind === 'string',
  );
}

/** A stored tool choice: null (every tool) stays null; otherwise the known tools in their canonical order. */
export function enabledToolList(value: unknown): AgentTool[] | null {
  if (value === null || value === undefined) return null;
  const list = Array.isArray(value) ? (value as unknown[]) : [];
  return AGENT_TOOLS.filter((tool) => list.includes(tool));
}

/** A tool choice as stored: every tool collapses to null, so a tool added to the protocol later is offered too. */
export function storedToolChoice(value: unknown): AgentTool[] | null {
  const list = enabledToolList(value);
  return list && list.length === AGENT_TOOLS.length ? null : list;
}

/** A reported policy as stored: null for none (the runner takes anything its owner registered it for). */
export function storedPolicy(value: unknown): RunnerPolicy | null {
  if (value === null || value === undefined) return null;
  const parsed = RunnerPolicySchema.safeParse(jsonObject(value));
  if (!parsed.success) return null;
  const policy = parsed.data;
  return policy.agents === undefined &&
    policy.subjects === undefined &&
    policy.repos === undefined
    ? null
    : policy;
}

export function toRunner(
  record: RunnerRecord,
  ownerName: string | null = null,
): Runner {
  return {
    id: record.id,
    name: record.name,
    hostname: record.hostname,
    os: record.os,
    arch: record.arch,
    version: record.version,
    product: record.product ?? null,
    protocolVersion: Number(record.protocolVersion),
    features: stringArray(record.features) as RunnerFeature[],
    tools: toolList(record.tools),
    enabledTools: enabledToolList(record.enabledTools),
    trust: record.trust,
    ownerUserId: record.ownerUserId,
    ownerName,
    status: record.status,
    slots: Number(record.slots),
    acceptJobs: Boolean(record.acceptJobs),
    policy: storedPolicy(record.policy),
    lastSeenAt: record.lastSeenAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function findRunner(
  conn: DatabaseConnection,
  id: string,
): Promise<Runner | null> {
  const record = await runnersRepo(conn).findOne({ filter: { id } });
  return record ? toRunner(record) : null;
}

/** Of `ids`, the runners that are not online (offline, revoked, or gone). */
export async function absentRunners(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<string[]> {
  if (ids.length === 0) return [];
  const online = await runnersRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.or(ids.map((id) => f.string('id').eq(id))),
        f.string('status').eq('online'),
      ]),
  });
  const present = new Set(online.map((runner) => runner.id));
  return ids.filter((id) => !present.has(id));
}
