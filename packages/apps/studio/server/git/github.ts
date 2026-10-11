/**
 * GitHub as Studio's git platform (`platform.ts`), over its REST and GraphQL APIs through `@octokit/core`
 * (`github-client.ts`, which also handles the rate limit); the only implementation. Reads are
 * conditional where GitHub supports it: each may carry the validator (`ETag`) of the last answer, and GitHub answers 304
 * without a body when nothing changed, which does not count against the rate limit.
 *
 * - Checks are a commit's statuses (`/status`) and its check runs (`/check-runs`), each listed with its name, status,
 *   conclusion and page. A check suite without runs never shows, as on GitHub's own pages.
 * - A GitHub App signs a JWT (RS256) with its private key to find an installation and mint installation tokens, both
 *   through `@octokit/auth-app`, which keeps the tokens in the app's cache (`AppCredentials.tokenCache`); a
 *   push credential is an installation token limited to some repositories and `contents: write`, used as the password
 *   of `x-access-token`.
 * - A person authorizes the app through its user-to-server OAuth web flow (`/login/oauth/authorize`) or its device
 *   flow (`/login/device/code`, when the app enables it), both through `@octokit/oauth-methods`, whose tokens expire and refresh when the app opts into
 *   expiring tokens; or pastes a personal access token, whose expiry GitHub reports in
 *   `GitHub-Authentication-Token-Expiration`.
 * - An app is created from a manifest (`buildAppManifest`): the browser posts it to `/settings/apps/new` (or an
 *   organization's), GitHub sends it back to Studio with a code, and `POST /app-manifests/{code}/conversions` answers the
 *   app's id, slug and credentials. GitHub has no manifest field for the device flow: it is turned on in the app's
 *   settings.
 * - Webhooks are signed with `X-Hub-Signature-256` (HMAC-SHA256 of the raw body, checked by
 *   `@octokit/webhooks-methods`) and normalized into `GitEvent`s.
 * - A file is written through the contents API (one commit per write), a branch through the git refs API, and an Actions
 *   secret is encrypted to the repository's public key as a libsodium sealed box (`sealed-box.ts`) before it is sent.
 *
 * Tokens travel only in the Authorization header (or the OAuth form) and never appear in errors.
 */
import { createAppAuth } from '@octokit/auth-app';
import {
  createDeviceCode,
  exchangeDeviceCode,
  exchangeWebFlowCode,
  refreshToken as refreshOAuthToken,
} from '@octokit/oauth-methods';
import { RequestError } from '@octokit/request-error';
import { verify } from '@octokit/webhooks-methods';

import {
  GIT_PROVIDER_DESCRIPTORS,
  type GitCheck,
  type PullRequestCiState,
} from '../../shared/git.js';
import {
  createGitHubClient,
  type Caller,
  type FetchLike,
  type Method,
} from './github-client.js';
import { excerptOfLog, linesOf } from './ci-logs.js';
import { apiBaseUrlOf } from './links.js';
import { sealedBox } from './sealed-box.js';
import {
  GitApiError,
  type AppCredentials,
  type AppManifestInput,
  type CheckAnnotation,
  type CheckEtags,
  type CreatedApp,
  type DevicePoll,
  type FailedCheck,
  type GitAuth,
  type GitPlatform,
  type OAuthTokens,
  type PullRequestRead,
  type PullRequestSnapshot,
  type RepoPermission,
  type RepoSummary,
  type WebhookParse,
  type Workflow,
  type WorkflowRun,
} from './platform.js';

export const GITHUB = 'github';

/**
 * `GitHub-Authentication-Token-Expiration` as an RFC 3339 time: GitHub writes `2026-11-04 12:00:00 UTC` (or with an
 * offset, `+0800`). Null when absent or unreadable.
 */
export function tokenExpirationOf(value: string | null): string | null {
  if (!value) return null;
  const match =
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})\s*(UTC|Z|[+-]\d{2}:?\d{2})?$/u.exec(
      value.trim(),
    );
  if (!match) return null;
  const zone =
    !match[3] || match[3] === 'UTC' || match[3] === 'Z'
      ? 'Z'
      : match[3].replace(/^([+-]\d{2})(\d{2})$/u, '$1:$2');
  const at = new Date(`${match[1]}T${match[2]}${zone}`);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

/** The fields Studio reads from a GitHub pull request object (REST answer and webhook payload alike). */
export interface GitHubPullRequestPayload {
  readonly number?: number;
  /** The GraphQL id: draft and ready for review are changed only through GraphQL. */
  readonly node_id?: string;
  readonly html_url?: string;
  readonly title?: string;
  readonly body?: string | null;
  readonly state?: string;
  readonly draft?: boolean;
  readonly merged?: boolean;
  readonly merged_at?: string | null;
  readonly merged_by?: { readonly login?: string } | null;
  /** The merge (or squash) commit once merged; before that, GitHub's test merge commit, which Studio ignores. */
  readonly merge_commit_sha?: string | null;
  readonly closed_at?: string | null;
  readonly head?: { readonly ref?: string; readonly sha?: string };
  readonly base?: { readonly ref?: string };
  readonly user?: { readonly login?: string };
  readonly mergeable_state?: string | null;
  /** False on a conflict, null while GitHub works it out; only in a pull request read on its own. */
  readonly mergeable?: boolean | null;
}

/** `state` + `merged` of a GitHub pull request → Studio's state. */
export function pullRequestStateOf(
  state: unknown,
  merged: unknown,
  mergedAt: unknown,
): PullRequestSnapshot['state'] {
  if (merged === true || (typeof mergedAt === 'string' && mergedAt))
    return 'merged';
  return state === 'closed' ? 'closed' : 'open';
}

export function snapshotFromPayload(
  payload: GitHubPullRequestPayload,
  repo: string,
  number: number,
): PullRequestSnapshot {
  const state = pullRequestStateOf(
    payload.state,
    payload.merged,
    payload.merged_at,
  );
  return {
    repo,
    number,
    url:
      typeof payload.html_url === 'string' && payload.html_url
        ? payload.html_url.slice(0, 500)
        : `https://github.com/${repo}/pull/${number}`,
    title: (payload.title ?? '').slice(0, 500),
    body: typeof payload.body === 'string' ? payload.body : null,
    state,
    draft: payload.draft === true,
    headRef: (payload.head?.ref ?? '').slice(0, 255),
    baseRef: (payload.base?.ref ?? '').slice(0, 255),
    headSha: (payload.head?.sha ?? '').slice(0, 64),
    authorLogin: (payload.user?.login ?? '').slice(0, 255),
    mergeableState:
      typeof payload.mergeable_state === 'string'
        ? payload.mergeable_state.slice(0, 32)
        : null,
    mergedAt: payload.merged_at ?? null,
    mergedByLogin:
      typeof payload.merged_by?.login === 'string'
        ? payload.merged_by.login.slice(0, 255)
        : null,
    mergeCommitSha:
      state === 'merged' &&
      typeof payload.merge_commit_sha === 'string' &&
      payload.merge_commit_sha
        ? payload.merge_commit_sha.slice(0, 64)
        : null,
    closedAt: payload.closed_at ?? null,
  };
}

/** GitHub's `mergeable` of a fresh read; worked out from `mergeable_state` when the answer lacks it. */
function mergeableOf(
  payload: GitHubPullRequestPayload,
  snapshot: PullRequestSnapshot,
): boolean | null {
  if (typeof payload.mergeable === 'boolean') return payload.mergeable;
  if (payload.mergeable === null) return null;
  if (snapshot.mergeableState === 'dirty') return false;
  return !snapshot.mergeableState || snapshot.mergeableState === 'unknown'
    ? null
    : true;
}

function readOf(
  payload: GitHubPullRequestPayload,
  repo: string,
  number: number,
): PullRequestRead {
  const snapshot = snapshotFromPayload(payload, repo, number);
  return { snapshot, mergeable: mergeableOf(payload, snapshot) };
}

// --- Checks ----------------------------------------------------------------------------------------------------------

interface StatusFields {
  readonly context?: unknown;
  readonly state?: unknown;
  readonly target_url?: unknown;
}

interface CheckRunFields {
  readonly id?: unknown;
  readonly name?: unknown;
  readonly status?: unknown;
  readonly conclusion?: unknown;
  readonly html_url?: unknown;
  readonly details_url?: unknown;
  readonly app?: { readonly slug?: unknown } | null;
  readonly output?: { readonly title?: unknown; readonly summary?: unknown };
}

interface AnnotationFields {
  readonly path?: unknown;
  readonly start_line?: unknown;
  readonly end_line?: unknown;
  readonly annotation_level?: unknown;
  readonly title?: unknown;
  readonly message?: unknown;
}

/** How long reading a job's log may take. */
const LOG_TIMEOUT_MS = 60_000;

/** A response body as text, as it arrives, up to `LOG_READ_MAX_BYTES`. */
async function* textOf(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  const reader = body.getReader();
  let read = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      read += value.byteLength;
      yield decoder.decode(value, { stream: true });
      if (read >= LOG_READ_MAX_BYTES) return;
    }
    yield decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

/** The conclusions of a check that failed. */
const FAILED: ReadonlySet<unknown> = new Set([
  'failure',
  'timed_out',
  'cancelled',
]);
/** The failing parts of one commit's logs, at most. */
export const CHECK_LOGS_MAX_BYTES = 32 * 1024;
/** A log is read this far at most; a longer one's end is not reached. */
const LOG_READ_MAX_BYTES = 50 * 1024 * 1024;
/** A check's own report is cut after this many characters. */
const SUMMARY_LENGTH = 2_000;
/** How many checks' annotations and logs are kept, finished checks' never changing. */
const FAILED_CHECKS_KEPT = 200;

const PASSING: ReadonlySet<string> = new Set(['success', 'neutral', 'skipped']);
const QUEUED: ReadonlySet<unknown> = new Set([
  'queued',
  'waiting',
  'requested',
  'pending',
]);

/** A commit status as a check: `pending` runs, `success` passes, `failure` and `error` fail. */
export function checkOfStatus(status: StatusFields): GitCheck {
  const state = typeof status.state === 'string' ? status.state : '';
  return {
    kind: 'status',
    name: (typeof status.context === 'string'
      ? status.context
      : 'status'
    ).slice(0, 255),
    status: state === 'pending' ? 'in_progress' : 'completed',
    conclusion:
      state === 'pending' ? null : state === 'success' ? 'success' : 'failure',
    url:
      typeof status.target_url === 'string' && status.target_url
        ? status.target_url.slice(0, 500)
        : null,
  };
}

export function checkOfRun(run: CheckRunFields): GitCheck {
  const status =
    run.status === 'completed'
      ? 'completed'
      : QUEUED.has(run.status)
        ? 'queued'
        : 'in_progress';
  const url =
    typeof run.html_url === 'string' && run.html_url
      ? run.html_url
      : typeof run.details_url === 'string' && run.details_url
        ? run.details_url
        : null;
  return {
    kind: 'check',
    name: (typeof run.name === 'string' ? run.name : 'check').slice(0, 255),
    status,
    conclusion:
      status === 'completed' && typeof run.conclusion === 'string'
        ? run.conclusion.slice(0, 32)
        : null,
    url: url ? url.slice(0, 500) : null,
  };
}

/** The checks folded: `failure` when one failed, `pending` while one runs, `success` when all pass; null without any. */
export function ciStateOfChecks(
  checks: readonly GitCheck[],
): PullRequestCiState | null {
  if (checks.length === 0) return null;
  if (
    checks.some(
      (check) =>
        check.status === 'completed' &&
        check.conclusion !== null &&
        !PASSING.has(check.conclusion),
    )
  )
    return 'failure';
  if (checks.some((check) => check.status !== 'completed')) return 'pending';
  return 'success';
}

/** A check run or suite of a webhook delivery: its own CI state, null when it says nothing (no runs, no conclusion). */
export function ciStateOfDelivered(fields: {
  readonly status?: unknown;
  readonly conclusion?: unknown;
  readonly latest_check_runs_count?: unknown;
}): PullRequestCiState | null {
  if (fields.latest_check_runs_count === 0) return null;
  const { status, conclusion } = fields;
  if (status !== undefined && status !== null && status !== 'completed')
    return 'pending';
  if (typeof conclusion !== 'string') return null;
  return PASSING.has(conclusion) ? 'success' : 'failure';
}

// --- Webhooks --------------------------------------------------------------------------------------------------------

/**
 * Whether a delivery carries `X-Hub-Signature-256` of its raw body under `secret`, checked by
 * `@octokit/webhooks-methods` in constant time. GitHub signs the bytes of a JSON or form body, which is UTF-8 text: a
 * body that does not decode as UTF-8 is not one GitHub sent.
 */
export async function verifyWebhookSignature(
  secret: string,
  body: Uint8Array,
  signature: string | null,
): Promise<boolean> {
  if (!secret || !signature || body.length === 0) return false;
  let payload: string;
  try {
    payload = new TextDecoder('utf-8', { fatal: true }).decode(body);
  } catch {
    return false;
  }
  return verify(secret, payload, signature);
}

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined;

type PullRequestAction = 'opened' | 'updated' | 'ready' | 'reopened' | 'closed';

/** The `pull_request` actions Studio reads, as Studio's actions; others (labels, assignees, reviews) change nothing it keeps. */
const PULL_REQUEST_ACTIONS: Readonly<Record<string, PullRequestAction>> = {
  opened: 'opened',
  edited: 'updated',
  synchronize: 'updated',
  converted_to_draft: 'updated',
  ready_for_review: 'ready',
  reopened: 'reopened',
  closed: 'closed',
};

function parseEvent(
  event: string,
  payload: Record<string, unknown>,
  repo: string | null,
): WebhookParse['result'] {
  const action = text(payload.action) ?? '';
  switch (event) {
    case 'ping':
      return { event: { type: 'ping' } };
    case 'pull_request': {
      const pull = payload.pull_request as GitHubPullRequestPayload | undefined;
      const mapped = PULL_REQUEST_ACTIONS[action];
      if (!mapped || typeof pull?.number !== 'number' || !repo)
        return { ignored: 'unsupportedAction' };
      const snapshot = snapshotFromPayload(pull, repo, pull.number);
      return {
        event: {
          type: 'pullRequest',
          action:
            mapped === 'closed' && snapshot.state === 'merged'
              ? 'merged'
              : mapped,
          snapshot,
          mergeableReported: pull.mergeable_state !== undefined,
        },
      };
    }
    case 'check_suite': {
      const suite = payload.check_suite as Record<string, unknown> | undefined;
      if (action !== 'completed') return { ignored: 'unsupportedAction' };
      // Some GitHub Apps open a suite on every commit and never run anything: no CI, as on GitHub's own pages.
      if (suite?.latest_check_runs_count === 0) return { ignored: 'noRuns' };
      const sha = text(suite?.head_sha);
      if (!sha || !suite) return { ignored: 'unsupportedAction' };
      return {
        event: { type: 'checks', sha, reported: ciStateOfDelivered(suite) },
      };
    }
    case 'check_run': {
      const run = payload.check_run as Record<string, unknown> | undefined;
      const sha = text(run?.head_sha);
      if (!sha || !run || action === 'requested_action')
        return { ignored: 'unsupportedAction' };
      return {
        event: { type: 'checks', sha, reported: ciStateOfDelivered(run) },
      };
    }
    case 'status': {
      const sha = text(payload.sha);
      if (!sha) return { ignored: 'unsupportedAction' };
      return {
        event: {
          type: 'checks',
          sha,
          reported: ciStateOfChecks([checkOfStatus({ state: payload.state })]),
        },
      };
    }
    case 'push': {
      const ref = text(payload.ref);
      if (payload.deleted === true) return { ignored: 'unsupportedAction' };
      if (ref?.startsWith('refs/heads/'))
        return {
          event: {
            type: 'push',
            branch: ref.slice('refs/heads/'.length),
            created: payload.created === true,
            before: text(payload.before) ?? null,
            after: text(payload.after) ?? null,
          },
        };
      if (ref?.startsWith('refs/tags/'))
        return { event: { type: 'tag', tag: ref.slice('refs/tags/'.length) } };
      return { ignored: 'unsupportedAction' };
    }
    case 'workflow_run': {
      const run = payload.workflow_run as WorkflowRunFields | undefined;
      if (
        action !== 'requested' &&
        action !== 'in_progress' &&
        action !== 'completed'
      )
        return { ignored: 'unsupportedAction' };
      const parsed = run ? workflowRunOf(run) : null;
      if (!parsed) return { ignored: 'unsupportedAction' };
      return { event: { type: 'workflowRun', action, run: parsed } };
    }
    default:
      return { ignored: 'unsupportedEvent' };
  }
}

/** The fields Studio reads from a GitHub workflow run (REST answer and webhook payload alike). */
interface WorkflowRunFields {
  readonly id?: unknown;
  readonly workflow_id?: unknown;
  readonly name?: unknown;
  readonly path?: unknown;
  readonly head_branch?: unknown;
  readonly head_sha?: unknown;
  readonly status?: unknown;
  readonly conclusion?: unknown;
  readonly html_url?: unknown;
  readonly run_attempt?: unknown;
}

const idText = (value: unknown): string | null =>
  typeof value === 'number' || (typeof value === 'string' && value)
    ? String(value)
    : null;

export function workflowRunOf(fields: WorkflowRunFields): WorkflowRun | null {
  const id = idText(fields.id);
  const workflowId = idText(fields.workflow_id);
  if (!id || !workflowId) return null;
  return {
    id,
    workflowId,
    name: text(fields.name) ?? null,
    // A run's path may carry the ref it ran from (`.github/workflows/ci.yml@refs/heads/main`).
    path: (text(fields.path) ?? '').replace(/@.*$/u, ''),
    headBranch: text(fields.head_branch) ?? null,
    headSha: text(fields.head_sha) ?? '',
    status: text(fields.status) ?? null,
    conclusion: text(fields.conclusion) ?? null,
    htmlUrl: text(fields.html_url) ?? '',
    runAttempt:
      typeof fields.run_attempt === 'number' && fields.run_attempt > 0
        ? fields.run_attempt
        : 1,
  };
}

export function parseGitHubWebhook(
  body: Uint8Array,
  headers: (name: string) => string | null,
): WebhookParse {
  const deliveryId = headers('x-github-delivery');
  const event = headers('x-github-event');
  let payload: Record<string, unknown> | null = null;
  try {
    const value: unknown = JSON.parse(Buffer.from(body).toString('utf8'));
    if (value && typeof value === 'object' && !Array.isArray(value))
      payload = value as Record<string, unknown>;
  } catch {
    payload = null;
  }
  // GitHub sends `application/x-www-form-urlencoded` unless the webhook says JSON; Studio reads JSON only.
  if (!payload)
    return {
      deliveryId,
      event,
      repo: null,
      installationId: null,
      result: { ignored: 'notJson' },
    };
  const repo =
    text(
      (payload.repository as { full_name?: unknown } | undefined)?.full_name,
    ) ?? null;
  const installation = (payload.installation as { id?: unknown } | undefined)
    ?.id;
  return {
    deliveryId,
    event,
    repo,
    installationId:
      typeof installation === 'number' || typeof installation === 'string'
        ? String(installation)
        : null,
    result: parseEvent(event ?? '', payload, repo),
  };
}

// --- The REST client -------------------------------------------------------------------------------------------------

interface RepoFields {
  readonly id?: unknown;
  readonly full_name?: unknown;
  readonly name?: unknown;
  readonly owner?: { readonly login?: unknown };
  readonly private?: unknown;
  readonly default_branch?: unknown;
  readonly clone_url?: unknown;
  readonly html_url?: unknown;
  readonly description?: unknown;
  readonly is_template?: unknown;
}

export function repoSummaryOf(fields: RepoFields): RepoSummary {
  const fullName = typeof fields.full_name === 'string' ? fields.full_name : '';
  const [owner = '', name = ''] = fullName.split('/');
  const id = fields.id;
  return {
    id: typeof id === 'number' || typeof id === 'string' ? String(id) : '',
    fullName,
    owner: typeof fields.owner?.login === 'string' ? fields.owner.login : owner,
    name: typeof fields.name === 'string' ? fields.name : name,
    private: fields.private === true,
    defaultBranch:
      typeof fields.default_branch === 'string' && fields.default_branch
        ? fields.default_branch
        : 'main',
    cloneUrl: typeof fields.clone_url === 'string' ? fields.clone_url : '',
    webUrl: typeof fields.html_url === 'string' ? fields.html_url : '',
    description:
      typeof fields.description === 'string' ? fields.description : null,
    isTemplate: fields.is_template === true,
  };
}

const PERMISSIONS: readonly RepoPermission[] = [
  'admin',
  'maintain',
  'write',
  'triage',
  'read',
];

/** What a Studio app asks of a repository and hears about ("What a GitHub App needs", `docs/software-development.md`). */
export const APP_PERMISSIONS: Readonly<Record<string, 'read' | 'write'>> = {
  contents: 'write',
  pull_requests: 'write',
  checks: 'read',
  statuses: 'read',
  metadata: 'read',
  actions: 'write',
  administration: 'write',
  workflows: 'write',
  // Writing the CI's API key as a repository secret (`../builds/ci-setup.ts`).
  secrets: 'write',
};

/**
 * The permissions of `APP_PERMISSIONS` an installation was not granted at that level, as `name:level` (`secrets:write`):
 * an installation keeps what its account accepted until someone accepts the app's new permissions on GitHub.
 */
export function missingAppPermissions(
  granted: Readonly<Record<string, string>>,
): string[] {
  const rank = (level: string | undefined) =>
    level === 'admin' ? 3 : level === 'write' ? 2 : level === 'read' ? 1 : 0;
  return Object.entries(APP_PERMISSIONS)
    .filter(([name, level]) => rank(granted[name]) < rank(level))
    .map(([name, level]) => `${name}:${level}`);
}
export const APP_EVENTS: readonly string[] = [
  'pull_request',
  'check_suite',
  'check_run',
  'status',
  'push',
  'workflow_run',
];
/** GitHub's longest app name. */
const APP_NAME_MAX = 34;

/** The manifest of a GitHub App for Studio (https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest). */
export function buildAppManifest(
  input: Omit<AppManifestInput, 'webUrl' | 'organization' | 'state'>,
): Record<string, unknown> {
  return {
    name: input.name.slice(0, APP_NAME_MAX).trim(),
    url: input.homepageUrl,
    hook_attributes: { url: input.webhookUrl, active: input.webhookActive },
    redirect_url: input.redirectUrl,
    callback_urls: [input.callbackUrl],
    setup_url: input.setupUrl,
    setup_on_update: true,
    request_oauth_on_install: false,
    public: false,
    default_permissions: { ...APP_PERMISSIONS },
    default_events: [...APP_EVENTS],
  };
}

const trimSlash = (url: string) => url.replace(/\/+$/u, '');

/**
 * How long an API installation token is reused. A token handed to a run also needs at least 30 minutes remaining;
 * installationToken refreshes a cached token that cannot cover that budget.
 */
export const INSTALLATION_TOKEN_REUSE_MS = 50 * 60 * 1000;

/** The web pages of an API: github.com for `api.github.com`, the same origin for GitHub Enterprise Server. */
export function webUrlOf(apiBaseUrl: string): string {
  const url = new URL(apiBaseUrl);
  if (url.host === 'api.github.com') return 'https://github.com';
  return url.origin;
}

function noReplyEmail(apiBaseUrl: string, id: string, login: string): string {
  const host = new URL(webUrlOf(apiBaseUrl)).host;
  return `${id}+${login}@users.noreply.${host}`;
}

/** A person's tokens as `@octokit/oauth-methods` answers them; an app without expiring tokens gives no expiry. */
function oauthTokensOf(authentication: {
  readonly token: string;
  readonly expiresAt?: string;
  readonly refreshToken?: string;
  readonly refreshTokenExpiresAt?: string;
}): OAuthTokens {
  if (!authentication.token)
    throw new GitApiError(400, 'GitHub refused the authorization.');
  return {
    accessToken: authentication.token,
    expiresAt: authentication.expiresAt ?? null,
    refreshToken: authentication.refreshToken || null,
    refreshExpiresAt: authentication.refreshTokenExpiresAt ?? null,
  };
}

/**
 * GitHub's OAuth pages answer a refusal with 200 and an `error` in the body, which `@octokit/oauth-methods` throws as a
 * 400: that body (`authorization_pending`, `bad_verification_code`, …), or null for any other failure.
 */
function oauthRefusalOf(
  error: unknown,
): { readonly error: string; readonly interval?: number } | null {
  if (!(error instanceof RequestError) || error.status !== 400) return null;
  const data = error.response?.data as
    { error?: unknown; interval?: unknown } | undefined;
  if (typeof data?.error !== 'string') return null;
  return {
    error: data.error,
    ...(typeof data.interval === 'number' ? { interval: data.interval } : {}),
  };
}

const refused = (what: string, error: unknown): GitApiError => {
  const refusal = oauthRefusalOf(error);
  if (!refusal && error instanceof GitApiError) return error;
  return new GitApiError(
    400,
    `GitHub refused ${what}${refusal ? ` (${refusal.error})` : ''}.`,
  );
};

export function createGitHubPlatform(
  options: {
    readonly fetch?: FetchLike;
    readonly now?: () => number;
    /** How a read waits before it is tried again (tests pass one that does not). */
    readonly sleep?: (ms: number) => Promise<void>;
  } = {},
): GitPlatform {
  const fetchImpl: FetchLike =
    options.fetch ?? ((url, init) => fetch(url, init));
  const now = options.now ?? (() => Date.now());
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  const client = createGitHubClient({ fetch: options.fetch, now, sleep });
  const request = client.request.bind(client);

  async function read<T>(
    caller: Caller,
    path: string,
    init: { readonly method?: Method; readonly body?: unknown } = {},
  ): Promise<T> {
    const answer = await request<T>(caller, path, init);
    if (answer.notModified) throw new GitApiError(500, 'GitHub answered 304.');
    return answer.body;
  }

  const bearer = (auth: GitAuth): Caller => ({
    apiBaseUrl: auth.apiBaseUrl,
    authorization: auth.token ? `Bearer ${auth.token}` : null,
  });
  /** Installation tokens of apps given no cache of their own, by app and `@octokit/auth-app`'s key. */
  const memory = new Map<string, { value: string; expiresAt: number }>();
  /** `@octokit/auth-app` for an app: its JWT, and its installation tokens kept in the app's cache. */
  function appAuthOf(app: AppCredentials) {
    const own = app.tokenCache;
    const scope = `${app.apiBaseUrl}\n${app.appId}\n`;
    return createAppAuth({
      appId: app.appId,
      privateKey: app.privateKey,
      request: client.requestOf(app.apiBaseUrl),
      cache: {
        // `@octokit/auth-app` takes an empty value for none.
        async get(key: string): Promise<string> {
          if (own) return (await own.get(key)) ?? '';
          const found = memory.get(scope + key);
          return found && found.expiresAt > now() ? found.value : '';
        },
        // Its type is the in-memory cache's, but `@octokit/auth-app` awaits what `set` returns.
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async set(key: string, value: string) {
          const expiresAt = now() + INSTALLATION_TOKEN_REUSE_MS;
          if (own) await own.set(key, value, new Date(expiresAt));
          else memory.set(scope + key, { value, expiresAt });
        },
      },
    });
  }
  const asApp = async (app: AppCredentials): Promise<Caller> => ({
    apiBaseUrl: app.apiBaseUrl,
    authorization: `Bearer ${(await appAuthOf(app)({ type: 'app' })).token}`,
  });

  const repoPath = (repo: string) =>
    `/repos/${repo.split('/').map(encodeURIComponent).join('/')}`;
  /** A path in a repository, each segment encoded and the slashes kept. */
  const filePath = (path: string) =>
    path.split('/').map(encodeURIComponent).join('/');

  /**
   * How `head` relates to `base` (`GET /repos/{owner}/{repo}/compare/{base}...{head}`): `ahead` when `head` contains
   * `base` and more, `behind` the other way, `identical`, or `diverged`; null when either is unknown (404, 422).
   */
  async function compareStatus(
    auth: GitAuth,
    repo: string,
    base: string,
    head: string,
  ): Promise<string | null> {
    try {
      const compare = await read<{ status?: unknown }>(
        bearer(auth),
        `${repoPath(repo)}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
      );
      return typeof compare.status === 'string' ? compare.status : null;
    } catch (error) {
      if (
        error instanceof GitApiError &&
        (error.status === 404 || error.status === 422)
      )
        return null;
      throw error;
    }
  }

  /** Protects a branch; false when the host refuses (a plan without protection, say). */
  async function protect(
    auth: GitAuth,
    repo: string,
    branch: string,
  ): Promise<boolean> {
    try {
      await read(
        bearer(auth),
        `${repoPath(repo)}/branches/${encodeURIComponent(branch)}/protection`,
        {
          method: 'PUT',
          body: {
            required_status_checks: null,
            enforce_admins: false,
            required_pull_request_reviews: {
              required_approving_review_count: 0,
            },
            restrictions: null,
            allow_force_pushes: false,
            allow_deletions: false,
          },
        },
      );
      return true;
    } catch {
      return false;
    }
  }

  async function readChecks(
    auth: GitAuth,
    repo: string,
    sha: string,
    etags: CheckEtags,
  ): ReturnType<GitPlatform['getChecks']> {
    const commit = `${repoPath(repo)}/commits/${encodeURIComponent(sha)}`;
    const status = await request<{ statuses?: StatusFields[] }>(
      bearer(auth),
      `${commit}/status`,
      { etag: etags.status },
    );
    const runs = await request<{ check_runs?: CheckRunFields[] }>(
      bearer(auth),
      `${commit}/check-runs?per_page=100`,
      { etag: etags.runs },
    );
    if (status.notModified && runs.notModified) return { notModified: true };
    // One changed and the other did not: what did not change is not kept apart, so read both again.
    if (status.notModified || runs.notModified)
      return readChecks(auth, repo, sha, { status: null, runs: null });
    const checks = [
      ...(status.body.statuses ?? []).map(checkOfStatus),
      ...(runs.body.check_runs ?? []).map(checkOfRun),
    ];
    return {
      notModified: false,
      ciState: ciStateOfChecks(checks),
      checks,
      etags: { status: status.etag, runs: runs.etag },
    };
  }

  /** The annotations and log of finished checks, which never change, by API, repository and check. */
  const explainedChecks = new Map<
    string,
    {
      readonly annotations: readonly CheckAnnotation[];
      readonly log:
        | { readonly text: string }
        | {
            readonly unavailable: 'notActions' | 'unavailable' | 'rateLimited';
          };
    }
  >();

  /** A check's annotations (the first page: GitHub's fifty), or null under the rate limit. */
  async function annotationsOf(
    auth: GitAuth,
    repo: string,
    id: string,
  ): Promise<CheckAnnotation[] | null> {
    let rows: AnnotationFields[];
    try {
      rows = await read<AnnotationFields[]>(
        bearer(auth),
        `${repoPath(repo)}/check-runs/${encodeURIComponent(id)}/annotations?per_page=50`,
      );
    } catch (error) {
      if (error instanceof GitApiError && error.rateLimited) return null;
      if (error instanceof GitApiError) return [];
      throw error;
    }
    return rows.flatMap((row) => {
      const path = text(row.path);
      const message = text(row.message);
      if (!path || !message) return [];
      const line = (value: unknown) =>
        typeof value === 'number' ? value : null;
      return [
        {
          path,
          startLine: line(row.start_line),
          endLine: line(row.end_line),
          level: text(row.annotation_level) ?? 'notice',
          title: text(row.title) ?? null,
          message,
        },
      ];
    });
  }

  /**
   * The failing part of a GitHub Actions job's log. GitHub answers the log's address with a redirect to short-lived
   * storage elsewhere, which is read without the credential, as a stream, and never whole.
   */
  async function jobLogOf(
    auth: GitAuth,
    repo: string,
    id: string,
  ): Promise<
    | { readonly text: string }
    | { readonly unavailable: 'unavailable' | 'rateLimited' }
  > {
    let location: string | null;
    try {
      location = await client.redirectOf(
        bearer(auth),
        `${repoPath(repo)}/actions/jobs/${encodeURIComponent(id)}/logs`,
      );
    } catch (error) {
      if (error instanceof GitApiError)
        return {
          unavailable: error.rateLimited ? 'rateLimited' : 'unavailable',
        };
      throw error;
    }
    if (!location) return { unavailable: 'unavailable' };
    let response: Response;
    try {
      response = await fetchImpl(location, {
        method: 'GET',
        signal: AbortSignal.timeout(LOG_TIMEOUT_MS),
      });
    } catch {
      return { unavailable: 'unavailable' };
    }
    if (!response.ok || !response.body) return { unavailable: 'unavailable' };
    return { text: await excerptOfLog(linesOf(textOf(response.body))) };
  }

  /** The request `@octokit/oauth-methods` posts to a client's web pages with (`/login/...`). */
  const oauthRequestOf = (oauthClient: { readonly webUrl: string }) =>
    client.requestOf(trimSlash(oauthClient.webUrl));

  return {
    descriptor: GIT_PROVIDER_DESCRIPTORS.github,

    apiBaseUrlOf,

    missingPermissions: missingAppPermissions,

    async listPullRequests(auth, repo, etag) {
      const answer = await request<GitHubPullRequestPayload[]>(
        bearer(auth),
        `${repoPath(repo)}/pulls?state=all&sort=updated&direction=desc&per_page=50`,
        { etag },
      );
      if (answer.notModified) return { notModified: true };
      return {
        notModified: false,
        body: answer.body.flatMap((pull) =>
          typeof pull.number === 'number'
            ? [snapshotFromPayload(pull, repo, pull.number)]
            : [],
        ),
        etag: answer.etag,
      };
    },

    async getPullRequest(auth, repo, number, etag) {
      const answer = await request<GitHubPullRequestPayload>(
        bearer(auth),
        `${repoPath(repo)}/pulls/${number}`,
        { etag },
      );
      if (answer.notModified) return { notModified: true };
      return {
        notModified: false,
        body: readOf(answer.body, repo, number),
        etag: answer.etag,
      };
    },

    async openPullRequest(auth, repo, input) {
      const pull = await read<GitHubPullRequestPayload>(
        bearer(auth),
        `${repoPath(repo)}/pulls`,
        {
          method: 'POST',
          body: {
            title: input.title,
            body: input.body,
            head: input.head,
            base: input.base,
            draft: input.draft,
          },
        },
      );
      return readOf(pull, repo, Number(pull.number));
    },

    async updatePullRequestBody(auth, repo, number, value) {
      const pull = await read<GitHubPullRequestPayload>(
        bearer(auth),
        `${repoPath(repo)}/pulls/${number}`,
        { method: 'PATCH', body: { body: value } },
      );
      return snapshotFromPayload(pull, repo, number);
    },

    async updatePullRequest(auth, repo, number, input) {
      const pull = await read<GitHubPullRequestPayload>(
        bearer(auth),
        `${repoPath(repo)}/pulls/${number}`,
        { method: 'PATCH', body: input },
      );
      return snapshotFromPayload(pull, repo, number);
    },

    async setPullRequestDraft(auth, repo, number, draft) {
      const path = `${repoPath(repo)}/pulls/${number}`;
      const current = await read<GitHubPullRequestPayload>(bearer(auth), path);
      if ((current.draft === true) === draft || !current.node_id)
        return snapshotFromPayload(current, repo, number);
      // The REST API cannot change it: GraphQL answers 200 with `errors` when it refuses.
      const mutation = draft
        ? 'mutation($id: ID!) { convertPullRequestToDraft(input: { pullRequestId: $id }) { clientMutationId } }'
        : 'mutation($id: ID!) { markPullRequestReadyForReview(input: { pullRequestId: $id }) { clientMutationId } }';
      await client.graphql(bearer(auth), mutation, { id: current.node_id });
      return snapshotFromPayload(
        await read<GitHubPullRequestPayload>(bearer(auth), path),
        repo,
        number,
      );
    },

    async commentOnPullRequest(auth, repo, number, body) {
      await read(bearer(auth), `${repoPath(repo)}/issues/${number}/comments`, {
        method: 'POST',
        body: { body },
      });
    },

    async mergePullRequest(auth, repo, number, input) {
      const answer = await read<{ sha?: unknown }>(
        bearer(auth),
        `${repoPath(repo)}/pulls/${number}/merge`,
        {
          method: 'PUT',
          body: {
            merge_method: 'squash',
            sha: input.sha,
            commit_title: input.commitTitle,
          },
        },
      );
      return { sha: typeof answer.sha === 'string' ? answer.sha : '' };
    },

    getChecks: readChecks,

    async failedChecks(auth, repo, sha) {
      const answer = await read<{ check_runs?: CheckRunFields[] }>(
        bearer(auth),
        `${repoPath(repo)}/commits/${encodeURIComponent(sha)}/check-runs?filter=latest&per_page=100`,
      );
      const failed = (answer.check_runs ?? []).filter(
        (run) =>
          run.status === 'completed' &&
          FAILED.has(run.conclusion) &&
          idText(run.id),
      );
      const found: FailedCheck[] = [];
      let budget = CHECK_LOGS_MAX_BYTES;
      let limited = false;
      for (const run of failed) {
        const id = idText(run.id)!;
        const key = `${auth.apiBaseUrl}\n${repo}\n${id}`;
        let explained = explainedChecks.get(key);
        if (!explained) {
          const annotations = limited
            ? null
            : await annotationsOf(auth, repo, id);
          if (annotations === null) limited = true;
          const log =
            run.app?.slug !== 'github-actions'
              ? ({ unavailable: 'notActions' } as const)
              : limited
                ? ({ unavailable: 'rateLimited' } as const)
                : await jobLogOf(auth, repo, id);
          if ('unavailable' in log && log.unavailable === 'rateLimited')
            limited = true;
          explained = { annotations: annotations ?? [], log };
          // Only what will not change is kept: a rate limit lifts.
          if (annotations !== null && !(limited && 'unavailable' in log)) {
            explainedChecks.set(key, explained);
            if (explainedChecks.size > FAILED_CHECKS_KEPT)
              explainedChecks.delete(explainedChecks.keys().next().value!);
          }
        }
        const { log } = explained;
        const size = 'text' in log ? Buffer.byteLength(log.text, 'utf8') : 0;
        const fits = size <= budget;
        if ('text' in log && fits) budget -= size;
        const title = text(run.output?.title);
        const summary = text(run.output?.summary);
        const report = [title, summary].filter(Boolean).join('\n\n');
        found.push({
          id,
          name: text(run.name) ?? id,
          conclusion: String(run.conclusion),
          url: text(run.html_url) ?? text(run.details_url) ?? null,
          summary: report
            ? report.length > SUMMARY_LENGTH
              ? `${report.slice(0, SUMMARY_LENGTH)}…`
              : report
            : null,
          annotations: explained.annotations,
          log: 'text' in log && fits ? log.text : null,
          logUnavailable:
            'unavailable' in log ? log.unavailable : fits ? null : 'budget',
        });
      }
      return found;
    },

    async openPullRequestsAt(auth, repo, sha) {
      const pulls = await read<GitHubPullRequestPayload[]>(
        bearer(auth),
        `${repoPath(repo)}/commits/${encodeURIComponent(sha)}/pulls?per_page=100`,
      ).catch((error: unknown) => {
        // An unknown commit is no pull request's head.
        if (
          error instanceof GitApiError &&
          (error.status === 404 || error.status === 422)
        )
          return [];
        throw error;
      });
      return pulls
        .flatMap((pull) =>
          typeof pull.number === 'number'
            ? [snapshotFromPayload(pull, repo, pull.number)]
            : [],
        )
        .filter((pull) => pull.state === 'open' && pull.headSha === sha);
    },

    async branchContains(auth, repo, branch, sha) {
      const status = await compareStatus(auth, repo, branch, sha);
      // `behind`: the branch moved on past the commit; `identical`: it is the head.
      return status === 'identical' || status === 'behind';
    },

    async commitContains(auth, repo, head, sha) {
      const status = await compareStatus(auth, repo, sha, head);
      // `ahead`: the head moved on past the commit; `identical`: it is the head.
      return status === 'identical' || status === 'ahead';
    },

    async branchesAt(auth, repo, sha) {
      const branches = await read<{ name?: unknown }[]>(
        bearer(auth),
        `${repoPath(repo)}/commits/${encodeURIComponent(sha)}/branches-where-head`,
      ).catch((error: unknown) => {
        // An unknown commit heads no branch.
        if (
          error instanceof GitApiError &&
          (error.status === 404 || error.status === 422)
        )
          return [];
        throw error;
      });
      return branches.flatMap((branch) =>
        typeof branch.name === 'string' ? [branch.name] : [],
      );
    },

    async tagsAt(auth, repo, sha) {
      const found: string[] = [];
      // The newest tags come first; three pages reach any tag a release pipeline just pushed.
      for (let page = 1; page <= 3; page += 1) {
        const tags = await read<
          { name?: unknown; commit?: { sha?: unknown } }[]
        >(bearer(auth), `${repoPath(repo)}/tags?per_page=100&page=${page}`);
        for (const tag of tags)
          if (typeof tag.name === 'string' && tag.commit?.sha === sha)
            found.push(tag.name);
        if (tags.length < 100) break;
      }
      return found;
    },

    async repoPermission(auth, repo, login) {
      try {
        const answer = await read<{
          permission?: unknown;
          role_name?: unknown;
        }>(
          bearer(auth),
          `${repoPath(repo)}/collaborators/${encodeURIComponent(login)}/permission`,
        );
        return (
          PERMISSIONS.find((item) => item === answer.role_name) ??
          PERMISSIONS.find((item) => item === answer.permission) ??
          'none'
        );
      } catch (error) {
        if (error instanceof GitApiError && error.status === 404) return 'none';
        throw error;
      }
    },

    async listRepos(auth, source, page) {
      const perPage = Math.min(100, Math.max(1, page.perPage));
      const query = `per_page=${perPage}&page=${Math.max(1, page.page)}`;
      const answer = await request<
        { repositories?: RepoFields[] } | RepoFields[]
      >(
        bearer(auth),
        source === 'installation'
          ? `/installation/repositories?${query}`
          : `/user/repos?${query}&sort=updated&affiliation=owner,collaborator,organization_member`,
      );
      if (answer.notModified) return { items: [], hasMore: false, total: null };
      const rows = Array.isArray(answer.body)
        ? answer.body
        : (answer.body.repositories ?? []);
      const total = Array.isArray(answer.body)
        ? null
        : (answer.body as { total_count?: unknown }).total_count;
      return {
        items: rows.map(repoSummaryOf),
        hasMore: answer.link
          ? /rel="next"/u.test(answer.link)
          : rows.length === perPage,
        total: typeof total === 'number' ? total : null,
      };
    },

    async createRepo(auth, input) {
      const created = repoSummaryOf(
        await read<RepoFields>(
          bearer(auth),
          input.organization
            ? `/orgs/${encodeURIComponent(input.owner)}/repos`
            : '/user/repos',
          {
            method: 'POST',
            body: {
              name: input.name,
              private: input.private,
              ...(input.description ? { description: input.description } : {}),
              // An initial commit, so the default branch exists and can be protected; none for an empty repository.
              auto_init: input.empty !== true,
            },
          },
        ),
      );
      if (input.empty === true) return { repo: created, protected: false };
      return {
        repo: created,
        protected: await protect(auth, created.fullName, created.defaultBranch),
      };
    },

    protectBranch: (auth, repo, branch) => protect(auth, repo, branch),

    async getRepo(auth, repo) {
      try {
        return repoSummaryOf(
          await read<RepoFields>(bearer(auth), repoPath(repo)),
        );
      } catch (error) {
        if (error instanceof GitApiError && error.status === 404) return null;
        throw error;
      }
    },

    async generateRepo(auth, template, input) {
      return repoSummaryOf(
        await read<RepoFields>(bearer(auth), `${repoPath(template)}/generate`, {
          method: 'POST',
          body: {
            owner: input.owner,
            name: input.name,
            private: input.private,
            include_all_branches: false,
            ...(input.description ? { description: input.description } : {}),
          },
        }),
      );
    },

    async listWorkflows(auth, repo) {
      const found: Workflow[] = [];
      // Ten pages of a hundred: more than any repository defines.
      for (let page = 1; page <= 10; page += 1) {
        const answer = await read<{
          workflows?: {
            id?: unknown;
            name?: unknown;
            path?: unknown;
            state?: unknown;
            html_url?: unknown;
          }[];
        }>(
          bearer(auth),
          `${repoPath(repo)}/actions/workflows?per_page=100&page=${page}`,
        );
        const rows = answer.workflows ?? [];
        for (const row of rows) {
          const id = idText(row.id);
          const path = text(row.path);
          if (!id || !path) continue;
          found.push({
            id,
            name: text(row.name) ?? path,
            path,
            state: text(row.state) ?? 'active',
            htmlUrl: text(row.html_url) ?? null,
          });
        }
        if (rows.length < 100) break;
      }
      return found;
    },

    async latestWorkflowRun(auth, repo, workflowId) {
      try {
        const answer = await read<{ workflow_runs?: WorkflowRunFields[] }>(
          bearer(auth),
          `${repoPath(repo)}/actions/workflows/${encodeURIComponent(workflowId)}/runs?per_page=1`,
        );
        const first = answer.workflow_runs?.[0];
        return first ? workflowRunOf(first) : null;
      } catch (error) {
        if (error instanceof GitApiError && error.status === 404) return null;
        throw error;
      }
    },

    async rerunWorkflowRun(auth, repo, runId) {
      await request(
        bearer(auth),
        `${repoPath(repo)}/actions/runs/${encodeURIComponent(runId)}/rerun`,
        { method: 'POST', body: {} },
      );
    },

    async readFile(auth, repo, path, branch) {
      try {
        const answer = await read<{
          sha?: unknown;
          content?: unknown;
          encoding?: unknown;
        }>(
          bearer(auth),
          `${repoPath(repo)}/contents/${filePath(path)}?ref=${encodeURIComponent(branch)}`,
        );
        if (
          typeof answer.sha !== 'string' ||
          typeof answer.content !== 'string'
        )
          return null;
        return {
          sha: answer.sha,
          content:
            answer.encoding === 'base64'
              ? Buffer.from(answer.content, 'base64').toString('utf8')
              : answer.content,
        };
      } catch (error) {
        // 404: no such file or branch; 409: an empty repository.
        if (
          error instanceof GitApiError &&
          (error.status === 404 || error.status === 409)
        )
          return null;
        throw error;
      }
    },

    async putFile(auth, repo, input) {
      const answer = await read<{
        content?: { sha?: unknown } | null;
        commit?: { sha?: unknown } | null;
      }>(bearer(auth), `${repoPath(repo)}/contents/${filePath(input.path)}`, {
        method: 'PUT',
        body: {
          message: input.message,
          content: Buffer.from(input.content, 'utf8').toString('base64'),
          branch: input.branch,
          ...(input.sha ? { sha: input.sha } : {}),
        },
      });
      return {
        sha: typeof answer.content?.sha === 'string' ? answer.content.sha : '',
        commitSha:
          typeof answer.commit?.sha === 'string' ? answer.commit.sha : '',
      };
    },

    async branchSha(auth, repo, branch) {
      try {
        const answer = await read<{ object?: { sha?: unknown } }>(
          bearer(auth),
          `${repoPath(repo)}/git/ref/heads/${filePath(branch)}`,
        );
        return typeof answer.object?.sha === 'string'
          ? answer.object.sha
          : null;
      } catch (error) {
        if (
          error instanceof GitApiError &&
          (error.status === 404 || error.status === 409)
        )
          return null;
        throw error;
      }
    },

    async createBranch(auth, repo, input) {
      try {
        await read(bearer(auth), `${repoPath(repo)}/git/refs`, {
          method: 'POST',
          body: { ref: `refs/heads/${input.name}`, sha: input.fromSha },
        });
      } catch (error) {
        // 422: the branch exists; move it.
        if (!(error instanceof GitApiError && error.status === 422))
          throw error;
        await read(
          bearer(auth),
          `${repoPath(repo)}/git/refs/heads/${filePath(input.name)}`,
          { method: 'PATCH', body: { sha: input.fromSha, force: true } },
        );
      }
    },

    async setCiSecret(auth, repo, input) {
      const key = await read<{ key_id?: unknown; key?: unknown }>(
        bearer(auth),
        `${repoPath(repo)}/actions/secrets/public-key`,
      );
      if (typeof key.key_id !== 'string' || typeof key.key !== 'string')
        throw new GitApiError(500, 'GitHub answered without a public key.');
      const sealed = sealedBox(
        new Uint8Array(Buffer.from(key.key, 'base64')),
        new Uint8Array(Buffer.from(input.value, 'utf8')),
      );
      await request(
        bearer(auth),
        `${repoPath(repo)}/actions/secrets/${encodeURIComponent(input.name)}`,
        {
          method: 'PUT',
          body: {
            encrypted_value: Buffer.from(sealed).toString('base64'),
            key_id: key.key_id,
          },
        },
      );
    },

    async currentUser(auth) {
      const answer = await request<{
        id?: unknown;
        login?: unknown;
        name?: unknown;
        email?: unknown;
      }>(bearer(auth), '/user');
      if (answer.notModified)
        throw new GitApiError(500, 'GitHub answered 304.');
      const user = answer.body;
      const id =
        typeof user.id === 'number' || typeof user.id === 'string'
          ? String(user.id)
          : '';
      const login = typeof user.login === 'string' ? user.login : '';
      let email =
        typeof user.email === 'string' && user.email ? user.email : null;
      if (!email)
        try {
          const emails = await read<
            { email?: unknown; primary?: unknown; verified?: unknown }[]
          >(bearer(auth), '/user/emails');
          const primary = emails.find(
            (item) => item.primary === true && item.verified === true,
          );
          email = typeof primary?.email === 'string' ? primary.email : null;
        } catch {
          // The credential may not read addresses: the no-reply address below.
        }
      return {
        id,
        login,
        name: typeof user.name === 'string' && user.name ? user.name : null,
        email: email ?? noReplyEmail(auth.apiBaseUrl, id, login),
        tokenExpiresAt: tokenExpirationOf(answer.expiration ?? null),
      };
    },

    async findInstallation(app, account) {
      for (const kind of ['orgs', 'users'])
        try {
          const found = await read<{ id?: unknown }>(
            await asApp(app),
            `/${kind}/${encodeURIComponent(account)}/installation`,
          );
          if (typeof found.id === 'number' || typeof found.id === 'string')
            return String(found.id);
        } catch (error) {
          if (!(error instanceof GitApiError && error.status === 404))
            throw error;
        }
      return null;
    },

    async installationToken(app, installationId, tokenOptions = {}) {
      const names = tokenOptions.repositories?.map(
        (repo) => repo.split('/').pop() ?? repo,
      );
      const authenticate = appAuthOf(app);
      const options = {
        type: 'installation',
        installationId,
        ...(names
          ? { repositoryNames: names, permissions: { contents: 'write' } }
          : {}),
      } as const;
      // API cache reuse must not leave a new run with only a few minutes to push.
      const minimumValidity = names ? 30 * 60 * 1000 : 60 * 1000;
      const valid = (expiry: string | undefined) =>
        expiry !== undefined &&
        new Date(expiry).getTime() >= now() + minimumValidity;
      let minted = await authenticate(options);
      if (!valid(minted.expiresAt))
        minted = await authenticate({ ...options, refresh: true });
      if (!minted.token)
        throw new GitApiError(500, 'GitHub answered without a token.');
      if (!valid(minted.expiresAt))
        throw new GitApiError(
          500,
          'GitHub answered with an invalid or insufficient token expiry.',
        );
      return { token: minted.token, expiresAt: minted.expiresAt ?? null };
    },

    async getInstallation(app, installationId) {
      try {
        const found = await read<{
          id?: unknown;
          account?: { login?: unknown } | null;
          permissions?: unknown;
          html_url?: unknown;
        }>(
          await asApp(app),
          `/app/installations/${encodeURIComponent(installationId)}`,
        );
        const login = found.account?.login;
        const permissions: Record<string, string> = {};
        if (found.permissions && typeof found.permissions === 'object')
          for (const [name, level] of Object.entries(found.permissions))
            if (typeof level === 'string') permissions[name] = level;
        return typeof login === 'string' &&
          (typeof found.id === 'number' || typeof found.id === 'string')
          ? {
              id: String(found.id),
              account: login,
              permissions,
              htmlUrl:
                typeof found.html_url === 'string' ? found.html_url : null,
            }
          : null;
      } catch (error) {
        if (error instanceof GitApiError && error.status === 404) return null;
        throw error;
      }
    },

    appManifestForm(input) {
      const base = trimSlash(input.webUrl);
      const action = new URL(
        input.organization
          ? `${base}/organizations/${encodeURIComponent(input.organization)}/settings/apps/new`
          : `${base}/settings/apps/new`,
      );
      action.searchParams.set('state', input.state);
      return {
        action: action.toString(),
        manifest: JSON.stringify(buildAppManifest(input)),
      };
    },

    async convertAppManifest(apiBaseUrl, code) {
      const app = await read<{
        id?: unknown;
        slug?: unknown;
        name?: unknown;
        client_id?: unknown;
        client_secret?: unknown;
        webhook_secret?: unknown;
        pem?: unknown;
        owner?: { login?: unknown; type?: unknown } | null;
      }>(
        { apiBaseUrl, authorization: null },
        `/app-manifests/${encodeURIComponent(code)}/conversions`,
        { method: 'POST' },
      );
      const text = (value: unknown) =>
        typeof value === 'string' && value ? value : null;
      const id = typeof app.id === 'number' ? String(app.id) : text(app.id);
      const slug = text(app.slug);
      const clientId = text(app.client_id);
      const clientSecret = text(app.client_secret);
      const privateKey = text(app.pem);
      if (!id || !slug || !clientId || !clientSecret || !privateKey)
        throw new GitApiError(500, 'GitHub answered without the app.');
      const owner = text(app.owner?.login);
      return {
        appId: id,
        slug,
        name: text(app.name) ?? slug,
        clientId,
        clientSecret,
        privateKey,
        webhookSecret: text(app.webhook_secret),
        organization: app.owner?.type === 'Organization' ? owner : null,
      } satisfies CreatedApp;
    },

    appUrls(webUrl, app) {
      const base = trimSlash(webUrl);
      const slug = encodeURIComponent(app.slug);
      // GitHub Enterprise Server serves an app's public page under `/github-apps`.
      const apps = new URL(base).host === 'github.com' ? 'apps' : 'github-apps';
      return {
        install: `${base}/${apps}/${slug}/installations/new`,
        settings: app.organization
          ? `${base}/organizations/${encodeURIComponent(app.organization)}/settings/apps/${slug}`
          : `${base}/settings/apps/${slug}`,
      };
    },

    pushCredential(token) {
      return {
        username: 'x-access-token',
        password: token.token,
        expiresAt:
          token.expiresAt ?? new Date(now() + 3600 * 1000).toISOString(),
      };
    },

    authorizeUrl(client, input) {
      const url = new URL('/login/oauth/authorize', client.webUrl);
      url.searchParams.set('client_id', client.clientId);
      url.searchParams.set('redirect_uri', input.redirectUri);
      url.searchParams.set('state', input.state);
      return url.toString();
    },

    async exchangeCode(oauthClient, input) {
      try {
        const { authentication } = await exchangeWebFlowCode({
          clientType: 'github-app',
          clientId: oauthClient.clientId,
          clientSecret: oauthClient.clientSecret,
          code: input.code,
          redirectUrl: input.redirectUri,
          request: oauthRequestOf(oauthClient),
        });
        return oauthTokensOf(authentication);
      } catch (error) {
        throw refused('the authorization', error);
      }
    },

    async refreshToken(oauthClient, refreshToken) {
      try {
        const { authentication } = await refreshOAuthToken({
          clientType: 'github-app',
          clientId: oauthClient.clientId,
          clientSecret: oauthClient.clientSecret,
          refreshToken,
          request: oauthRequestOf(oauthClient),
        });
        return oauthTokensOf(authentication);
      } catch (error) {
        throw refused('the authorization', error);
      }
    },

    async startDeviceAuthorization(oauthClient) {
      let body: Record<string, unknown>;
      try {
        body = (
          await createDeviceCode({
            clientType: 'github-app',
            clientId: oauthClient.clientId,
            request: oauthRequestOf(oauthClient),
          })
        ).data;
      } catch (error) {
        if (oauthRefusalOf(error)?.error === 'device_flow_disabled')
          return null;
        throw refused('the device flow', error);
      }
      if (
        typeof body.device_code !== 'string' ||
        typeof body.user_code !== 'string' ||
        typeof body.verification_uri !== 'string'
      )
        throw new GitApiError(400, 'GitHub refused the device flow.');
      return {
        deviceCode: body.device_code,
        userCode: body.user_code,
        verificationUri: body.verification_uri,
        expiresIn: typeof body.expires_in === 'number' ? body.expires_in : 900,
        interval: typeof body.interval === 'number' ? body.interval : 5,
      };
    },

    async pollDeviceAuthorization(
      oauthClient,
      deviceCode,
    ): Promise<DevicePoll> {
      try {
        const { authentication } = await exchangeDeviceCode({
          clientType: 'github-app',
          clientId: oauthClient.clientId,
          code: deviceCode,
          request: oauthRequestOf(oauthClient),
        });
        return { status: 'granted', tokens: oauthTokensOf(authentication) };
      } catch (error) {
        const refusal = oauthRefusalOf(error);
        const interval =
          refusal?.interval === undefined ? {} : { interval: refusal.interval };
        switch (refusal?.error) {
          case 'authorization_pending':
            return { status: 'pending', ...interval };
          case 'slow_down':
            return { status: 'slowDown', ...interval };
          case 'expired_token':
            return { status: 'expired' };
          case 'access_denied':
            return { status: 'denied' };
          case 'device_flow_disabled':
            return { status: 'disabled' };
          default:
            throw refused('the authorization', error);
        }
      }
    },

    webhookEventOf: (headers) => headers('x-github-event'),

    verifyWebhook: (secret, raw, headers) =>
      verifyWebhookSignature(secret, raw, headers('x-hub-signature-256')),

    parseWebhook: parseGitHubWebhook,
  };
}
