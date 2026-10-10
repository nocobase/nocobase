/**
 * The workspace's connections to code hosts, and each person's own authorization (`studioGitConnections`,
 * `studioGitUserAuths`). Code hosts are optional: without a connection every git entry point is hidden and projects work
 * without repositories. Each connection names its provider (`providers.ts`), whose platform it calls.
 *
 * - **Connections** are an administrator's (`studio.git` `manage`): an app installed on an account (its app id,
 *   private key and installation, found from the account when not given; its OAuth client id and secret let people
 *   authorize it for themselves; its webhook secret verifies the deliveries it sends to Studio), or a token. Every
 *   credential is sealed at rest (`sealing.ts`), bound to its connection, and write-only: the API says only whether one is set.
 * - **Credentials for the API**: an app's installation token, minted with a JWT the app signs and cached for at most
 *   fifty minutes, with its actual expiry checked before use; a token connection's token as it is. A **push credential** is an installation token
 *   limited to a run's repositories and `contents: write`, prepared with at least thirty minutes remaining.
 * - **Personal authorization**: from their account settings a person connects their own account on a connection's
 *   host, by what the connection offers (`personalMethodsOf`): the OAuth web flow of its app (with its client id and
 *   secret), the app's device flow (a code entered on the host, for a Studio the host cannot reach; the client id is
 *   enough), or a personal access token they paste, checked by calling the API as it (unless the connection turns
 *   personal tokens off). A web flow's state and a device flow's handle are sealed with the secrets key (who, which
 *   connection, until when), so neither needs a session store. Tokens are sealed per person and connection, refreshed
 *   when they expire and can be (a personal token's expiry is kept and shown), and never logged or returned; the
 *   account they name (login, name, the address commits carry) is kept beside them.
 * - **Repositories** a connection reaches are listed live, searched by name over its first pages, and a new one is
 *   created with an initial commit and its default branch protected.
 */
import { randomBytes, randomUUID } from 'node:crypto';

import { ProtocolError } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import {
  GIT_PRIVATE_KEY_MAX,
  GIT_TOKEN_MAX,
  WEBHOOK_SECRET_MAX,
  WEBHOOK_SECRET_MIN,
  type CreateGitRepoRequest,
  type CreatedGitRepo,
  type GenerateGitRepoRequest,
  webhooksReachable,
  type GitAppManifestForm,
  type GitConnection,
  type GitConnectionChoice,
  type GitConnectionReach,
  type GitConnectionUse,
  type GitConnectionKind,
  type GitDeviceAuthorization,
  type GitDevicePoll,
  type GitPersonalAuthorization,
  type GitPersonalAuthorizations,
  type GitPersonalMethod,
  type GitProvider,
  type GitRepoChoice,
  type GitRepoList,
  type GitWorkflow,
  type WebhookDelivery,
  type WebhookDeliveryReason,
  type WebhookDeliveryStatus,
} from '../../shared/git.js';
import {
  GitApiError,
  type AppCredentials,
  type GitAuth,
  type GitPlatform,
  type PlatformUser,
  type PullRequestSnapshot,
  type PushCredential,
  type RepoFile,
  type RepoSummary,
  type WorkflowRun,
} from './platform.js';
import { createInstallationTokens } from './installation-tokens.js';
import type { GitProviders } from './providers.js';
import { GIT_SECRET_PURPOSES as P, type GitSecrets } from './sealing.js';
import { isUniqueViolation } from './store.js';

export const CONNECTIONS = 'studioGitConnections';
export const USER_AUTHS = 'studioGitUserAuths';

/** How long a person has to come back from the host's authorization page. */
const STATE_TTL_MS = 15 * 60 * 1000;
/** How long what an installation was granted is trusted before the host is asked again. */
const GRANTS_TTL_MS = 10 * 60 * 1000;
/** Source pages a search reads at most, of `SEARCH_PAGE` repositories each. */
const SEARCH_PAGES = 10;
const SEARCH_PAGE = 100;
export const REPO_PAGE = 30;
/** The repositories one page of template repositories is read from: one request to the host. */
export const TEMPLATE_SOURCE_PAGE = 100;

type Row = Record<string, unknown>;

const str = (value: unknown): string | null =>
  typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'bigint'
      ? String(value)
      : null;
const iso = (value: unknown): string | null =>
  value == null || value === ''
    ? null
    : new Date(value as string).toISOString();

export interface ConnectionRow {
  readonly id: string;
  readonly provider: GitProvider;
  readonly kind: GitConnectionKind;
  readonly name: string;
  readonly webUrl: string;
  readonly apiBaseUrl: string;
  readonly account: string | null;
  readonly appId: string | null;
  readonly installationId: string | null;
  readonly clientId: string | null;
  readonly appSlug: string | null;
  readonly appOrganization: string | null;
  readonly privateKeySealed: string | null;
  readonly clientSecretSealed: string | null;
  readonly tokenSealed: string | null;
  readonly webhookSecretSealed: string | null;
  readonly allowPersonalTokens: boolean;
  /** Made by the demo data: Studio never calls its host (`demoConnection`). */
  readonly demo: boolean;
  readonly lastDelivery: WebhookDelivery | null;
  readonly lastReceivedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const DELIVERY_STATUSES: readonly WebhookDeliveryStatus[] = [
  'processed',
  'ignored',
  'invalidSignature',
  'failed',
];

function connectionOf(row: Row): ConnectionRow {
  const at = iso(row.webhookAt);
  const status = str(row.webhookStatus) as WebhookDeliveryStatus | null;
  return {
    id: str(row.id) ?? '',
    provider: (str(row.provider) ?? 'github') as GitProvider,
    kind: row.kind === 'app' ? 'app' : 'token',
    name: str(row.name) ?? '',
    webUrl: str(row.webUrl) ?? '',
    apiBaseUrl: str(row.apiBaseUrl) ?? '',
    account: str(row.account),
    appId: str(row.appId),
    installationId: str(row.installationId),
    clientId: str(row.clientId),
    appSlug: str(row.appSlug),
    appOrganization: str(row.appOrganization),
    privateKeySealed: str(row.privateKeySealed),
    clientSecretSealed: str(row.clientSecretSealed),
    tokenSealed: str(row.tokenSealed),
    webhookSecretSealed: str(row.webhookSecretSealed),
    // Some dialects answer a boolean as 0 or 1.
    allowPersonalTokens: !!row.allowPersonalTokens,
    demo: !!row.demo,
    lastReceivedAt: iso(row.lastReceivedAt),
    lastDelivery:
      at && status && DELIVERY_STATUSES.includes(status)
        ? {
            at,
            event: str(row.webhookEvent),
            status,
            reason: str(row.webhookReason) as WebhookDeliveryReason | null,
          }
        : null,
    createdAt: iso(row.createdAt) ?? '',
    updatedAt: iso(row.updatedAt) ?? '',
  };
}

export async function findConnection(
  conn: DatabaseConnection,
  id: string,
): Promise<ConnectionRow | null> {
  const row = await conn.query
    .selectFrom(CONNECTIONS)
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
  return row ? connectionOf(row) : null;
}

export async function listConnections(
  conn: DatabaseConnection,
): Promise<ConnectionRow[]> {
  const rows = await conn.query
    .selectFrom(CONNECTIONS)
    .selectAll()
    .orderBy('createdAt', 'asc')
    .orderBy('id', 'asc')
    .execute();
  return rows.map(connectionOf);
}

export async function updateConnectionRow(
  conn: DatabaseConnection,
  id: string,
  values: Readonly<Record<string, unknown>>,
): Promise<void> {
  await conn.query
    .updateTable(CONNECTIONS)
    .set({ ...values, updatedAt: new Date() })
    .where('id', '=', id)
    .execute();
}

/** An app created from a manifest that is not installed anywhere yet: nothing reaches a repository through it. */
export function awaitingInstallation(row: ConnectionRow): boolean {
  return row.kind === 'app' && !row.installationId;
}

/**
 * Where the repositories a connection reaches are chosen on the host. An app's installation page, as the host answered
 * it (`known`, its `html_url`) or, before that, under the organization the app belongs to when it is installed there and
 * under the person's settings otherwise; a token's are chosen in the person's token settings.
 */
export function repositoryAccessUrlOf(
  row: ConnectionRow,
  known: string | null = null,
): string | null {
  if (row.demo) return null;
  const base = row.webUrl.replace(/\/+$/u, '');
  if (row.kind === 'token') return `${base}/settings/tokens`;
  if (!row.installationId) return null;
  if (known) return known;
  const id = encodeURIComponent(row.installationId);
  return row.appOrganization &&
    row.account &&
    row.appOrganization.toLowerCase() === row.account.toLowerCase()
    ? `${base}/organizations/${encodeURIComponent(row.account)}/settings/installations/${id}`
    : `${base}/settings/installations/${id}`;
}

export function choiceOf(
  row: ConnectionRow,
  knownAccessUrl: string | null = null,
): GitConnectionChoice {
  return {
    id: row.id,
    provider: row.provider,
    kind: row.kind,
    name: row.name,
    account: row.account,
    webUrl: row.webUrl,
    demo: row.demo,
    repositoryAccessUrl: repositoryAccessUrlOf(row, knownAccessUrl),
    createdAt: row.createdAt,
  };
}

/** Refuses what would reach the host of a demo connection: its repositories exist only in Studio. */
export function demoConnection(
  row: Pick<ConnectionRow, 'name'>,
): ProtocolError {
  return new ProtocolError(
    'CONFLICT',
    `${row.name} is a demo connection: Studio never calls its code host, so its repositories, pull requests and CI are shown only as the demo data recorded them.`,
    { code: 'GIT_CONNECTION_DEMO' },
  );
}

/**
 * How people may connect their own account through a connection, of what its provider offers: the OAuth web flow
 * needs an app's client id and secret, the device flow its client id, and a personal token the connection allowing it.
 */
export function personalMethodsOf(
  row: ConnectionRow,
  offered: readonly GitPersonalMethod[],
): GitPersonalMethod[] {
  if (row.demo) return [];
  return offered.filter((method) =>
    method === 'oauth'
      ? row.kind === 'app' && !!row.clientId && !!row.clientSecretSealed
      : method === 'device'
        ? row.kind === 'app' && !!row.clientId
        : row.allowPersonalTokens,
  );
}

/** The connections that are installations of the same app as `row` (on the same host), `row` among them. */
export function sameApp(row: ConnectionRow, other: ConnectionRow): boolean {
  return (
    row.kind === 'app' &&
    other.kind === 'app' &&
    !!row.appId &&
    row.appId === other.appId &&
    row.apiBaseUrl === other.apiBaseUrl
  );
}

/** How many repositories projects' working directories link through each connection. */
async function usage(conn: DatabaseConnection): Promise<Map<string, number>> {
  const rows = await conn.query
    .selectFrom('pmProjectResources')
    .select(['bindingConnectionId', 'bindingFullName'])
    .where('bindingConnectionId', 'is not', null)
    .execute();
  const repos = new Map<string, Set<string>>();
  for (const row of rows) {
    const id = str(row.bindingConnectionId);
    const name = str(row.bindingFullName)?.toLowerCase();
    if (!id || !name) continue;
    const set = repos.get(id) ?? new Set<string>();
    set.add(name);
    repos.set(id, set);
  }
  return new Map([...repos].map(([id, set]) => [id, set.size]));
}

interface UserAuthRow {
  readonly id: string;
  readonly userId: string;
  readonly connectionId: string;
  readonly login: string;
  readonly name: string | null;
  readonly email: string;
  readonly method: GitPersonalMethod;
  readonly accessTokenSealed: string;
  readonly refreshTokenSealed: string | null;
  readonly expiresAt: string | null;
  readonly refreshExpiresAt: string | null;
  readonly createdAt: string;
}

function userAuthOf(row: Row): UserAuthRow {
  return {
    id: str(row.id) ?? '',
    userId: str(row.userId) ?? '',
    connectionId: str(row.connectionId) ?? '',
    login: str(row.login) ?? '',
    name: str(row.name),
    email: str(row.email) ?? '',
    method:
      row.method === 'device' || row.method === 'token' ? row.method : 'oauth',
    accessTokenSealed: str(row.accessTokenSealed) ?? '',
    refreshTokenSealed: str(row.refreshTokenSealed),
    expiresAt: iso(row.expiresAt),
    refreshExpiresAt: iso(row.refreshExpiresAt),
    createdAt: iso(row.createdAt) ?? '',
  };
}

/** Who a person is on a host, and the credential that acts as them. */
export interface PersonalAuth {
  readonly auth: GitAuth;
  readonly user: {
    readonly login: string;
    readonly name: string | null;
    readonly email: string;
  };
  readonly connectionId: string;
}

/** Which credential acts on a repository, and as whom. */
export interface ActingAuth {
  readonly auth: GitAuth;
  /** A person's own authorization, the repository's connection, or nothing (a public read). */
  readonly as: 'user' | 'connection' | 'none';
}

export interface GitConnections {
  /** Every connection, for whoever manages them. */
  list(): Promise<GitConnection[]>;
  /** How many repositories it reaches now, read live from the host. */
  reach(id: string): Promise<GitConnectionReach>;
  /** The projects' working directories that link a repository through it (`usedBy` counts their repositories). */
  uses(id: string): Promise<GitConnectionUse[]>;
  get(id: string): Promise<GitConnection>;
  create(userId: string, input: unknown): Promise<GitConnection>;
  /**
   * The demo data's connection (`demo`), stored as a token connection with a token that is obviously not one; the
   * existing one for the account when there is one. Nothing reaches its host: `webUrl` and `apiBaseUrl` are given
   * rather than derived, so they can name hosts that do not exist.
   */
  createDemo(
    userId: string,
    input: {
      readonly name: string;
      readonly account: string;
      readonly webUrl: string;
      readonly apiBaseUrl: string;
    },
  ): Promise<ConnectionRow>;
  update(id: string, input: unknown): Promise<GitConnection>;
  /** Removes it, with everyone's authorization of it; the repositories it reached are read without it from then on. */
  remove(id: string): Promise<void>;
  choices(): Promise<GitConnectionChoice[]>;
  find(id: string): Promise<ConnectionRow | null>;
  /** The connection's credential for the API. */
  authOf(connection: ConnectionRow): Promise<GitAuth>;
  /** Through the connection, or none: a repository with no connection is read without a credential. */
  connectionAuth(repo: {
    readonly connectionId: string | null;
    readonly apiBaseUrl: string;
  }): Promise<ActingAuth>;
  /** As the person when they authorized an app on the repository's host, else as its connection. */
  actingAuth(
    repo: { readonly connectionId: string | null; readonly apiBaseUrl: string },
    userId: string | null,
  ): Promise<ActingAuth>;
  /** A push credential for some repositories of an app connection; null for a token connection. */
  pushCredential(
    connectionId: string,
    repos: readonly string[],
  ): Promise<PushCredential | null>;
  webhookSecretOf(connection: ConnectionRow): string | null;
  /** Live, searched by name when `query` is given. */
  listRepos(
    id: string,
    input: { readonly query?: string; readonly page?: number },
  ): Promise<GitRepoList>;
  createRepo(id: string, input: unknown): Promise<CreatedGitRepo>;
  /**
   * A template repository the connection can read (`owner/name`, public ones of other accounts too): 400
   * `NOT_A_TEMPLATE_REPO` when it is not a template, `TEMPLATE_REPO_NOT_FOUND` when unreachable — 400 as input, 404
   * with `asResource`.
   */
  templateRepo(
    id: string,
    fullName: string,
    options?: { readonly asResource?: boolean },
  ): Promise<GitRepoChoice>;
  /** A new repository generated from a template repository; its default branch is protected later (`protectBranch`). */
  generateRepo(id: string, input: unknown): Promise<CreatedGitRepo>;
  /**
   * The template repositories among one page of `TEMPLATE_SOURCE_PAGE` repositories the connection reaches (`page`),
   * those whose name holds `query` when given: one request to the host each, so a page may hold none while `hasMore`
   * says the host has more to read.
   */
  templateRepos(
    id: string,
    input: { readonly page?: number; readonly query?: string },
  ): Promise<GitRepoList>;
  /** A repository's workflows, through the connection. */
  workflows(id: string, fullName: string): Promise<GitWorkflow[]>;
  /** The newest run of a workflow, or null. */
  latestWorkflowRun(
    id: string,
    fullName: string,
    workflowId: string,
  ): Promise<WorkflowRun | null>;
  rerunWorkflowRun(id: string, fullName: string, runId: string): Promise<void>;
  /** Protects a branch; false when the host refuses. */
  protectBranch(id: string, fullName: string, branch: string): Promise<boolean>;
  // --- A repository's CI (`../builds/ci-setup.ts`) ------------------------------------------------------------------
  /** A text file on a branch, or null. */
  readFile(
    id: string,
    fullName: string,
    path: string,
    branch: string,
  ): Promise<RepoFile | null>;
  /** Writes a text file as one commit on a branch. */
  putFile(
    id: string,
    fullName: string,
    input: Parameters<GitPlatform['putFile']>[2],
  ): Promise<{ readonly sha: string; readonly commitSha: string }>;
  /** A branch's head commit, or null. */
  branchSha(
    id: string,
    fullName: string,
    branch: string,
  ): Promise<string | null>;
  /** Creates a branch at a commit, or moves it there. */
  createBranch(
    id: string,
    fullName: string,
    input: { readonly name: string; readonly fromSha: string },
  ): Promise<void>;
  openPullRequest(
    id: string,
    fullName: string,
    input: Parameters<GitPlatform['openPullRequest']>[2],
  ): Promise<PullRequestSnapshot>;
  /** A pull request as the host has it now, or null. */
  getPullRequest(
    id: string,
    fullName: string,
    number: number,
  ): Promise<PullRequestSnapshot | null>;
  /**
   * Writes a CI secret through the connection. Refused before asking the host when the provider takes none, or an app's
   * installation was not granted the permission yet (`GIT_PERMISSION_MISSING`).
   */
  setCiSecret(
    id: string,
    fullName: string,
    input: { readonly name: string; readonly value: string },
  ): Promise<void>;
  // --- A person's own --------------------------------------------------------------------------------------------
  personal(userId: string): Promise<GitPersonalAuthorizations>;
  /** Where to send the person to authorize the connection's app. */
  authorizeUrl(
    userId: string,
    connectionId: string,
    redirectUri: string,
  ): Promise<string>;
  /**
   * The host sent the person back: store their tokens and who they are. Refused as `GIT_AUTHORIZATION_DENIED` (the
   * person declined), `GIT_AUTHORIZATION_REFUSED` (the host refused, `hostError` its code), `GIT_AUTHORIZATION_EXPIRED`
   * (the state is too old), `GIT_AUTHORIZATION_STATE_INVALID` (not started here, or by another person),
   * `GIT_AUTHORIZATION_FAILED` (nothing to complete), or the host's failure.
   */
  completeAuthorization(
    userId: string,
    input: {
      readonly code: unknown;
      readonly state: unknown;
      readonly redirectUri: string;
      /** The host's `error` in place of a code (`access_denied`, `redirect_uri_mismatch`). */
      readonly error?: unknown;
    },
  ): Promise<void>;
  /** Starts the device flow of the connection's app: the code the person enters on the host. */
  startDeviceFlow(
    userId: string,
    connectionId: string,
  ): Promise<GitDeviceAuthorization>;
  /** Asks the host once whether the person entered the code; stores their authorization once they did. */
  pollDeviceFlow(
    userId: string,
    connectionId: string,
    handle: unknown,
  ): Promise<GitDevicePoll>;
  /** Checks a personal access token by calling the host as it, then stores it as the person's authorization. */
  usePersonalToken(
    userId: string,
    connectionId: string,
    token: unknown,
  ): Promise<GitPersonalAuthorization>;
  disconnect(userId: string, connectionId: string): Promise<void>;
  // --- An app created from a manifest ----------------------------------------------------------------------------
  /** The form that creates an app on the host: owned by the person or an organization, sent back to `redirect`. */
  startAppManifest(
    userId: string,
    input: unknown,
    urls: AppManifestUrls,
  ): Promise<GitAppManifestForm>;
  /** The host sent the browser back with the app's code: store the app, then where to install it. */
  completeAppManifest(
    userId: string,
    input: { readonly code: unknown; readonly state: unknown },
  ): Promise<{ readonly connectionId: string; readonly installUrl: string }>;
  /**
   * The host sent the browser back after the app was installed: records the installation on the app's connection (or a
   * new connection for another account), checked with the app's own credentials.
   */
  completeInstallation(
    userId: string,
    input: { readonly installationId: unknown; readonly state: unknown },
  ): Promise<GitConnection>;
  /** The person's own authorization on a host, refreshed when it expired; null without one. */
  personalAuth(
    userId: string,
    apiBaseUrl: string,
  ): Promise<PersonalAuth | null>;
}

const invalid = (message: string, code = 'INVALID_GIT_CONNECTION') =>
  new ProtocolError('INVALID_REQUEST', message, { code });
const notFound = () =>
  new ProtocolError('NOT_FOUND', 'The connection was not found.', {
    code: 'GIT_CONNECTION_NOT_FOUND',
  });

/** The host's rate limit, as Studio answers it: `GITHUB_RATE_LIMITED` with when to try again. */
export function rateLimited(error: GitApiError): ProtocolError {
  return new ProtocolError(
    'CONFLICT',
    `GitHub's rate limit was reached; try again after ${error.retryAt}.`,
    {
      code: 'GITHUB_RATE_LIMITED',
      status: error.status,
      retryAt: error.retryAt,
    },
  );
}

function hostFailure(error: unknown): ProtocolError {
  if (error instanceof GitApiError && error.rateLimited)
    return rateLimited(error);
  if (error instanceof GitApiError) {
    const code =
      error.status === 401 || error.status === 403
        ? 'GITHUB_FORBIDDEN'
        : error.status === 404
          ? 'GITHUB_NOT_FOUND'
          : error.status === 422
            ? 'GITHUB_INVALID'
            : // Any other answer in 4xx is the host refusing, not the host out of reach.
              error.status >= 400 && error.status < 500
              ? 'GITHUB_REFUSED'
              : 'GITHUB_UNAVAILABLE';
    return new ProtocolError('CONFLICT', error.message, {
      code,
      status: error.status,
    });
  }
  if (error instanceof ProtocolError) return error;
  // A defect, not the host: kept as the cause so whoever logs the failure sees it.
  return Object.assign(
    new ProtocolError('INTERNAL_ERROR', 'The code host could not be reached.'),
    { cause: error },
  );
}

function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw invalid('The body must be a JSON object.');
  return input as Record<string, unknown>;
}

/** A field left out (undefined), cleared (null) or set (a trimmed string within `max`). */
function field(
  body: Record<string, unknown>,
  key: string,
  max: number,
): string | null | undefined {
  const value = body[key];
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') throw invalid(`${key} is a string or null.`);
  const trimmed = value.trim();
  if (trimmed.length > max)
    throw invalid(`${key} is at most ${max} characters.`);
  return trimmed === '' ? null : trimmed;
}

const REPO_NAME = /^[A-Za-z0-9._-]{1,100}$/u;
const REPO_FULL_NAME = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/u;

/** What Studio seals into a web flow's state or a device flow's handle: who, which connection, until when. */
interface AuthorizationState {
  readonly u?: unknown;
  readonly c?: unknown;
  readonly e?: unknown;
  /** A device flow's device code. */
  readonly d?: unknown;
  /** What else the state is for: `manifest` (creating an app) or `install` (installing it); absent for OAuth. */
  readonly k?: unknown;
  /** A manifest's host. */
  readonly w?: unknown;
  /** A manifest's organization, or null. */
  readonly o?: unknown;
  /** A manifest's provider. */
  readonly p?: unknown;
  /** Whether a manifest's webhook is on. */
  readonly h?: unknown;
}

/** Studio's URLs an app's manifest names, absolute. */
export interface AppManifestUrls {
  readonly homepage: string;
  /** Back from creating the app, with its code. */
  readonly redirect: string;
  /** Back from authorizing the app (`/oauth/git/callback`). */
  readonly callback: string;
  /** Back from installing the app. */
  readonly setup: string;
  /** The webhook of the connection the app becomes. */
  readonly webhook: (connectionId: string) => string;
  /** `app.publicOrigin`, when configured. */
  readonly publicOrigin: string | null;
}

/** How long the host's code for a created app lasts. */
const MANIFEST_TTL_MS = 60 * 60 * 1000;
/** How long a person may take to install an app they created. */
const INSTALL_TTL_MS = 24 * 60 * 60 * 1000;
const ACCOUNT_NAME = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/u;
const INSTALLATION_ID = /^\d{1,20}$/u;

/** An OAuth error code as the host writes one (`redirect_uri_mismatch`); anything else is not passed on. */
const HOST_ERROR = /^[A-Za-z0-9_.-]{1,64}$/u;

const hostErrorOf = (value: string): string =>
  HOST_ERROR.test(value) ? value : 'unknown';

/** The host refused the person's authorization, with the code it gave (`hostError`). */
const hostRefusedAuthorization = (hostError: string) => {
  const code = hostErrorOf(hostError);
  return new ProtocolError(
    'INVALID_REQUEST',
    `The host refused the authorization (${code}).`,
    { code: 'GIT_AUTHORIZATION_REFUSED', hostError: code },
  );
};

/** The app's device flow is off; `appSettingsUrl` is where it is turned on, when Studio knows the app's page. */
const deviceFlowDisabled = (appSettingsUrl: string | null) =>
  new ProtocolError(
    'INVALID_REQUEST',
    'The app does not allow the device flow: an administrator enables it in the app’s settings on the host (Enable Device Flow).',
    { code: 'GIT_DEVICE_FLOW_DISABLED', appSettingsUrl },
  );

/**
 * The host refused to start the device flow for another reason than the flow being off, or without saying which:
 * most often the app's device flow is off or the client id is not the app's.
 */
const deviceFlowRefused = (error: GitApiError, appSettingsUrl: string | null) =>
  new ProtocolError(
    'INVALID_REQUEST',
    `The host refused the device flow (${error.hostError ?? `HTTP ${error.status}`}): check that the app enables the device flow and that its client id is right.`,
    {
      code: 'GIT_DEVICE_FLOW_REFUSED',
      status: error.status,
      hostError: error.hostError ? hostErrorOf(error.hostError) : null,
      appSettingsUrl,
    },
  );

export function createGitConnections(deps: {
  readonly conn: () => DatabaseConnection;
  readonly providers: GitProviders;
  readonly secrets: GitSecrets;
  /** API base URLs by host (`studio.git.apiBaseUrls`). */
  readonly apiBaseUrls?: Readonly<Record<string, string>>;
  readonly webhookUrl?: (connectionId: string) => string;
  readonly callbackUrl?: () => string;
  readonly now?: () => Date;
}): GitConnections {
  const { providers, secrets } = deps;
  const on = (row: ConnectionRow) => providers.platformOf(row.provider);
  const methodsOf = (row: ConnectionRow) =>
    personalMethodsOf(row, on(row).descriptor.personalMethods);
  const conn = deps.conn;
  const now = deps.now ?? (() => new Date());
  /** The installation tokens app connections minted, kept until shortly before they expire. */
  const installationTokens = createInstallationTokens({ conn, secrets, now });

  /** A connection's credentials are bound to its id. */
  type ConnectionPurpose =
    | typeof P.privateKey
    | typeof P.clientSecret
    | typeof P.connectionToken
    | typeof P.connectionWebhookSecret;
  const openOf = (
    row: ConnectionRow,
    sealed: string | null,
    purpose: ConnectionPurpose,
  ): string | null => secrets.open(sealed, purpose, [row.id]);
  const sealFor = (
    connectionId: string,
    value: string,
    purpose: ConnectionPurpose,
  ): string => secrets.seal(value, purpose, [connectionId]);

  /** The app's credentials of `source`, sealed again for the connection `connectionId`. */
  function credentialsOf(source: ConnectionRow, connectionId: string) {
    const again = (sealed: string | null, purpose: ConnectionPurpose) => {
      const value = openOf(source, sealed, purpose);
      if (sealed && value === null)
        throw new ProtocolError(
          'CONFLICT',
          'The app’s credentials cannot be read: remove its connection and add it again.',
          { code: 'GIT_CONNECTION_INCOMPLETE' },
        );
      return value === null ? null : sealFor(connectionId, value, purpose);
    };
    return {
      privateKeySealed: again(source.privateKeySealed, P.privateKey),
      clientSecretSealed: again(source.clientSecretSealed, P.clientSecret),
      webhookSecretSealed: again(
        source.webhookSecretSealed,
        P.connectionWebhookSecret,
      ),
    };
  }

  /** Sealed and encoded for a URL or a handle, valid `ttl` milliseconds. */
  function sealState(
    values: {
      readonly u: string;
      readonly c: string;
      readonly d?: string;
      readonly k?: 'manifest' | 'install';
      readonly w?: string;
      readonly o?: string | null;
      readonly p?: string;
      readonly h?: boolean;
    },
    ttl: number,
  ): string {
    const sealed = secrets.seal(
      JSON.stringify({
        ...values,
        e: now().getTime() + ttl,
        n: randomBytes(8).toString('hex'),
      }),
      P.authorizationState,
      [],
    );
    return Buffer.from(sealed).toString('base64url');
  }

  /** The state Studio sealed into the authorization URL; null when it is not one. */
  function openState(value: string): AuthorizationState | null {
    try {
      const opened = secrets.open(
        Buffer.from(value, 'base64url').toString('utf8'),
        P.authorizationState,
        [],
      );
      return opened ? (JSON.parse(opened) as AuthorizationState) : null;
    } catch {
      return null;
    }
  }

  function appOf(row: ConnectionRow): AppCredentials {
    if (row.demo) throw demoConnection(row);
    const privateKey = openOf(row, row.privateKeySealed, P.privateKey);
    if (!row.appId || !privateKey)
      throw new ProtocolError(
        'CONFLICT',
        'The app connection has no app id or private key.',
        { code: 'GIT_CONNECTION_INCOMPLETE' },
      );
    return {
      apiBaseUrl: row.apiBaseUrl,
      appId: row.appId,
      privateKey,
      tokenCache: installationTokens.of(row.id),
    };
  }

  async function authOf(row: ConnectionRow): Promise<GitAuth> {
    if (row.demo) throw demoConnection(row);
    if (row.kind === 'token')
      return {
        apiBaseUrl: row.apiBaseUrl,
        token: openOf(row, row.tokenSealed, P.connectionToken),
      };
    if (!row.installationId)
      throw new ProtocolError(
        'CONFLICT',
        'The app connection has no installation.',
        { code: 'GIT_CONNECTION_INCOMPLETE' },
      );
    // The platform reuses a token it keeps in the connection's cache (`appOf`).
    const token = await on(row).installationToken(
      appOf(row),
      row.installationId,
    );
    return { apiBaseUrl: row.apiBaseUrl, token: token.token };
  }

  function appPages(
    row: ConnectionRow,
  ): Pick<GitConnection, 'appSlug' | 'installUrl' | 'appSettingsUrl'> {
    if (row.kind !== 'app' || !row.appSlug)
      return { appSlug: null, installUrl: null, appSettingsUrl: null };
    const urls = on(row).appUrls(row.webUrl, {
      slug: row.appSlug,
      organization: row.appOrganization,
    });
    return {
      appSlug: row.appSlug,
      installUrl: urls.install,
      appSettingsUrl: urls.settings,
    };
  }

  /** What an app connection's installation was granted, read from the host at most every `GRANTS_TTL_MS`. */
  const grants = new Map<
    string,
    {
      readonly at: number;
      readonly missing: readonly string[];
      readonly url: string | null;
    }
  >();

  async function grantsOf(row: ConnectionRow): Promise<{
    readonly missing: readonly string[];
    readonly url: string | null;
  }> {
    const none = { missing: [], url: null };
    if (
      row.demo ||
      row.kind !== 'app' ||
      !row.installationId ||
      !row.privateKeySealed
    )
      return none;
    const cached = grants.get(row.id);
    if (cached && now().getTime() - cached.at < GRANTS_TTL_MS) return cached;
    try {
      const platform = on(row);
      const found = await platform.getInstallation(
        appOf(row),
        row.installationId,
      );
      const entry = {
        at: now().getTime(),
        missing: found ? platform.missingPermissions(found.permissions) : [],
        url: found?.htmlUrl ?? null,
      };
      grants.set(row.id, entry);
      return entry;
    } catch {
      // The host could not be asked: say nothing is missing rather than fail the page.
      return none;
    }
  }

  function view(
    row: ConnectionRow,
    usedBy = 0,
    granted: {
      readonly missing: readonly string[];
      readonly url: string | null;
    } = { missing: [], url: null },
  ): GitConnection {
    return {
      ...choiceOf(row, granted.url),
      appId: row.appId,
      clientId: row.clientId,
      installationId: row.installationId,
      hasPrivateKey: !!row.privateKeySealed,
      hasClientSecret: !!row.clientSecretSealed,
      hasToken: !!row.tokenSealed,
      hasWebhookSecret: !!row.webhookSecretSealed,
      webhookUrl:
        row.kind === 'app'
          ? (deps.webhookUrl?.(row.id) ??
            `/api/webhooks/${row.provider}/connections/${encodeURIComponent(row.id)}`)
          : null,
      callbackUrl: row.kind === 'app' ? (deps.callbackUrl?.() ?? null) : null,
      ...appPages(row),
      personalMethods: methodsOf(row),
      allowPersonalTokens: row.allowPersonalTokens,
      lastDelivery: row.lastDelivery,
      lastReceivedAt: row.lastReceivedAt,
      usedBy,
      missingPermissions: granted.missing,
      permissionsUrl: granted.url,
      updatedAt: row.updatedAt,
    };
  }

  async function viewOf(row: ConnectionRow): Promise<GitConnection> {
    return view(
      row,
      (await usage(conn())).get(row.id) ?? 0,
      await grantsOf(row),
    );
  }

  async function required(id: string): Promise<ConnectionRow> {
    const row = await findConnection(conn(), id);
    if (!row) throw notFound();
    return row;
  }

  /** The columns `input` changes, sealed; what an app is missing is checked once the row is whole. */
  function changes(
    provider: GitProvider,
    input: Record<string, unknown>,
    connectionId: string,
  ): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    const platform = providers.platformOf(provider);
    const name = field(input, 'name', 255);
    if (name !== undefined) {
      if (!name) throw invalid('A connection needs a name.');
      values.name = name;
    }
    const webUrl = field(input, 'webUrl', 255);
    if (webUrl !== undefined) {
      const origin = webUrl ?? platform.descriptor.defaultWebUrl;
      if (!URL.canParse(origin) || !/^https?:$/u.test(new URL(origin).protocol))
        throw invalid('webUrl is the http(s) origin of the host.');
      values.webUrl = new URL(origin).origin;
      values.apiBaseUrl = platform.apiBaseUrlOf(
        new URL(origin).origin,
        deps.apiBaseUrls,
      );
    }
    if (input.allowPersonalTokens !== undefined) {
      if (typeof input.allowPersonalTokens !== 'boolean')
        throw invalid('allowPersonalTokens is true or false.');
      values.allowPersonalTokens = input.allowPersonalTokens;
    }
    for (const [key, max] of [
      ['account', 255],
      ['appId', 64],
      ['installationId', 64],
      ['clientId', 255],
    ] as const) {
      const value = field(input, key, max);
      if (value !== undefined) values[key] = value;
    }
    for (const [key, column, purpose, max, min] of [
      ['privateKey', 'privateKeySealed', P.privateKey, GIT_PRIVATE_KEY_MAX, 1],
      ['clientSecret', 'clientSecretSealed', P.clientSecret, GIT_TOKEN_MAX, 1],
      ['token', 'tokenSealed', P.connectionToken, GIT_TOKEN_MAX, 1],
      [
        'webhookSecret',
        'webhookSecretSealed',
        P.connectionWebhookSecret,
        WEBHOOK_SECRET_MAX,
        WEBHOOK_SECRET_MIN,
      ],
    ] as const) {
      const value = field(input, key, max);
      if (value === undefined) continue;
      if (value === null) {
        values[column] = null;
        continue;
      }
      if (value.length < min)
        throw invalid(`${key} is at least ${min} characters.`);
      values[column] = sealFor(connectionId, value, purpose);
    }
    return values;
  }

  /** An app without an installation id finds it from its account; every kind checks what it cannot work without. */
  async function complete(id: string): Promise<void> {
    const row = await required(id);
    if (row.demo) return;
    if (row.kind === 'token') {
      if (!row.tokenSealed)
        throw invalid('A token connection needs its token.');
      if (!row.account) {
        // The token's own account, so a new repository's default owner is known.
        const user = await on(row)
          .currentUser(await authOf(row))
          .catch((error: unknown) => {
            throw hostFailure(error);
          });
        await updateConnectionRow(conn(), id, { account: user.login });
      }
      return;
    }
    if (!row.appId || !row.privateKeySealed)
      throw invalid('An app connection needs its app id and private key.');
    if (!row.installationId) {
      if (!row.account)
        throw invalid(
          'Name the account the app is installed on, or its installation id.',
        );
      let found: string | null;
      try {
        found = await on(row).findInstallation(appOf(row), row.account);
      } catch (error) {
        throw hostFailure(error);
      }
      if (!found)
        throw invalid(
          `The app is not installed on ${row.account}.`,
          'GITHUB_APP_NOT_INSTALLED',
        );
      await updateConnectionRow(conn(), id, { installationId: found });
    }
    await installationTokens.forget(id);
  }

  async function personalAuthOf(
    row: UserAuthRow,
  ): Promise<PersonalAuth | null> {
    const connection = await findConnection(conn(), row.connectionId);
    if (!connection) return null;
    const aad = [row.userId, row.connectionId];
    let token = secrets.open(row.accessTokenSealed, P.accessToken, aad);
    if (!token) return null;
    if (
      row.expiresAt &&
      new Date(row.expiresAt).getTime() - 60_000 <= now().getTime()
    ) {
      // A personal access token cannot be refreshed: as without an authorization until they paste a new one.
      if (row.method === 'token') return null;
      const refresh = secrets.open(row.refreshTokenSealed, P.refreshToken, aad);
      const secret = openOf(
        connection,
        connection.clientSecretSealed,
        P.clientSecret,
      );
      if (!refresh || !secret || !connection.clientId) return null;
      try {
        const tokens = await on(connection).refreshToken(
          {
            webUrl: connection.webUrl,
            clientId: connection.clientId,
            clientSecret: secret,
          },
          refresh,
        );
        await storeTokens(row.userId, connection, tokens, null, null);
        token = tokens.accessToken;
      } catch {
        // Refused (revoked, the refresh token expired): as without an authorization until they connect again.
        return null;
      }
    }
    return {
      auth: { apiBaseUrl: connection.apiBaseUrl, token },
      user: { login: row.login, name: row.name, email: row.email },
      connectionId: connection.id,
    };
  }

  async function storeTokens(
    userId: string,
    connection: ConnectionRow,
    tokens: {
      readonly accessToken: string;
      readonly refreshToken: string | null;
      readonly expiresAt: string | null;
      readonly refreshExpiresAt: string | null;
    },
    user: PlatformUser | null,
    method: GitPersonalMethod | null,
  ): Promise<void> {
    const aad = [userId, connection.id];
    const values = {
      accessTokenSealed: secrets.seal(tokens.accessToken, P.accessToken, aad),
      refreshTokenSealed: tokens.refreshToken
        ? secrets.seal(tokens.refreshToken, P.refreshToken, aad)
        : null,
      expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
      refreshExpiresAt: tokens.refreshExpiresAt
        ? new Date(tokens.refreshExpiresAt)
        : null,
      updatedAt: now(),
      ...(method ? { method } : {}),
      ...(user
        ? {
            providerUserId: user.id.slice(0, 64),
            login: user.login.slice(0, 255),
            name: user.name?.slice(0, 255) ?? null,
            email: user.email.slice(0, 255),
          }
        : {}),
    };
    const existing = await conn()
      .query.selectFrom(USER_AUTHS)
      .select('id')
      .where('userId', '=', userId)
      .where('connectionId', '=', connection.id)
      .executeTakeFirst();
    if (existing) {
      await conn()
        .query.updateTable(USER_AUTHS)
        .set(values)
        .where('id', '=', String(existing.id))
        .execute();
      return;
    }
    if (!user || !method) return;
    try {
      await conn().transaction(async (inner) => {
        await inner.query
          .insertInto(USER_AUTHS)
          .values({
            id: randomUUID(),
            userId,
            connectionId: connection.id,
            createdAt: now(),
            ...values,
          })
          .execute();
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      await storeTokens(userId, connection, tokens, user, method);
    }
  }

  /** A person's authorization as their settings show it, named by `connectionId` (an app's entry). */
  function authorizationOf(
    row: UserAuthRow,
    connectionId: string,
  ): GitPersonalAuthorization {
    return {
      connectionId,
      login: row.login,
      name: row.name,
      email: row.email,
      method: row.method,
      connectedAt: row.createdAt,
      // A token, or an OAuth authorization without a way to refresh it, stops working at its expiry.
      expiresAt:
        row.method === 'token' || !row.refreshTokenSealed
          ? row.expiresAt
          : row.refreshExpiresAt,
    };
  }

  async function ownAuthorization(
    userId: string,
    connection: ConnectionRow,
  ): Promise<GitPersonalAuthorization | null> {
    const found = await conn()
      .query.selectFrom(USER_AUTHS)
      .selectAll()
      .where('userId', '=', userId)
      .where('connectionId', '=', connection.id)
      .executeTakeFirst();
    return found ? authorizationOf(userAuthOf(found), connection.id) : null;
  }

  async function personalAuth(userId: string, apiBaseUrl: string) {
    const rows = (
      await conn()
        .query.selectFrom(USER_AUTHS)
        .selectAll()
        .where('userId', '=', userId)
        .orderBy('createdAt', 'asc')
        .execute()
    ).map(userAuthOf);
    for (const row of rows) {
      const connection = await findConnection(conn(), row.connectionId);
      if (connection?.apiBaseUrl !== apiBaseUrl) continue;
      const found = await personalAuthOf(row);
      if (found) return found;
    }
    return null;
  }

  async function connectionAuth(repo: {
    readonly connectionId: string | null;
    readonly apiBaseUrl: string;
  }): Promise<ActingAuth> {
    const connection = repo.connectionId
      ? await findConnection(conn(), repo.connectionId)
      : null;
    if (!connection)
      return { auth: { apiBaseUrl: repo.apiBaseUrl, token: null }, as: 'none' };
    return { auth: await authOf(connection), as: 'connection' };
  }

  /**
   * A template repository through the connection: any it can read, public ones of other accounts included. Missing,
   * it is refused as input (400), or as the resource a URL names (`asResource`, 404).
   */
  async function templateRepoOf(
    row: ConnectionRow,
    fullName: string,
    options: { readonly asResource?: boolean } = {},
  ): Promise<GitRepoChoice> {
    if (!REPO_FULL_NAME.test(fullName))
      throw invalid(
        'Name the template repository as owner/name.',
        'INVALID_TEMPLATE_REPO',
      );
    let found: RepoSummary | null;
    try {
      found = await on(row).getRepo(await authOf(row), fullName);
    } catch (error) {
      throw hostFailure(error);
    }
    if (!found) {
      const message = `The connection reaches no repository ${fullName}.`;
      throw options.asResource
        ? new ProtocolError('NOT_FOUND', message, {
            code: 'TEMPLATE_REPO_NOT_FOUND',
          })
        : invalid(message, 'TEMPLATE_REPO_NOT_FOUND');
    }
    if (!found.isTemplate)
      throw invalid(
        `${fullName} is not a template repository: mark it as one in its settings on GitHub.`,
        'NOT_A_TEMPLATE_REPO',
      );
    return repoChoice(found);
  }

  function repoChoice(repo: RepoSummary): GitRepoChoice {
    return { ...repo };
  }

  /** Runs `work` on a repository through the connection, its host's failures turned into Studio's. */
  async function onRepo<T>(
    id: string,
    fullName: string,
    work: (platform: GitPlatform, auth: GitAuth) => Promise<T>,
  ): Promise<T> {
    const row = await required(id);
    if (!REPO_FULL_NAME.test(fullName))
      throw invalid('Name the repository as owner/name.', 'INVALID_REPO');
    try {
      return await work(on(row), await authOf(row));
    } catch (error) {
      throw hostFailure(error);
    }
  }

  return {
    async list() {
      const counts = await usage(conn());
      return Promise.all(
        (await listConnections(conn())).map(async (row) =>
          view(row, counts.get(row.id) ?? 0, await grantsOf(row)),
        ),
      );
    },

    async get(id) {
      return viewOf(await required(id));
    },

    async uses(id) {
      await required(id);
      const rows = await conn()
        .query.selectFrom('pmProjectResources as resource')
        .innerJoin('pmProjects as project', 'project.id', 'resource.projectId')
        .select([
          'resource.id as resourceId',
          'project.id as projectId',
          'project.name as projectName',
          'resource.bindingFullName as repo',
        ])
        .where('resource.bindingConnectionId', '=', id)
        .where('resource.bindingFullName', 'is not', null)
        .execute<Row>();
      return rows
        .map((row) => ({
          resourceId: String(row.resourceId),
          projectId: String(row.projectId),
          projectName: String(row.projectName),
          repo: String(row.repo),
        }))
        .sort(
          (a, b) =>
            a.repo.toLowerCase().localeCompare(b.repo.toLowerCase()) ||
            a.projectName.localeCompare(b.projectName),
        );
    },

    async reach(id) {
      const row = await required(id);
      try {
        const auth = await authOf(row);
        if (row.kind === 'app') {
          const first = await on(row).listRepos(auth, 'installation', {
            page: 1,
            perPage: 1,
          });
          return {
            repositories: first.total ?? first.items.length,
            more: first.total === null && first.hasMore,
          };
        }
        // A token's list says no total: count its pages, up to the search's limit.
        let repositories = 0;
        let more = true;
        for (let at = 1; more && at <= SEARCH_PAGES; at += 1) {
          const found = await on(row).listRepos(auth, 'user', {
            page: at,
            perPage: SEARCH_PAGE,
          });
          repositories += found.items.length;
          more = found.hasMore;
        }
        return { repositories, more };
      } catch (error) {
        throw hostFailure(error);
      }
    },

    async create(userId, raw) {
      const input = record(raw);
      const provider = input.provider ?? 'github';
      if (typeof provider !== 'string' || !providers.has(provider))
        throw invalid('provider names a code host Studio knows.');
      const kind = input.kind;
      if (
        (kind !== 'app' && kind !== 'token') ||
        !providers
          .platformOf(provider)
          .descriptor.connectionKinds.includes(kind)
      )
        throw invalid(
          `kind is ${providers.platformOf(provider).descriptor.connectionKinds.join(' or ')}.`,
        );
      const id = randomUUID();
      let values: Record<string, unknown>;
      if (input.sameAppAs !== undefined) {
        // Another installation of an app already connected: its credentials stay on the server.
        const source =
          typeof input.sameAppAs === 'string'
            ? await findConnection(conn(), input.sameAppAs)
            : null;
        if (
          kind !== 'app' ||
          source?.kind !== 'app' ||
          source.provider !== provider
        )
          throw invalid('sameAppAs names an app connection.');
        const extra = Object.keys(input).filter(
          (key) =>
            ![
              'provider',
              'kind',
              'sameAppAs',
              'name',
              'account',
              'installationId',
            ].includes(key),
        );
        if (extra.length > 0)
          throw invalid(
            `Another installation takes only its name and account (not ${extra.join(', ')}).`,
          );
        values = {
          webUrl: source.webUrl,
          apiBaseUrl: source.apiBaseUrl,
          appId: source.appId,
          clientId: source.clientId,
          appSlug: source.appSlug,
          appOrganization: source.appOrganization,
          ...credentialsOf(source, id),
          allowPersonalTokens: source.allowPersonalTokens,
          ...changes(
            provider,
            {
              name: input.name,
              account: input.account,
              installationId: input.installationId,
            },
            id,
          ),
        };
        const installation = str(values.installationId) ?? '';
        const account = (str(values.account) ?? '').toLowerCase();
        if (
          (await listConnections(conn())).some(
            (other) =>
              sameApp(source, other) &&
              ((installation && other.installationId === installation) ||
                (account && other.account?.toLowerCase() === account)),
          )
        )
          throw invalid(
            'The app is connected on that account already.',
            'GIT_INSTALLATION_EXISTS',
          );
      } else
        values = changes(
          provider,
          {
            ...input,
            webUrl:
              input.webUrl ??
              providers.platformOf(provider).descriptor.defaultWebUrl,
          },
          id,
        );
      if (!values.name) throw invalid('A connection needs a name.');
      const at = now();
      await conn()
        .query.insertInto(CONNECTIONS)
        .values({
          id,
          provider,
          kind,
          account: null,
          appId: null,
          installationId: null,
          clientId: null,
          appSlug: null,
          appOrganization: null,
          privateKeySealed: null,
          clientSecretSealed: null,
          tokenSealed: null,
          webhookSecretSealed: null,
          allowPersonalTokens: true,
          webhookAt: null,
          webhookEvent: null,
          webhookStatus: null,
          webhookReason: null,
          createdById: userId,
          createdAt: at,
          updatedAt: at,
          ...values,
        })
        .execute();
      try {
        await complete(id);
      } catch (error) {
        await conn()
          .query.deleteFrom(CONNECTIONS)
          .where('id', '=', id)
          .execute();
        throw error;
      }
      return viewOf(await required(id));
    },

    async createDemo(userId, input) {
      const existing = (await listConnections(conn())).find(
        (row) =>
          row.demo &&
          row.account?.toLowerCase() === input.account.toLowerCase(),
      );
      if (existing) return existing;
      const id = randomUUID();
      const at = now();
      await conn()
        .query.insertInto(CONNECTIONS)
        .values({
          id,
          provider: 'github',
          kind: 'token',
          name: input.name,
          webUrl: input.webUrl,
          apiBaseUrl: input.apiBaseUrl,
          account: input.account,
          appId: null,
          installationId: null,
          clientId: null,
          appSlug: null,
          appOrganization: null,
          privateKeySealed: null,
          clientSecretSealed: null,
          tokenSealed: sealFor(
            id,
            'demo-token-not-a-real-credential',
            P.connectionToken,
          ),
          webhookSecretSealed: null,
          allowPersonalTokens: false,
          demo: true,
          webhookAt: null,
          webhookEvent: null,
          webhookStatus: null,
          webhookReason: null,
          createdById: userId,
          createdAt: at,
          updatedAt: at,
        })
        .execute();
      return required(id);
    },

    async update(id, raw) {
      const row = await required(id);
      const input = record(raw);
      if (input.kind !== undefined && input.kind !== row.kind)
        throw invalid('A connection keeps its kind.');
      if (input.provider !== undefined && input.provider !== row.provider)
        throw invalid('A connection keeps its provider.');
      const values = changes(row.provider, input, row.id);
      if ('webhookSecretSealed' in values)
        Object.assign(values, {
          webhookAt: null,
          webhookEvent: null,
          webhookStatus: null,
          webhookReason: null,
        });
      await updateConnectionRow(conn(), id, values);
      await complete(id);
      return viewOf(await required(id));
    },

    async remove(id) {
      await required(id);
      await conn()
        .query.deleteFrom(USER_AUTHS)
        .where('connectionId', '=', id)
        .execute();
      await conn()
        .query.updateTable('studioGitRepos')
        .set({ connectionId: null, listEtag: null, updatedAt: now() })
        .where('connectionId', '=', id)
        .execute();
      await conn().query.deleteFrom(CONNECTIONS).where('id', '=', id).execute();
      await installationTokens.forget(id);
    },

    async choices() {
      // An installation's page as the host last answered it (`grantsOf`, cached) when known: listing never asks.
      return (await listConnections(conn()))
        .filter((row) => !awaitingInstallation(row))
        .map((row) => choiceOf(row, grants.get(row.id)?.url ?? null));
    },

    find: (id) => findConnection(conn(), id),

    authOf,

    connectionAuth,

    async actingAuth(repo, userId) {
      // Never a person's own token on a demo repository: nothing of it is on a host.
      const through = repo.connectionId
        ? await findConnection(conn(), repo.connectionId)
        : null;
      if (through?.demo) throw demoConnection(through);
      if (userId) {
        const own = await personalAuth(userId, repo.apiBaseUrl);
        if (own) return { auth: own.auth, as: 'user' };
      }
      return connectionAuth(repo);
    },

    async pushCredential(connectionId, repos) {
      const row = await findConnection(conn(), connectionId);
      if (!row) throw notFound();
      if (row.kind !== 'app' || repos.length === 0) return null;
      if (!row.installationId)
        throw new ProtocolError(
          'CONFLICT',
          'The app connection has no installation.',
          { code: 'GIT_CONNECTION_INCOMPLETE' },
        );
      // A claim prepares one for every attempt, most of them skipped: the platform reuses a kept token.
      const token = await on(row).installationToken(
        appOf(row),
        row.installationId,
        { repositories: [...new Set(repos)].sort() },
      );
      return on(row).pushCredential(token);
    },

    webhookSecretOf: (row) =>
      openOf(row, row.webhookSecretSealed, P.connectionWebhookSecret),

    async listRepos(id, input) {
      const row = await required(id);
      const source = row.kind === 'app' ? 'installation' : 'user';
      const page = Math.max(1, Math.floor(Number(input.page ?? 1)) || 1);
      const query = (input.query ?? '').trim().toLowerCase();
      try {
        const auth = await authOf(row);
        if (!query) {
          const found = await on(row).listRepos(auth, source, {
            page,
            perPage: REPO_PAGE,
          });
          return { items: found.items.map(repoChoice), hasMore: found.hasMore };
        }
        const matches: RepoSummary[] = [];
        let more = true;
        for (let at = 1; more && at <= SEARCH_PAGES; at += 1) {
          const found = await on(row).listRepos(auth, source, {
            page: at,
            perPage: SEARCH_PAGE,
          });
          matches.push(
            ...found.items.filter((repo) =>
              repo.fullName.toLowerCase().includes(query),
            ),
          );
          more = found.hasMore;
        }
        const start = (page - 1) * REPO_PAGE;
        return {
          items: matches.slice(start, start + REPO_PAGE).map(repoChoice),
          hasMore: matches.length > start + REPO_PAGE,
        };
      } catch (error) {
        throw hostFailure(error);
      }
    },

    async createRepo(id, raw) {
      const row = await required(id);
      const input = record(raw) as Partial<CreateGitRepoRequest>;
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      if (!REPO_NAME.test(name))
        throw invalid(
          'A repository name is 1 to 100 letters, digits, dots, dashes or underscores.',
          'INVALID_REPO_NAME',
        );
      if (typeof input.private !== 'boolean')
        throw invalid('private is true or false.', 'INVALID_REPO_NAME');
      const owner =
        (typeof input.owner === 'string' && input.owner.trim()) ||
        row.account ||
        '';
      if (!owner)
        throw invalid('Name the repository’s owner.', 'INVALID_REPO_NAME');
      const description =
        typeof input.description === 'string' && input.description.trim()
          ? input.description.trim().slice(0, 350)
          : null;
      try {
        const auth = await authOf(row);
        // An installation creates repositories in its organization; a token in its own account unless named otherwise.
        const organization =
          row.kind === 'app' ||
          owner.toLowerCase() !==
            (await on(row).currentUser(auth)).login.toLowerCase();
        const created = await on(row).createRepo(auth, {
          owner,
          organization,
          name,
          private: input.private,
          description,
          ...(input.empty === true ? { empty: true } : {}),
        });
        return { repo: repoChoice(created.repo), protected: created.protected };
      } catch (error) {
        throw hostFailure(error);
      }
    },

    async templateRepo(id, fullName, options) {
      return templateRepoOf(await required(id), fullName, options);
    },

    async generateRepo(id, raw) {
      const row = await required(id);
      const input = record(raw) as Partial<GenerateGitRepoRequest>;
      const template =
        typeof input.template === 'string' ? input.template.trim() : '';
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      if (!REPO_NAME.test(name))
        throw invalid(
          'A repository name is 1 to 100 letters, digits, dots, dashes or underscores.',
          'INVALID_REPO_NAME',
        );
      if (typeof input.private !== 'boolean')
        throw invalid('private is true or false.', 'INVALID_REPO_NAME');
      const owner =
        (typeof input.owner === 'string' && input.owner.trim()) ||
        row.account ||
        '';
      if (!owner)
        throw invalid('Name the repository’s owner.', 'INVALID_REPO_NAME');
      const source = await templateRepoOf(row, template);
      try {
        const created = await on(row).generateRepo(
          await authOf(row),
          source.fullName,
          {
            owner,
            name,
            private: input.private,
            description:
              typeof input.description === 'string' && input.description.trim()
                ? input.description.trim().slice(0, 350)
                : null,
          },
        );
        return { repo: repoChoice(created), protected: false };
      } catch (error) {
        throw hostFailure(error);
      }
    },

    async templateRepos(id, input) {
      const row = await required(id);
      const source = row.kind === 'app' ? 'installation' : 'user';
      const page = Math.max(1, Math.floor(Number(input.page ?? 1)) || 1);
      const query = (input.query ?? '').trim().toLowerCase();
      try {
        // One page of the host's at a time: the browser asks for the next while it needs more, so opening the form
        // never waits for every repository the connection reaches.
        const found = await on(row).listRepos(await authOf(row), source, {
          page,
          perPage: TEMPLATE_SOURCE_PAGE,
        });
        return {
          items: found.items
            .filter(
              (repo) =>
                repo.isTemplate &&
                (!query || repo.fullName.toLowerCase().includes(query)),
            )
            .map(repoChoice),
          hasMore: found.hasMore,
        };
      } catch (error) {
        throw hostFailure(error);
      }
    },

    async workflows(id, fullName) {
      const row = await required(id);
      if (!REPO_FULL_NAME.test(fullName))
        throw invalid('Name the repository as owner/name.', 'INVALID_REPO');
      try {
        return await on(row).listWorkflows(await authOf(row), fullName);
      } catch (error) {
        throw hostFailure(error);
      }
    },

    async latestWorkflowRun(id, fullName, workflowId) {
      const row = await required(id);
      try {
        return await on(row).latestWorkflowRun(
          await authOf(row),
          fullName,
          workflowId,
        );
      } catch (error) {
        throw hostFailure(error);
      }
    },

    async rerunWorkflowRun(id, fullName, runId) {
      const row = await required(id);
      try {
        await on(row).rerunWorkflowRun(await authOf(row), fullName, runId);
      } catch (error) {
        throw hostFailure(error);
      }
    },

    async protectBranch(id, fullName, branch) {
      const row = await required(id);
      return on(row).protectBranch(await authOf(row), fullName, branch);
    },

    async readFile(id, fullName, path, branch) {
      return onRepo(id, fullName, (platform, auth) =>
        platform.readFile(auth, fullName, path, branch),
      );
    },

    async putFile(id, fullName, input) {
      return onRepo(id, fullName, (platform, auth) =>
        platform.putFile(auth, fullName, input),
      );
    },

    async branchSha(id, fullName, branch) {
      return onRepo(id, fullName, (platform, auth) =>
        platform.branchSha(auth, fullName, branch),
      );
    },

    async createBranch(id, fullName, input) {
      await onRepo(id, fullName, (platform, auth) =>
        platform.createBranch(auth, fullName, input),
      );
    },

    async openPullRequest(id, fullName, input) {
      return onRepo(
        id,
        fullName,
        async (platform, auth) =>
          (await platform.openPullRequest(auth, fullName, input)).snapshot,
      );
    },

    async getPullRequest(id, fullName, number) {
      return onRepo(id, fullName, async (platform, auth) => {
        const answer = await platform.getPullRequest(
          auth,
          fullName,
          number,
          null,
        );
        return answer.notModified ? null : answer.body.snapshot;
      });
    },

    async setCiSecret(id, fullName, input) {
      const row = await required(id);
      const descriptor = on(row).descriptor;
      if (!descriptor.capabilities.ciSecrets)
        throw invalid(
          `${descriptor.label} does not take CI secrets from Studio.`,
          'CI_SECRETS_UNSUPPORTED',
        );
      const missing = (await grantsOf(row)).missing.filter((item) =>
        item.startsWith('secrets:'),
      );
      if (missing.length > 0)
        throw new ProtocolError(
          'CONFLICT',
          `The connection ${row.name} may not write repository secrets yet: accept the app’s new permission (${missing.join(', ')}) on ${descriptor.label}.`,
          { code: 'GIT_PERMISSION_MISSING' },
        );
      await onRepo(id, fullName, (platform, auth) =>
        platform.setCiSecret(auth, fullName, input),
      );
    },

    async personal(userId) {
      const connections = await listConnections(conn());
      const rows = (
        await conn()
          .query.selectFrom(USER_AUTHS)
          .selectAll()
          .where('userId', '=', userId)
          .orderBy('createdAt', 'asc')
          .execute()
      ).map(userAuthOf);
      // One entry per app: its installations share its OAuth client, so authorizing one authorizes the app.
      const hosts = connections.filter(
        (row, index, all) =>
          !awaitingInstallation(row) &&
          all.findIndex(
            (other) => other.id === row.id || sameApp(row, other),
          ) === index,
      );
      // Only what the person can link, or has linked: an authorization stays listed so it can be disconnected.
      return {
        hosts: hosts.flatMap((host) => {
          const own = rows.find((item) => {
            const through = connections.find(
              (other) => other.id === item.connectionId,
            );
            return (
              !!through && (through.id === host.id || sameApp(host, through))
            );
          });
          const methods = methodsOf(host);
          if (methods.length === 0 && !own) return [];
          return [
            {
              connection: choiceOf(host),
              methods,
              authorization: own ? authorizationOf(own, host.id) : null,
            },
          ];
        }),
      };
    },

    async authorizeUrl(userId, connectionId, redirectUri) {
      const row = await required(connectionId);
      if (row.demo) throw demoConnection(row);
      if (!methodsOf(row).includes('oauth') || !row.clientId)
        throw invalid(
          'This connection cannot be authorized by people.',
          'GIT_PERSONAL_UNAVAILABLE',
        );
      return on(row).authorizeUrl(
        { webUrl: row.webUrl, clientId: row.clientId },
        {
          redirectUri,
          state: sealState({ u: userId, c: connectionId }, STATE_TTL_MS),
        },
      );
    },

    async startDeviceFlow(userId, connectionId) {
      const row = await required(connectionId);
      if (row.demo) throw demoConnection(row);
      if (!methodsOf(row).includes('device') || !row.clientId)
        throw invalid(
          'This connection has no app people can authorize with a code.',
          'GIT_PERSONAL_UNAVAILABLE',
        );
      let started;
      try {
        started = await on(row).startDeviceAuthorization({
          webUrl: row.webUrl,
          clientId: row.clientId,
        });
      } catch (error) {
        // A refusal is not GitHub being unreachable: say what the host answered, and where the app is set up.
        if (
          error instanceof GitApiError &&
          !error.rateLimited &&
          error.status >= 400 &&
          error.status < 500
        )
          throw deviceFlowRefused(error, appPages(row).appSettingsUrl);
        throw hostFailure(error);
      }
      if (!started) throw deviceFlowDisabled(appPages(row).appSettingsUrl);
      const ttl = started.expiresIn * 1000;
      return {
        handle: sealState(
          { u: userId, c: connectionId, d: started.deviceCode },
          ttl,
        ),
        userCode: started.userCode,
        verificationUri: started.verificationUri,
        expiresAt: new Date(now().getTime() + ttl).toISOString(),
        interval: started.interval,
      };
    },

    async pollDeviceFlow(userId, connectionId, handle) {
      const state = typeof handle === 'string' ? openState(handle) : null;
      if (
        !state ||
        state.u !== userId ||
        state.c !== connectionId ||
        typeof state.d !== 'string'
      )
        throw invalid(
          'The code was not issued here.',
          'GIT_AUTHORIZATION_FAILED',
        );
      if (typeof state.e !== 'number' || state.e < now().getTime())
        return { status: 'expired' };
      const row = await required(connectionId);
      if (row.demo) throw demoConnection(row);
      if (!row.clientId)
        throw invalid(
          'This connection has no app people can authorize with a code.',
          'GIT_PERSONAL_UNAVAILABLE',
        );
      const client = { webUrl: row.webUrl, clientId: row.clientId };
      try {
        const polled = await on(row).pollDeviceAuthorization(client, state.d);
        if (polled.status === 'disabled')
          throw deviceFlowDisabled(appPages(row).appSettingsUrl);
        if (polled.status !== 'granted')
          return {
            status: polled.status,
            ...(polled.interval ? { interval: polled.interval } : {}),
          };
        const user = await on(row).currentUser({
          apiBaseUrl: row.apiBaseUrl,
          token: polled.tokens.accessToken,
        });
        await storeTokens(userId, row, polled.tokens, user, 'device');
      } catch (error) {
        throw hostFailure(error);
      }
      const stored = await ownAuthorization(userId, row);
      return {
        status: 'connected',
        ...(stored ? { authorization: stored } : {}),
      };
    },

    async usePersonalToken(userId, connectionId, raw) {
      const row = await required(connectionId);
      if (row.demo) throw demoConnection(row);
      if (!methodsOf(row).includes('token'))
        throw invalid(
          'Personal tokens are turned off for this connection.',
          'GIT_PERSONAL_TOKENS_DISABLED',
        );
      const token = typeof raw === 'string' ? raw.trim() : '';
      if (!token || token.length > GIT_TOKEN_MAX || /\s/u.test(token))
        throw invalid(
          'Paste the token as the host shows it.',
          'INVALID_PERSONAL_TOKEN',
        );
      let user: PlatformUser;
      try {
        user = await on(row).currentUser({
          apiBaseUrl: row.apiBaseUrl,
          token,
        });
      } catch (error) {
        if (
          error instanceof GitApiError &&
          (error.status === 401 || error.status === 403)
        )
          throw invalid(
            'The host refused the token: check that it is valid and not expired.',
            'INVALID_PERSONAL_TOKEN',
          );
        throw hostFailure(error);
      }
      if (
        user.tokenExpiresAt &&
        new Date(user.tokenExpiresAt).getTime() <= now().getTime()
      )
        throw invalid('The token has expired.', 'INVALID_PERSONAL_TOKEN');
      await storeTokens(
        userId,
        row,
        {
          accessToken: token,
          refreshToken: null,
          expiresAt: user.tokenExpiresAt,
          refreshExpiresAt: null,
        },
        user,
        'token',
      );
      const stored = await ownAuthorization(userId, row);
      if (!stored)
        throw new ProtocolError('INTERNAL_ERROR', 'The token was not stored.');
      return stored;
    },

    async completeAuthorization(userId, input) {
      const refused = (message: string) =>
        invalid(message, 'GIT_AUTHORIZATION_FAILED');
      if (input.error === 'access_denied')
        throw invalid(
          'The authorization was declined on the host.',
          'GIT_AUTHORIZATION_DENIED',
        );
      if (typeof input.error === 'string' && input.error)
        throw hostRefusedAuthorization(input.error.slice(0, 100));
      if (typeof input.code !== 'string' || typeof input.state !== 'string')
        throw refused('The host sent no authorization.');
      const state = openState(input.state);
      if (
        !state ||
        state.d !== undefined ||
        state.k !== undefined ||
        state.u !== userId ||
        typeof state.c !== 'string' ||
        typeof state.e !== 'number'
      )
        throw invalid(
          'The authorization was not started here, or by you.',
          'GIT_AUTHORIZATION_STATE_INVALID',
        );
      if (state.e < now().getTime())
        throw invalid(
          'The authorization took too long: start it again.',
          'GIT_AUTHORIZATION_EXPIRED',
        );
      const row = await required(state.c);
      const secret = openOf(row, row.clientSecretSealed, P.clientSecret);
      if (!row.clientId || !secret)
        throw refused('This connection cannot be authorized by people.');
      try {
        const tokens = await on(row).exchangeCode(
          { webUrl: row.webUrl, clientId: row.clientId, clientSecret: secret },
          { code: input.code, redirectUri: input.redirectUri },
        );
        const user = await on(row).currentUser({
          apiBaseUrl: row.apiBaseUrl,
          token: tokens.accessToken,
        });
        await storeTokens(userId, row, tokens, user, 'oauth');
      } catch (error) {
        if (error instanceof GitApiError && error.hostError)
          throw hostRefusedAuthorization(error.hostError);
        throw hostFailure(error);
      }
    },

    async disconnect(userId, connectionId) {
      // The person's authorization of the app, through whichever of its installations they gave it.
      const row = await findConnection(conn(), connectionId);
      const ids = row
        ? (await listConnections(conn()))
            .filter((other) => other.id === row.id || sameApp(row, other))
            .map((other) => other.id)
        : [connectionId];
      await conn()
        .query.deleteFrom(USER_AUTHS)
        .where('userId', '=', userId)
        .where('connectionId', 'in', ids)
        .execute();
    },

    async startAppManifest(userId, raw, urls) {
      const input = record(raw);
      const provider = input.provider ?? 'github';
      if (typeof provider !== 'string' || !providers.has(provider))
        throw invalid('provider names a code host Studio knows.');
      const platform = providers.platformOf(provider);
      if (!platform.descriptor.appManifest)
        throw invalid(`${platform.descriptor.label} apps are added by hand.`);
      const organization = field(input, 'organization', 39) ?? null;
      if (organization !== null && !ACCOUNT_NAME.test(organization))
        throw invalid('organization is the organization’s login.');
      // The connection's id is chosen now: the app's webhook URL names it.
      const connectionId = randomUUID();
      const { webUrl } = changes(
        provider,
        { webUrl: input.webUrl ?? platform.descriptor.defaultWebUrl },
        connectionId,
      ) as { webUrl: string };
      const webhookActive = webhooksReachable(
        urls.publicOrigin,
        webUrl,
        platform.descriptor.defaultWebUrl,
      );
      const state = sealState(
        {
          u: userId,
          c: connectionId,
          k: 'manifest',
          w: webUrl,
          o: organization,
          p: provider,
          h: webhookActive,
        },
        MANIFEST_TTL_MS,
      );
      const form = platform.appManifestForm({
        webUrl,
        organization,
        name: `Studio ${new URL(urls.homepage).host}`,
        homepageUrl: urls.homepage,
        webhookUrl: urls.webhook(connectionId),
        webhookActive,
        redirectUrl: urls.redirect,
        callbackUrl: urls.callback,
        setupUrl: urls.setup,
        state,
      });
      return { ...form, webhookActive };
    },

    async completeAppManifest(userId, input) {
      const refused = (message: string) =>
        invalid(message, 'GIT_APP_MANIFEST_FAILED');
      if (typeof input.code !== 'string' || typeof input.state !== 'string')
        throw refused('The host sent no app.');
      const state = openState(input.state);
      if (
        !state ||
        state.k !== 'manifest' ||
        state.u !== userId ||
        typeof state.c !== 'string' ||
        typeof state.w !== 'string' ||
        typeof state.p !== 'string' ||
        !providers.has(state.p) ||
        typeof state.e !== 'number' ||
        state.e < now().getTime()
      )
        throw refused('Creating the app expired or was not started here.');
      const connectionId = state.c;
      const installUrlOf = (row: ConnectionRow): string => {
        const install = appPages(row).installUrl;
        if (!install) throw refused('The app has no page to install it from.');
        const url = new URL(install);
        url.searchParams.set(
          'state',
          sealState({ u: userId, c: row.id, k: 'install' }, INSTALL_TTL_MS),
        );
        return url.toString();
      };
      // The browser came back twice (a reload): the app is stored already.
      const existing = await findConnection(conn(), connectionId);
      if (existing) return { connectionId, installUrl: installUrlOf(existing) };
      const webUrl = state.w;
      const provider = state.p;
      const platform = providers.platformOf(provider);
      const apiBaseUrl = platform.apiBaseUrlOf(webUrl, deps.apiBaseUrls);
      let created;
      try {
        created = await platform.convertAppManifest(apiBaseUrl, input.code);
      } catch (error) {
        throw hostFailure(error);
      }
      const privateKey = sealFor(
        connectionId,
        created.privateKey,
        P.privateKey,
      );
      const clientSecret = sealFor(
        connectionId,
        created.clientSecret,
        P.clientSecret,
      );
      // The webhook starts off when the host cannot reach Studio: its secret would only claim a webhook that works.
      const webhookSecret =
        created.webhookSecret && state.h === true
          ? sealFor(
              connectionId,
              created.webhookSecret,
              P.connectionWebhookSecret,
            )
          : null;
      const at = now();
      await conn()
        .query.insertInto(CONNECTIONS)
        .values({
          id: connectionId,
          provider,
          kind: 'app',
          name: created.name.slice(0, 255),
          webUrl,
          apiBaseUrl,
          account: null,
          appId: created.appId,
          installationId: null,
          clientId: created.clientId,
          appSlug: created.slug,
          appOrganization: created.organization,
          privateKeySealed: privateKey,
          clientSecretSealed: clientSecret,
          tokenSealed: null,
          webhookSecretSealed: webhookSecret,
          allowPersonalTokens: true,
          webhookAt: null,
          webhookEvent: null,
          webhookStatus: null,
          webhookReason: null,
          createdById: userId,
          createdAt: at,
          updatedAt: at,
        })
        .execute();
      return {
        connectionId,
        installUrl: installUrlOf(await required(connectionId)),
      };
    },

    async completeInstallation(userId, input) {
      const installationId =
        typeof input.installationId === 'string' ? input.installationId : '';
      if (!INSTALLATION_ID.test(installationId))
        throw invalid(
          'The host sent no installation.',
          'GIT_INSTALLATION_NOT_FOUND',
        );
      const all = await listConnections(conn());
      const state =
        typeof input.state === 'string' ? openState(input.state) : null;
      const named =
        state &&
        state.k === 'install' &&
        state.u === userId &&
        typeof state.e === 'number' &&
        state.e >= now().getTime()
          ? all.find((row) => row.id === state.c)
          : undefined;
      // Without Studio's state (installed from the app's page later), each app Studio holds is asked whether it is its.
      const candidates = named
        ? [named]
        : all.filter(
            (row, index) =>
              row.kind === 'app' &&
              !!row.appId &&
              !!row.privateKeySealed &&
              all.findIndex(
                (other) => other.id === row.id || sameApp(row, other),
              ) === index,
          );
      let app: ConnectionRow | null = null;
      let account = '';
      for (const candidate of candidates) {
        let found;
        try {
          found = await on(candidate).getInstallation(
            appOf(candidate),
            installationId,
          );
        } catch (error) {
          throw hostFailure(error);
        }
        if (found) {
          app = candidate;
          account = found.account;
          break;
        }
      }
      if (!app)
        throw invalid(
          'No app Studio holds has that installation.',
          'GIT_INSTALLATION_NOT_FOUND',
        );
      const source = app;
      const siblings = all.filter(
        (row) => row.id === source.id || sameApp(source, row),
      );
      // Installed again (the host sends people back after a change too): nothing new.
      const same = siblings.find(
        (row) => row.installationId === installationId,
      );
      if (same) return viewOf(same);
      const target =
        siblings.find((row) => !row.installationId) ??
        siblings.find(
          (row) => row.account?.toLowerCase() === account.toLowerCase(),
        );
      if (target) {
        await updateConnectionRow(conn(), target.id, {
          installationId,
          account,
        });
        await installationTokens.forget(target.id);
        return viewOf(await required(target.id));
      }
      // Another account: a connection of its own, with the app's credentials.
      const id = randomUUID();
      const at = now();
      await conn()
        .query.insertInto(CONNECTIONS)
        .values({
          id,
          provider: source.provider,
          kind: 'app',
          name: account.slice(0, 255),
          webUrl: source.webUrl,
          apiBaseUrl: source.apiBaseUrl,
          account,
          appId: source.appId,
          installationId,
          clientId: source.clientId,
          appSlug: source.appSlug,
          appOrganization: source.appOrganization,
          ...credentialsOf(source, id),
          tokenSealed: null,
          allowPersonalTokens: source.allowPersonalTokens,
          webhookAt: null,
          webhookEvent: null,
          webhookStatus: null,
          webhookReason: null,
          createdById: userId,
          createdAt: at,
          updatedAt: at,
        })
        .execute();
      return viewOf(await required(id));
    },

    personalAuth,
  };
}
