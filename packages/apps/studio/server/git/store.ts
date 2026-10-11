/**
 * The rows of Studio's pull requests (`studioGitRepos`, `studioPullRequests`, `studioIssuePullRequests`,
 * `studioPullRequestSuggestions`, `studioGitWebhookDeliveries`). Every function takes the connection it runs on, so a caller can write in a
 * projects transaction (a merge and the issue moves it causes commit together).
 */
import { randomUUID } from 'node:crypto';

import type { DatabaseConnection } from '@nocobase/db';

import {
  DEFAULT_BRANCH_RULE,
  type GitCheck,
  type PullRequest,
  type PullRequestCiState,
  type PullRequestLinkedBy,
  type PullRequestState,
  type PullRequestSuggestion,
  type WebhookDelivery,
  type WebhookDeliveryReason,
  type WebhookDeliveryStatus,
} from '../../shared/git.js';
import type { PullRequestSnapshot } from './platform.js';

export const REPOS = 'studioGitRepos';
export const PULL_REQUESTS = 'studioPullRequests';
export const LINKS = 'studioIssuePullRequests';
export const SUGGESTIONS = 'studioPullRequestSuggestions';
export const DELIVERIES = 'studioGitWebhookDeliveries';

type Row = Record<string, unknown>;

const str = (value: unknown): string | null =>
  typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'bigint'
      ? String(value)
      : null;
const bool = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || value === 'true';
const iso = (value: unknown): string | null =>
  value == null || value === ''
    ? null
    : new Date(value as string).toISOString();
/** A JSON column as written (text) or read back parsed, depending on the dialect. */
export const json = (value: unknown): unknown =>
  typeof value === 'string' ? (JSON.parse(value) as unknown) : value;

export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  if (code === '23505') return true;
  if (typeof code === 'string' && code.startsWith('SQLITE_CONSTRAINT'))
    return /UNIQUE|PRIMARYKEY/u.test(code);
  return /unique constraint|UNIQUE constraint failed|Duplicate entry/iu.test(
    error.message,
  );
}

/** The pull requests some issue links. */
async function linkedIds(conn: DatabaseConnection): Promise<string[]> {
  const rows = await conn.query
    .selectFrom(LINKS)
    .select('pullRequestId')
    .distinct()
    .execute();
  return rows.map((row) => String(row.pullRequestId));
}

/** A working directory row's binding columns (`pmProjectResources`), or null when it links no repository. */
export function bindingOfRow(row: Row): {
  provider: string;
  connectionId: string;
  repoId: string;
  fullName: string;
} | null {
  const provider = str(row.bindingProvider);
  const connectionId = str(row.bindingConnectionId);
  const repoId = str(row.bindingRepoId);
  const fullName = str(row.bindingFullName);
  return provider && connectionId && repoId && fullName
    ? { provider, connectionId, repoId, fullName }
    : null;
}

// --- Repositories --------------------------------------------------------------------------------------------------

export interface RepoRow {
  readonly id: string;
  readonly provider: string;
  readonly apiBaseUrl: string;
  readonly repo: string;
  /** The connection Studio reaches it through; null for a repository only linked by a pull request's URL. */
  readonly connectionId: string | null;
  /** The host's id of the repository. */
  readonly externalId: string | null;
  /** In order; the first names the branches agents work on. */
  readonly branchRules: readonly string[];
  readonly wakeOnChecks: boolean;
  readonly wakeOnConflict: boolean;
  readonly listEtag: string | null;
  readonly polledAt: string | null;
  readonly pollError: string | null;
  readonly webhookSecretSealed: string | null;
  /** The last delivery that reached this repository's webhook, verified or not. */
  readonly lastDelivery: WebhookDelivery | null;
  readonly lastReceivedAt: string | null;
}

const DELIVERY_STATUSES: readonly WebhookDeliveryStatus[] = [
  'processed',
  'ignored',
  'invalidSignature',
  'failed',
];

function deliveryOf(row: Row): WebhookDelivery | null {
  const at = iso(row.webhookAt);
  const status = str(row.webhookStatus) as WebhookDeliveryStatus | null;
  if (!at || !status || !DELIVERY_STATUSES.includes(status)) return null;
  return {
    at,
    event: str(row.webhookEvent),
    status,
    reason: str(row.webhookReason) as WebhookDeliveryReason | null,
  };
}

/** A secret is set and the last delivery was verified: GitHub reaches Studio with the secret Studio holds. */
export function webhookHealthy(repo: RepoRow): boolean {
  return (
    !!repo.webhookSecretSealed &&
    !!repo.lastDelivery &&
    (repo.lastDelivery.status === 'processed' ||
      repo.lastDelivery.status === 'ignored')
  );
}

function rulesOf(value: unknown): string[] {
  const parsed = json(value);
  const rules = Array.isArray(parsed)
    ? parsed.filter((rule): rule is string => typeof rule === 'string')
    : [];
  return rules.length > 0 ? rules : [DEFAULT_BRANCH_RULE];
}

function repoOf(row: Row): RepoRow {
  return {
    id: str(row.id) ?? '',
    provider: str(row.provider) ?? 'github',
    apiBaseUrl: str(row.apiBaseUrl) ?? '',
    repo: str(row.repo) ?? '',
    connectionId: str(row.connectionId),
    externalId: str(row.externalId),
    branchRules: rulesOf(row.branchRules),
    wakeOnChecks: bool(row.wakeOnChecks),
    wakeOnConflict: bool(row.wakeOnConflict),
    listEtag: str(row.listEtag),
    polledAt: iso(row.polledAt),
    pollError: str(row.pollError),
    webhookSecretSealed: str(row.webhookSecretSealed),
    lastDelivery: deliveryOf(row),
    lastReceivedAt: iso(row.lastReceivedAt),
  };
}

export async function findRepo(
  conn: DatabaseConnection,
  apiBaseUrl: string,
  repo: string,
): Promise<RepoRow | null> {
  const row = await conn.query
    .selectFrom(REPOS)
    .selectAll()
    .where('apiBaseUrl', '=', apiBaseUrl)
    .where('repo', '=', repo)
    .executeTakeFirst();
  return row ? repoOf(row) : null;
}

export async function findRepoById(
  conn: DatabaseConnection,
  id: string,
): Promise<RepoRow | null> {
  const row = await conn.query
    .selectFrom(REPOS)
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
  return row ? repoOf(row) : null;
}

/** The repository's row, created on first use. */
export async function ensureRepo(
  conn: DatabaseConnection,
  apiBaseUrl: string,
  repo: string,
): Promise<RepoRow> {
  const found = await findRepo(conn, apiBaseUrl, repo);
  if (found) return found;
  const now = new Date();
  try {
    await conn.transaction(async (inner) => {
      await inner.query
        .insertInto(REPOS)
        .values({
          id: randomUUID(),
          provider: 'github',
          apiBaseUrl,
          repo,
          connectionId: null,
          externalId: null,
          branchRules: null,
          wakeOnChecks: true,
          wakeOnConflict: true,
          listEtag: null,
          polledAt: null,
          pollError: null,
          webhookSecretSealed: null,
          webhookAt: null,
          webhookEvent: null,
          webhookStatus: null,
          webhookReason: null,
          updatedById: null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }
  return (await findRepo(conn, apiBaseUrl, repo)) as RepoRow;
}

export async function updateRepo(
  conn: DatabaseConnection,
  id: string,
  values: Readonly<Record<string, unknown>>,
): Promise<void> {
  await conn.query
    .updateTable(REPOS)
    .set({
      ...values,
      ...(values.branchRules !== undefined
        ? { branchRules: JSON.stringify(values.branchRules) }
        : {}),
      updatedAt: new Date(),
    })
    .where('id', '=', id)
    .execute();
}

/**
 * The repositories to poll: those reached through a connection, and those with a linked pull request still open (a
 * public one read without a credential).
 */
export async function reposToPoll(
  conn: DatabaseConnection,
): Promise<RepoRow[]> {
  const withToken = await conn.query
    .selectFrom(REPOS)
    .selectAll()
    .where('connectionId', 'is not', null)
    .execute();
  const linked = await linkedIds(conn);
  const open =
    linked.length === 0
      ? []
      : await conn.query
          .selectFrom(PULL_REQUESTS)
          .select('repoId')
          .where('state', '=', 'open')
          .where('id', 'in', linked)
          .distinct()
          .execute();
  const ids = new Set(withToken.map((row) => String(row.id)));
  const extra = open
    .map((row) => String(row.repoId))
    .filter((id) => !ids.has(id));
  const more =
    extra.length === 0
      ? []
      : await conn.query
          .selectFrom(REPOS)
          .selectAll()
          .where('id', 'in', extra)
          .execute();
  // A demo connection's repositories exist only in Studio: nothing reads them from a host.
  const demo = new Set(
    (
      await conn.query
        .selectFrom('studioGitConnections')
        .select('id')
        .where('demo', '=', true)
        .execute()
    ).map((row) => String(row.id)),
  );
  return [...withToken, ...more]
    .map((row) => repoOf(row))
    .filter((repo) => !repo.connectionId || !demo.has(repo.connectionId));
}

// --- Pull requests -------------------------------------------------------------------------------------------------

export interface SignalState {
  /** `<kind>@<headSha>` of the signal last reported. */
  readonly key: string;
  /** How many heads in a row it was reported for. */
  readonly count: number;
}

export type Signals = Readonly<
  Partial<Record<'checks' | 'conflict', SignalState>>
>;

export interface PullRequestRow {
  readonly id: string;
  readonly repoId: string;
  readonly repo: string;
  readonly number: number;
  readonly url: string;
  readonly title: string;
  readonly state: PullRequestState;
  readonly draft: boolean;
  readonly headRef: string;
  readonly baseRef: string;
  readonly headSha: string;
  readonly authorLogin: string;
  readonly mergeableState: string | null;
  readonly ciState: PullRequestCiState | null;
  readonly checks: readonly GitCheck[];
  readonly mergedAt: string | null;
  readonly mergedByLogin: string | null;
  readonly mergedByUserId: string | null;
  readonly mergedManually: boolean;
  /** The commit the merge made on the base branch, when known. */
  readonly mergeCommitSha: string | null;
  readonly closedAt: string | null;
  readonly pullEtag: string | null;
  readonly statusEtag: string | null;
  readonly runsEtag: string | null;
  readonly signals: Signals;
  readonly snapshotAt: string | null;
}

function stateOf(value: unknown): PullRequestState {
  return value === 'closed' || value === 'merged' ? value : 'open';
}

function ciOf(value: unknown): PullRequestCiState | null {
  return value === 'pending' || value === 'success' || value === 'failure'
    ? value
    : null;
}

function signalsOf(value: unknown): Signals {
  const parsed = json(value);
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function checksOf(value: unknown): GitCheck[] {
  const parsed = json(value);
  return Array.isArray(parsed) ? (parsed as GitCheck[]) : [];
}

function pullRequestOf(row: Row, repo: string): PullRequestRow {
  return {
    id: str(row.id) ?? '',
    repoId: str(row.repoId) ?? '',
    repo,
    number: Number(row.number),
    url: str(row.url) ?? '',
    title: str(row.title) ?? '',
    state: stateOf(row.state),
    draft: bool(row.draft),
    headRef: str(row.headRef) ?? '',
    baseRef: str(row.baseRef) ?? '',
    headSha: str(row.headSha) ?? '',
    authorLogin: str(row.authorLogin) ?? '',
    mergeableState: str(row.mergeableState),
    ciState: ciOf(row.ciState),
    checks: checksOf(row.checks),
    mergedAt: iso(row.mergedAt),
    mergedByLogin: str(row.mergedByLogin),
    mergedByUserId: str(row.mergedByUserId),
    mergedManually: bool(row.mergedManually),
    mergeCommitSha: str(row.mergeCommitSha),
    closedAt: iso(row.closedAt),
    pullEtag: str(row.pullEtag),
    statusEtag: str(row.statusEtag),
    runsEtag: str(row.runsEtag),
    signals: signalsOf(row.signals),
    snapshotAt: iso(row.snapshotAt),
  };
}

async function withRepos(
  conn: DatabaseConnection,
  rows: readonly Row[],
): Promise<PullRequestRow[]> {
  const ids = [...new Set(rows.map((row) => String(row.repoId)))];
  const repos =
    ids.length === 0
      ? []
      : await conn.query
          .selectFrom(REPOS)
          .select(['id', 'repo'])
          .where('id', 'in', ids)
          .execute();
  const names = new Map(repos.map((row) => [String(row.id), String(row.repo)]));
  return rows.map((row) =>
    pullRequestOf(row, names.get(String(row.repoId)) ?? ''),
  );
}

export async function findPullRequest(
  conn: DatabaseConnection,
  repoId: string,
  number: number,
): Promise<PullRequestRow | null> {
  const row = await conn.query
    .selectFrom(PULL_REQUESTS)
    .selectAll()
    .where('repoId', '=', repoId)
    .where('number', '=', number)
    .executeTakeFirst();
  return row ? ((await withRepos(conn, [row]))[0] ?? null) : null;
}

export async function findPullRequestById(
  conn: DatabaseConnection,
  id: string,
): Promise<PullRequestRow | null> {
  const row = await conn.query
    .selectFrom(PULL_REQUESTS)
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
  return row ? ((await withRepos(conn, [row]))[0] ?? null) : null;
}

/** The open pull requests of a repository that some issue links. */
export async function linkedOpenPullRequests(
  conn: DatabaseConnection,
  repoId: string,
): Promise<PullRequestRow[]> {
  const linked = await linkedIds(conn);
  if (linked.length === 0) return [];
  const rows = await conn.query
    .selectFrom(PULL_REQUESTS)
    .selectAll()
    .where('repoId', '=', repoId)
    .where('state', '=', 'open')
    .where('id', 'in', linked)
    .execute();
  return withRepos(conn, rows);
}

/** Every open pull request Studio keeps of a repository, linked or not (a repository whose previews are on). */
export async function openPullRequestsOf(
  conn: DatabaseConnection,
  repoId: string,
): Promise<PullRequestRow[]> {
  const rows = await conn.query
    .selectFrom(PULL_REQUESTS)
    .selectAll()
    .where('repoId', '=', repoId)
    .where('state', '=', 'open')
    .execute();
  return withRepos(conn, rows);
}

/**
 * Inserts or refreshes a pull request from a snapshot; answers it with the row it replaced. A row a person marked
 * merged stays merged whatever GitHub says until GitHub says merged too.
 */
export async function upsertPullRequest(
  conn: DatabaseConnection,
  repoId: string,
  snapshot: PullRequestSnapshot,
  extra: Readonly<Record<string, unknown>> = {},
): Promise<{ pr: PullRequestRow; previous: PullRequestRow | null }> {
  const previous = await findPullRequest(conn, repoId, snapshot.number);
  const keepMerged =
    previous?.state === 'merged' &&
    previous.mergedManually &&
    snapshot.state !== 'merged';
  const headMoved =
    !!previous && !!snapshot.headSha && previous.headSha !== snapshot.headSha;
  const now = new Date();
  const values = {
    url: snapshot.url,
    title: snapshot.title,
    draft: snapshot.draft,
    headRef: snapshot.headRef,
    baseRef: snapshot.baseRef,
    headSha: snapshot.headSha,
    authorLogin: snapshot.authorLogin,
    mergeableState: snapshot.mergeableState,
    ...(keepMerged
      ? {}
      : {
          state: snapshot.state,
          mergedAt: snapshot.mergedAt ? new Date(snapshot.mergedAt) : null,
          mergedByLogin: snapshot.mergedByLogin,
          // A read without it (a 304 refill, Studio's own fallback) keeps the one already known.
          mergeCommitSha:
            snapshot.state === 'merged'
              ? (snapshot.mergeCommitSha ?? previous?.mergeCommitSha ?? null)
              : null,
          closedAt: snapshot.closedAt ? new Date(snapshot.closedAt) : null,
        }),
    // The CI of the old head no longer applies.
    ...(headMoved
      ? { ciState: null, checks: null, statusEtag: null, runsEtag: null }
      : {}),
    snapshotAt: now,
    updatedAt: now,
    ...extra,
    ...(extra.checks !== undefined
      ? { checks: JSON.stringify(extra.checks) }
      : {}),
  };
  if (previous) {
    await conn.query
      .updateTable(PULL_REQUESTS)
      .set(values)
      .where('id', '=', previous.id)
      .execute();
  } else {
    try {
      await conn.transaction(async (inner) => {
        await inner.query
          .insertInto(PULL_REQUESTS)
          .values({
            id: randomUUID(),
            repoId,
            number: snapshot.number,
            ciState: null,
            checks: null,
            mergedByUserId: null,
            mergedManually: false,
            pullEtag: null,
            statusEtag: null,
            runsEtag: null,
            signals: null,
            mergeCheckAfter: null,
            mergeCheckAttempts: 0,
            createdAt: now,
            state: snapshot.state,
            mergedAt: snapshot.mergedAt ? new Date(snapshot.mergedAt) : null,
            mergedByLogin: snapshot.mergedByLogin,
            mergeCommitSha:
              snapshot.state === 'merged' ? snapshot.mergeCommitSha : null,
            closedAt: snapshot.closedAt ? new Date(snapshot.closedAt) : null,
            ...values,
          })
          .execute();
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      return upsertPullRequest(conn, repoId, snapshot, extra);
    }
  }
  return {
    pr: (await findPullRequest(
      conn,
      repoId,
      snapshot.number,
    )) as PullRequestRow,
    previous,
  };
}

export async function updatePullRequest(
  conn: DatabaseConnection,
  id: string,
  values: Readonly<Record<string, unknown>>,
): Promise<void> {
  await conn.query
    .updateTable(PULL_REQUESTS)
    .set({
      ...values,
      ...(values.signals !== undefined
        ? { signals: JSON.stringify(values.signals) }
        : {}),
      ...(values.checks !== undefined
        ? { checks: JSON.stringify(values.checks) }
        : {}),
      updatedAt: new Date(),
    })
    .where('id', '=', id)
    .execute();
}

/** The open pull requests of a repository that some issue links, at a head commit (a check or status reported on it). */
export async function linkedOpenAtHead(
  conn: DatabaseConnection,
  repoId: string,
  headSha: string,
): Promise<PullRequestRow[]> {
  return (await linkedOpenPullRequests(conn, repoId)).filter(
    (pr) => pr.headSha === headSha,
  );
}

// --- Merge checks --------------------------------------------------------------------------------------------------

/**
 * Asks for a merge check of the linked, open, ready pull requests: the one named, or those of a repository based on a
 * branch (a push to it). Answers how many.
 */
export async function scheduleMergeChecks(
  conn: DatabaseConnection,
  target:
    | { readonly pullRequestId: string }
    | { readonly repoId: string; readonly baseRef: string },
  after: Date,
): Promise<number> {
  const linked = await linkedIds(conn);
  if (linked.length === 0) return 0;
  let query = conn.query
    .selectFrom(PULL_REQUESTS)
    .select('id')
    .where('state', '=', 'open')
    .where('draft', '=', false)
    .where('id', 'in', linked);
  query =
    'pullRequestId' in target
      ? query.where('id', '=', target.pullRequestId)
      : query
          .where('repoId', '=', target.repoId)
          .where('baseRef', '=', target.baseRef);
  const ids = (await query.execute()).map((row) => String(row.id));
  if (ids.length === 0) return 0;
  await conn.query
    .updateTable(PULL_REQUESTS)
    .set({ mergeCheckAfter: after, mergeCheckAttempts: 0 })
    .where('id', 'in', ids)
    .execute();
  return ids.length;
}

/** The merge checks due at `at`, the oldest first. */
export async function dueMergeChecks(
  conn: DatabaseConnection,
  at: Date,
  limit: number,
): Promise<{ pr: PullRequestRow; attempts: number }[]> {
  const rows = await conn.query
    .selectFrom(PULL_REQUESTS)
    .selectAll()
    .where('mergeCheckAfter', 'is not', null)
    .where('mergeCheckAfter', '<=', at.toISOString())
    .orderBy('mergeCheckAfter', 'asc')
    .limit(limit)
    .execute();
  const prs = await withRepos(conn, rows);
  return prs.map((pr, index) => ({
    pr,
    attempts: Number(rows[index]?.mergeCheckAttempts ?? 0),
  }));
}

/** The next merge check of a pull request, or none. */
export async function setMergeCheck(
  conn: DatabaseConnection,
  id: string,
  after: Date | null,
  attempts: number,
): Promise<void> {
  await conn.query
    .updateTable(PULL_REQUESTS)
    .set({ mergeCheckAfter: after, mergeCheckAttempts: attempts })
    .where('id', '=', id)
    .execute();
}

// --- Webhook deliveries --------------------------------------------------------------------------------------------

/** Records a delivery; false when the repository took it already. */
export async function recordDelivery(
  conn: DatabaseConnection,
  input: {
    readonly repoId: string;
    readonly deliveryId: string;
    readonly event: string | null;
  },
): Promise<boolean> {
  try {
    await conn.transaction(async (inner) => {
      await inner.query
        .insertInto(DELIVERIES)
        .values({
          id: randomUUID(),
          repoId: input.repoId,
          deliveryId: input.deliveryId.slice(0, 128),
          event: input.event?.slice(0, 64) ?? null,
          receivedAt: new Date(),
        })
        .execute();
    });
    return true;
  } catch (error) {
    if (isUniqueViolation(error)) return false;
    throw error;
  }
}

/** Forgets a delivery Studio failed to process, so GitHub may redeliver it. */
export async function forgetDelivery(
  conn: DatabaseConnection,
  repoId: string,
  deliveryId: string,
): Promise<void> {
  await conn.query
    .deleteFrom(DELIVERIES)
    .where('repoId', '=', repoId)
    .where('deliveryId', '=', deliveryId.slice(0, 128))
    .execute();
}

/** Removes the deliveries received before `before`. */
export async function purgeDeliveries(
  conn: DatabaseConnection,
  before: Date,
): Promise<void> {
  await conn.query
    .deleteFrom(DELIVERIES)
    .where('receivedAt', '<', before.toISOString())
    .execute();
}

// --- Links ---------------------------------------------------------------------------------------------------------

export interface LinkRow {
  readonly id: string;
  readonly issueId: string;
  readonly pullRequestId: string;
  readonly linkedByType: PullRequestLinkedBy;
  readonly linkedById: string | null;
  readonly autoCompleteDisabled: boolean;
  readonly createdAt: string;
}

function linkOf(row: Row): LinkRow {
  const type = str(row.linkedByType);
  return {
    id: str(row.id) ?? '',
    issueId: str(row.issueId) ?? '',
    pullRequestId: str(row.pullRequestId) ?? '',
    linkedByType: type === 'user' || type === 'agent' ? type : 'system',
    linkedById: str(row.linkedById),
    autoCompleteDisabled: bool(row.autoCompleteDisabled),
    createdAt: iso(row.createdAt) ?? '',
  };
}

/** Links a pull request to an issue; answers whether the link is new. */
export async function insertLink(
  conn: DatabaseConnection,
  input: {
    readonly issueId: string;
    readonly pullRequestId: string;
    readonly linkedByType: PullRequestLinkedBy;
    readonly linkedById: string | null;
  },
): Promise<boolean> {
  const exists = await conn.query
    .selectFrom(LINKS)
    .select('id')
    .where('issueId', '=', input.issueId)
    .where('pullRequestId', '=', input.pullRequestId)
    .executeTakeFirst();
  if (exists) return false;
  try {
    await conn.transaction(async (inner) => {
      await inner.query
        .insertInto(LINKS)
        .values({
          id: randomUUID(),
          ...input,
          autoCompleteDisabled: false,
          createdAt: new Date(),
        })
        .execute();
    });
  } catch (error) {
    if (isUniqueViolation(error)) return false;
    throw error;
  }
  return true;
}

export async function deleteLink(
  conn: DatabaseConnection,
  issueId: string,
  pullRequestId: string,
): Promise<boolean> {
  const link = await findLink(conn, issueId, pullRequestId);
  if (!link) return false;
  await conn.query.deleteFrom(LINKS).where('id', '=', link.id).execute();
  return true;
}

export async function findLink(
  conn: DatabaseConnection,
  issueId: string,
  pullRequestId: string,
): Promise<LinkRow | null> {
  const row = await conn.query
    .selectFrom(LINKS)
    .selectAll()
    .where('issueId', '=', issueId)
    .where('pullRequestId', '=', pullRequestId)
    .executeTakeFirst();
  return row ? linkOf(row) : null;
}

export async function setAutoComplete(
  conn: DatabaseConnection,
  linkId: string,
  disabled: boolean,
): Promise<void> {
  await conn.query
    .updateTable(LINKS)
    .set({ autoCompleteDisabled: disabled })
    .where('id', '=', linkId)
    .execute();
}

export async function linksOfPullRequest(
  conn: DatabaseConnection,
  pullRequestId: string,
): Promise<LinkRow[]> {
  const rows = await conn.query
    .selectFrom(LINKS)
    .selectAll()
    .where('pullRequestId', '=', pullRequestId)
    .execute();
  return rows.map((row) => linkOf(row));
}

/** An issue's links with their pull requests, oldest link first. */
export async function pullRequestsOfIssue(
  conn: DatabaseConnection,
  issueId: string,
): Promise<{ link: LinkRow; pr: PullRequestRow }[]> {
  return (await pullRequestsOfIssues(conn, [issueId])).get(issueId) ?? [];
}

export async function pullRequestsOfIssues(
  conn: DatabaseConnection,
  issueIds: readonly string[],
): Promise<Map<string, { link: LinkRow; pr: PullRequestRow }[]>> {
  const result = new Map<string, { link: LinkRow; pr: PullRequestRow }[]>();
  if (issueIds.length === 0) return result;
  const links = (
    await conn.query
      .selectFrom(LINKS)
      .selectAll()
      .where('issueId', 'in', [...new Set(issueIds)])
      .orderBy('createdAt', 'asc')
      .orderBy('id', 'asc')
      .execute()
  ).map((row) => linkOf(row));
  const prIds = [...new Set(links.map((link) => link.pullRequestId))];
  if (prIds.length === 0) return result;
  const prs = await withRepos(
    conn,
    await conn.query
      .selectFrom(PULL_REQUESTS)
      .selectAll()
      .where('id', 'in', prIds)
      .execute(),
  );
  const byId = new Map(prs.map((pr) => [pr.id, pr]));
  for (const link of links) {
    const pr = byId.get(link.pullRequestId);
    if (!pr) continue;
    const list = result.get(link.issueId) ?? [];
    list.push({ link, pr });
    result.set(link.issueId, list);
  }
  return result;
}

// --- Suggestions ---------------------------------------------------------------------------------------------------

/** Suggests the pull request to the issue, unless it was suggested (or dismissed) already; answers whether it is new. */
export async function insertSuggestion(
  conn: DatabaseConnection,
  issueId: string,
  pullRequestId: string,
): Promise<boolean> {
  const exists = await conn.query
    .selectFrom(SUGGESTIONS)
    .select('id')
    .where('issueId', '=', issueId)
    .where('pullRequestId', '=', pullRequestId)
    .executeTakeFirst();
  if (exists) return false;
  try {
    await conn.transaction(async (inner) => {
      await inner.query
        .insertInto(SUGGESTIONS)
        .values({
          id: randomUUID(),
          issueId,
          pullRequestId,
          dismissedAt: null,
          createdAt: new Date(),
        })
        .execute();
    });
  } catch (error) {
    if (isUniqueViolation(error)) return false;
    throw error;
  }
  return true;
}

/** Dismisses a suggestion; answers whether there was one. */
export async function dismissSuggestion(
  conn: DatabaseConnection,
  issueId: string,
  pullRequestId: string,
): Promise<boolean> {
  const open = await conn.query
    .selectFrom(SUGGESTIONS)
    .select('id')
    .where('issueId', '=', issueId)
    .where('pullRequestId', '=', pullRequestId)
    .where('dismissedAt', 'is', null)
    .executeTakeFirst();
  if (!open) return false;
  await conn.query
    .updateTable(SUGGESTIONS)
    .set({ dismissedAt: new Date() })
    .where('id', '=', String(open.id))
    .execute();
  return true;
}

/** The issue's open suggestions that are not linked, oldest first. */
export async function suggestionsOfIssue(
  conn: DatabaseConnection,
  issueId: string,
): Promise<PullRequestSuggestion[]> {
  const rows = await conn.query
    .selectFrom(SUGGESTIONS)
    .select(['pullRequestId'])
    .where('issueId', '=', issueId)
    .where('dismissedAt', 'is', null)
    .orderBy('createdAt', 'asc')
    .execute();
  const ids = rows.map((row) => String(row.pullRequestId));
  if (ids.length === 0) return [];
  const linked = new Set(
    (
      await conn.query
        .selectFrom(LINKS)
        .select('pullRequestId')
        .where('issueId', '=', issueId)
        .execute()
    ).map((row) => String(row.pullRequestId)),
  );
  const prs = await withRepos(
    conn,
    await conn.query
      .selectFrom(PULL_REQUESTS)
      .selectAll()
      .where('id', 'in', ids)
      .execute(),
  );
  const byId = new Map(prs.map((pr) => [pr.id, pr]));
  return ids.flatMap((id) => {
    const pr = byId.get(id);
    if (!pr || linked.has(id) || pr.state !== 'open') return [];
    return [
      {
        pullRequestId: pr.id,
        repo: pr.repo,
        number: pr.number,
        url: pr.url,
        title: pr.title,
        state: pr.state,
      },
    ];
  });
}

/** As the browser sees it. */
export function pullRequestView(
  pr: PullRequestRow,
  mergedByName: string | null,
): PullRequest {
  return {
    id: pr.id,
    repo: pr.repo,
    number: pr.number,
    url: pr.url,
    title: pr.title,
    state: pr.state,
    draft: pr.draft,
    headRef: pr.headRef,
    baseRef: pr.baseRef,
    headSha: pr.headSha,
    mergeCommitSha: pr.mergeCommitSha,
    authorLogin: pr.authorLogin,
    mergeableState: pr.mergeableState,
    ciState: pr.ciState,
    checks: pr.checks,
    mergedAt: pr.mergedAt,
    mergedBy:
      pr.state === 'merged' && (pr.mergedByUserId || pr.mergedByLogin)
        ? {
            userId: pr.mergedByUserId,
            name: mergedByName,
            login: pr.mergedByLogin,
          }
        : null,
    mergedManually: pr.mergedManually,
    closedAt: pr.closedAt,
    snapshotAt: pr.snapshotAt,
  };
}
