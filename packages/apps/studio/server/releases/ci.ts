/**
 * A repository's CI choice and setup (`studioRepoCi`, `shared/releases.ts`): whether Studio was asked to set the
 * repository's CI up by itself, and where that stands. The setup itself is `../builds/ci-setup.ts`, bound to links as a
 * `CiSetupHook`; turning the choice off leaves it `disabled`.
 */
import type { DatabaseConnection, Row } from '@nocobase/db';

import type { OrgApiKeyManager } from '../../shared/access.js';
import { parseCiFailure, type CiFailure } from '../../shared/ci-modes.js';
import {
  CI_STATES,
  type CiState,
  type RepositoryCi,
} from '../../shared/releases.js';

export const REPO_CI = 'studioRepoCi';

/**
 * Sets a repository's CI up, or keeps it in step, after its "Deploy & previews" or its Apps were saved while Studio is
 * asked to set it up, as the person who saved them. Never throws: a failure is recorded on the repository.
 */
export type CiSetupHook = (input: {
  readonly resourceId: string;
  readonly userId: string;
}) => Promise<void>;

function stateOf(value: unknown): CiState {
  return (CI_STATES as readonly unknown[]).includes(value)
    ? (value as CiState)
    : 'manual';
}

/** SQLite answers booleans as 0 and 1. */
const flag = (value: unknown): boolean => value === true || value === 1;

export async function ciOf(
  conn: DatabaseConnection,
  resourceId: string,
): Promise<RepositoryCi | null> {
  const row = await conn.query
    .selectFrom(REPO_CI)
    .select(['auto', 'state'])
    .where('resourceId', '=', resourceId)
    .executeTakeFirst<Row>();
  return row ? { auto: flag(row.auto), state: stateOf(row.state) } : null;
}

/**
 * Records the choice: off is `disabled`; on keeps a setup already under way, and is `manual` otherwise.
 */
export async function recordCiChoice(
  conn: DatabaseConnection,
  input: {
    readonly resourceId: string;
    readonly auto: boolean;
    readonly userId: string;
    readonly now: Date;
  },
): Promise<RepositoryCi> {
  const current = await ciOf(conn, input.resourceId);
  const state: CiState = !input.auto
    ? 'disabled'
    : current && current.state !== 'disabled'
      ? current.state
      : 'manual';
  if (current)
    await conn.query
      .updateTable(REPO_CI)
      .set({ auto: input.auto, state, updatedAt: input.now })
      .where('resourceId', '=', input.resourceId)
      .execute();
  else
    await conn.query
      .insertInto(REPO_CI)
      .values({
        resourceId: input.resourceId,
        auto: input.auto,
        state,
        createdBy: input.userId,
        createdAt: input.now,
        updatedAt: input.now,
      })
      .execute();
  return { auto: input.auto, state };
}

/** A repository's CI row as the automatic setup reads it. */
export interface RepoCiRow extends RepositoryCi {
  readonly resourceId: string;
  readonly keyIdentityId: string | null;
  readonly secretName: string;
  /** The workflow files Studio wrote, one per application (`../builds/ci-workflow.ts`). */
  readonly workflowPaths: readonly string[];
  readonly pullRequestNumber: number | null;
  readonly pullRequestUrl: string | null;
  readonly workflowSha: string | null;
  readonly lastRotatedAt: string | null;
  readonly lastError: string | null;
  /** The same failure by its reason (`CiFailure`); null for none, or one recorded before reasons were. */
  readonly lastFailure: CiFailure | null;
  /** Who first made the choice: the setup of a repository Studio created runs as them. */
  readonly createdBy: string | null;
}

/** The columns `updateRepoCi` writes. */
export type RepoCiChanges = Partial<
  Omit<RepoCiRow, 'resourceId' | 'createdBy' | 'lastRotatedAt'> & {
    readonly lastRotatedAt: Date | null;
  }
>;

const textOf = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

function isoOf(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const date =
    value instanceof Date
      ? value
      : new Date(
          typeof value === 'string' && /^\d+$/u.test(value)
            ? Number(value)
            : (value as string | number),
        );
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** A JSON list of paths, as the column holds it; null when there is none. */
function pathsOf(value: unknown): string[] | null {
  let parsed: unknown = value;
  if (typeof value === 'string')
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  return Array.isArray(parsed) &&
    parsed.length > 0 &&
    parsed.every((item) => typeof item === 'string')
    ? parsed
    : null;
}

export function decodeRepoCi(row: Row): RepoCiRow {
  const number = Number(row.pullRequestNumber);
  return {
    resourceId: String(row.resourceId),
    auto: flag(row.auto),
    state: stateOf(row.state),
    keyIdentityId: textOf(row.keyIdentityId),
    secretName: textOf(row.secretName) ?? 'NB_STUDIO_API_KEY',
    workflowPaths: pathsOf(row.workflowPaths) ?? [
      textOf(row.workflowPath) ?? '.github/workflows/nb-studio.yml',
    ],
    pullRequestNumber:
      row.pullRequestNumber === null ||
      row.pullRequestNumber === undefined ||
      !Number.isFinite(number)
        ? null
        : number,
    pullRequestUrl: textOf(row.pullRequestUrl),
    workflowSha: textOf(row.workflowSha),
    lastRotatedAt: isoOf(row.lastRotatedAt),
    lastError: textOf(row.lastError),
    lastFailure: parseCiFailure(row.lastFailure),
    createdBy: textOf(row.createdBy),
  };
}

export async function repoCiRow(
  conn: DatabaseConnection,
  resourceId: string,
): Promise<RepoCiRow | null> {
  const row = await conn.query
    .selectFrom(REPO_CI)
    .selectAll()
    .where('resourceId', '=', resourceId)
    .executeTakeFirst<Row>();
  return row ? decodeRepoCi(row) : null;
}

/** The repository whose CI uses the key `identityId`, or null. */
export async function repoCiOfKey(
  conn: DatabaseConnection,
  identityId: string,
): Promise<RepoCiRow | null> {
  const row = await conn.query
    .selectFrom(REPO_CI)
    .selectAll()
    .where('keyIdentityId', '=', identityId)
    .executeTakeFirst<Row>();
  return row ? decodeRepoCi(row) : null;
}

/** Every repository whose CI Studio holds a key for. */
export async function repoCisWithKeys(
  conn: DatabaseConnection,
): Promise<RepoCiRow[]> {
  const rows = await conn.query
    .selectFrom(REPO_CI)
    .selectAll()
    .where('keyIdentityId', 'is not', null)
    .execute<Row>();
  return rows.map(decodeRepoCi);
}

export async function updateRepoCi(
  conn: DatabaseConnection,
  resourceId: string,
  values: RepoCiChanges,
  now: Date,
): Promise<void> {
  const { workflowPaths, lastFailure, ...rest } = values;
  await conn.query
    .updateTable(REPO_CI)
    .set({
      ...rest,
      // A failure's reason goes with its words: writing `lastError` alone clears it.
      ...(lastFailure !== undefined || 'lastError' in values
        ? { lastFailure: lastFailure ? JSON.stringify(lastFailure) : null }
        : {}),
      // The first stays in `workflowPath` too, for what reads only one.
      ...(workflowPaths
        ? {
            workflowPaths: JSON.stringify(workflowPaths),
            workflowPath: workflowPaths[0] ?? null,
          }
        : {}),
      updatedAt: now,
    })
    .where('resourceId', '=', resourceId)
    .execute();
}

/** The repositories the keys among `ids` are managed for, by key (`OrgApiKey.managedBy`). */
export async function managedKeys(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<Map<string, OrgApiKeyManager>> {
  if (ids.length === 0) return new Map();
  const rows = await conn.query
    .selectFrom(`${REPO_CI} as ci`)
    .innerJoin('pmProjectResources as resource', 'resource.id', 'ci.resourceId')
    .innerJoin('pmProjects as project', 'project.id', 'resource.projectId')
    .select([
      'ci.keyIdentityId as keyIdentityId',
      'ci.resourceId as resourceId',
      'project.id as projectId',
      'project.name as projectName',
      'resource.bindingFullName as repo',
    ])
    .where('ci.keyIdentityId', 'in', [...ids])
    .execute<Row>();
  return new Map(
    rows.map((row) => [
      String(row.keyIdentityId),
      {
        resourceId: String(row.resourceId),
        projectId: String(row.projectId),
        projectName: String(row.projectName),
        repo: textOf(row.repo),
      },
    ]),
  );
}
