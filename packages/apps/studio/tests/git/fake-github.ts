/**
 * A stand-in for GitHub, never the real one, answered through a mocked `fetch`: Studio's GitHub platform
 * (`server/git/github.ts`) runs against it unchanged. It keeps repositories with pull requests, commit statuses and
 * check runs (answered with `ETag` validators and 304 to a matching `If-None-Match`, as GitHub does), collaborators'
 * permissions, a GitHub App with installations (it checks the app's JWT against the app's public key and mints
 * installation tokens), people's OAuth codes, device flows and tokens (with a personal token's expiry header), and
 * creating repositories with branch protection, files written through the contents API, branches through the refs API,
 * and Actions secrets sealed to each repository's key (`openSecret` opens one). Every
 * request is recorded with the token it carried, so tests can tell whose credential did what.
 */
import { createHash, createVerify, generateKeyPairSync } from 'node:crypto';

import {
  APP_PERMISSIONS,
  createGitHubPlatform,
} from '../../server/git/github.js';
import type { GitPlatform } from '../../server/git/platform.js';
import { openSealedBox } from '../../server/git/sealed-box.js';

export interface FakePull {
  number: number;
  title: string;
  body?: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  merged_at: string | null;
  merged_by: { login: string } | null;
  /** The squash commit, once merged. */
  merge_commit_sha?: string | null;
  draft: boolean;
  head: { ref: string; sha: string };
  base: { ref: string };
  user: { login: string };
  mergeable_state: string;
  updated_at: string;
}

export interface FakeRepo {
  id: number;
  full_name: string;
  private: boolean;
  default_branch: string;
  description: string | null;
  /** Whether its default branch was protected. */
  protected: boolean;
  /** A template repository, which repositories are generated from. */
  is_template: boolean;
  /** The template repository it was generated from, if any. */
  generatedFrom: string | null;
  /** Created with no commit (`auto_init: false`). */
  empty: boolean;
}

export interface FakeWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
}

export interface FakeWorkflowRun {
  id: number;
  workflow_id: number;
  name: string;
  path: string;
  head_branch: string;
  head_sha: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: string | null;
  html_url: string;
  run_attempt: number;
  event: string;
}

export interface FakeUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
}

export interface FakeCheckRun {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: string | null;
  html_url?: string;
  /** Given when the check is set, unless it names one. */
  id?: number;
  /** `github-actions` for a job GitHub Actions runs. */
  app?: { slug: string };
  output?: { title?: string | null; summary?: string | null };
  /** Its annotations, as GitHub lists them. */
  annotations?: {
    path: string;
    start_line: number;
    end_line: number;
    annotation_level: string;
    title?: string | null;
    message: string;
  }[];
  /** Its job's plain-text log; none when GitHub no longer keeps it (404). */
  log?: string;
}

/** Where the stand-in keeps job logs, as GitHub keeps them away from its API: the log's address redirects there. */
export const FAKE_LOGS_ORIGIN = 'https://pipelines.actions.example';

export interface FakeRequest {
  method: string;
  path: string;
  conditional: boolean;
  status: number;
  /** The bearer token it carried, or null. */
  token: string | null;
  body?: unknown;
}

export interface FakeGitHub {
  /** The `fetch` the platform calls. */
  readonly fetch: (url: string, init?: RequestInit) => Promise<Response>;
  /** Studio's GitHub platform over the stand-in. */
  readonly platform: GitPlatform;
  readonly requests: FakeRequest[];
  /** The tokens that may read; empty lets anyone read. */
  readonly tokens: Set<string>;
  /** `<repo>#<number>` of the pull requests branch protection keeps from being merged (405). */
  readonly protectedPulls: Set<string>;
  /** The account each token belongs to (`GET /user`). */
  readonly users: Map<string, FakeUser>;
  /** `<repo>:<login>` → permission (`admin`, `write`, `read`…). */
  readonly permissions: Map<string, string>;
  readonly repos: Map<string, FakeRepo>;
  /** The app: its id, its private key (PEM), the installation of each account, its OAuth client. */
  readonly app: {
    readonly appId: string;
    readonly privateKey: string;
    readonly clientId: string;
    readonly clientSecret: string;
    readonly installations: Map<string, string>;
    /** The installation tokens minted, with the repositories each was limited to. */
    readonly minted: {
      token: string;
      installationId: string;
      repositories: string[] | null;
    }[];
    /** OAuth codes waiting to be exchanged, with the account they authorize. */
    readonly codes: Map<string, FakeUser>;
    /** Whether the app allows the device flow. */
    deviceFlow: boolean;
    /**
     * The HTTP status GitHub refuses the device flow of an app without it with: 200 like its other OAuth refusals, or a
     * 4xx of its own.
     */
    deviceFlowRefusalStatus: number;
    /**
     * Codes GitHub sent back after creating the app from a manifest, each converted once into the app (its slug, the
     * account that owns it, and the webhook secret GitHub made).
     */
    readonly manifestCodes: Map<
      string,
      {
        slug: string;
        owner: string;
        organization: boolean;
        webhookSecret: string | null;
      }
    >;
    /** Device flows started, by device code: the code shown, and who entered it (or `denied`). */
    readonly devices: Map<
      string,
      { userCode: string; user: FakeUser | 'denied' | null }
    >;
  };
  /** The person enters a device flow's code on the host (or refuses it). */
  enterDeviceCode(userCode: string, user: FakeUser | 'denied'): void;
  /** `GitHub-Authentication-Token-Expiration` of a token, as GitHub writes it. */
  readonly tokenExpirations: Map<string, string>;
  addRepo(fullName: string, options?: Partial<FakeRepo>): FakeRepo;
  addPull(repo: string, pull: Partial<FakePull> & { number: number }): FakePull;
  pull(repo: string, number: number): FakePull;
  /** The comments on a pull request's conversation, oldest first. */
  comments(repo: string, number: number): readonly string[];
  /** Merges it as `login`. */
  merge(repo: string, number: number, login: string): void;
  setStatus(
    repo: string,
    sha: string,
    state: 'pending' | 'success' | 'failure',
    context?: string,
  ): void;
  setCheck(repo: string, sha: string, run: FakeCheckRun): void;
  /** Pushes commits onto a branch, oldest first: the last is its head. */
  pushCommits(repo: string, branch: string, ...shas: string[]): void;
  /** Points a tag at a commit. */
  tag(repo: string, name: string, sha: string): void;
  /** A workflow the repository defines. */
  addWorkflow(
    repo: string,
    workflow: Partial<FakeWorkflow> & { path: string },
  ): FakeWorkflow;
  /** A run of a workflow, newest last. */
  addWorkflowRun(
    repo: string,
    run: Partial<FakeWorkflowRun> & { workflow_id: number },
  ): FakeWorkflowRun;
  /** `<repo>` → its workflow runs, oldest first. */
  readonly workflowRuns: Map<string, FakeWorkflowRun[]>;
  /** `<repo>@<branch>:<path>` → a file written there, with its blob sha. */
  readonly files: Map<string, { content: string; sha: string }>;
  /** The permissions an installation was granted, by installation id; Studio's full set when absent. */
  readonly installationPermissions: Map<string, Record<string, string>>;
  /** Paths (`actions/secrets/public-key`, `contents/…`, `git/refs`) answered with this status instead, by repository. */
  readonly failures: Map<string, number>;
  /**
   * When set, API requests answer this rate limit instead: the next `times` of them, or every one while it is set
   * (`headers` such as `retry-after`, or `x-ratelimit-remaining` and `x-ratelimit-reset`).
   */
  rateLimit: {
    status: 403 | 429;
    headers?: Record<string, string>;
    message?: string;
    times?: number;
    /** Only the requests whose path (with its query) matches. */
    path?: RegExp;
  } | null;
  /** Answers the next `times` API requests with this status instead (a 503, say). */
  outage: { status: number; times: number } | null;
  /** How long the platform waited before each retry, in milliseconds (it does not really wait). */
  readonly waits: number[];
  /** The head of a branch, or undefined. */
  headOf(repo: string, branch: string): string | undefined;
  /** An Actions secret as GitHub would decrypt it, or null. */
  openSecret(repo: string, name: string): string | null;
}

const etagOf = (body: unknown) =>
  `"${createHash('sha1').update(JSON.stringify(body)).digest('hex')}"`;

export function createFakeGitHub(
  origin = 'https://github.com',
  api = 'https://api.github.com',
): FakeGitHub {
  const pulls = new Map<string, Map<number, FakePull>>();
  const statuses = new Map<
    string,
    Map<string, { context: string; state: string; target_url: string }>
  >();
  const checkRuns = new Map<string, FakeCheckRun[]>();
  /** `<repo>:<branch>` → its commits, oldest first. */
  const branches = new Map<string, string[]>();
  /** `<repo>` → its tags, newest first. */
  const tags = new Map<string, { name: string; sha: string }[]>();
  const requests: FakeRequest[] = [];
  /** `<repo>` → its workflows. */
  const workflows = new Map<string, FakeWorkflow[]>();
  const workflowRuns = new Map<string, FakeWorkflowRun[]>();
  let nextWorkflowId = 100;
  let nextRunId = 9000;
  let nextCheckId = 5000;
  const tokens = new Set<string>();
  const protectedPulls = new Set<string>();
  const users = new Map<string, FakeUser>();
  const permissions = new Map<string, string>();
  const repos = new Map<string, FakeRepo>();
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  const app = {
    appId: '4242',
    privateKey,
    clientId: 'Iv1.fakeclient',
    clientSecret: 'fake-client-secret',
    installations: new Map<string, string>(),
    minted: [] as FakeGitHub['app']['minted'],
    codes: new Map<string, FakeUser>(),
    deviceFlow: true,
    deviceFlowRefusalStatus: 200,
    manifestCodes: new Map<
      string,
      {
        slug: string;
        owner: string;
        organization: boolean;
        webhookSecret: string | null;
      }
    >(),
    devices: new Map<
      string,
      { userCode: string; user: FakeUser | 'denied' | null }
    >(),
  };
  const tokenExpirations = new Map<string, string>();
  /** The refresh tokens issued and not used yet, with the person each refreshes. */
  const refreshTokens = new Map<string, FakeUser>();
  const files = new Map<string, { content: string; sha: string }>();
  const installationPermissions = new Map<string, Record<string, string>>();
  const failures = new Map<string, number>();
  /** `<repo>` → the repository's Actions key pair (raw X25519) and its sealed secrets. */
  const secretKeys = new Map<string, { secret: Buffer; public: Buffer }>();
  const secrets = new Map<string, { value: string; keyId: string }>();
  const keysOf = (repo: string) => {
    let found = secretKeys.get(repo);
    if (!found) {
      const pair = generateKeyPairSync('x25519');
      found = {
        secret: Buffer.from(
          pair.privateKey.export({ format: 'jwk' }).d ?? '',
          'base64url',
        ),
        public: Buffer.from(
          pair.publicKey.export({ format: 'jwk' }).x ?? '',
          'base64url',
        ),
      };
      secretKeys.set(repo, found);
    }
    return found;
  };
  let nextCommit = 0;
  /** A branch made at a commit holds the files of the branch whose head that commit is. */
  const copyFiles = (repo: string, sha: string, branch: string) => {
    const source = [...repos.values()]
      .filter((item) => item.full_name === repo)
      .flatMap((item) => [item.default_branch])
      .concat(
        [...branches.keys()]
          .filter((key) => key.startsWith(`${repo}:`))
          .map((key) => key.slice(repo.length + 1)),
      )
      .find((name) => name !== branch && fake.headOf(repo, name) === sha);
    if (!source) return;
    for (const [key, file] of [...files])
      if (key.startsWith(`${repo}@${source}:`))
        files.set(
          `${repo}@${branch}:${key.slice(`${repo}@${source}:`.length)}`,
          { ...file },
        );
  };
  let nextRepoId = 1000;
  let nextToken = 0;

  const of = (repo: string) => {
    let map = pulls.get(repo);
    if (!map) {
      map = new Map();
      pulls.set(repo, map);
    }
    return map;
  };

  const touch = (pull: FakePull) => {
    pull.updated_at = new Date(Date.now() + requests.length).toISOString();
  };
  /** `<repo>#<number>` → the comments on its conversation. */
  const comments = new Map<string, string[]>();
  /** A pull request's GraphQL id. */
  const nodeIdOf = (repo: string, number: number) =>
    `PR_${Buffer.from(`${repo}#${number}`).toString('base64url')}`;

  function payload(repo: string, pull: FakePull) {
    return {
      ...pull,
      node_id: nodeIdOf(repo, pull.number),
      html_url: `${origin}/${repo}/pull/${pull.number}`,
      closed_at: pull.state === 'closed' ? pull.merged_at : null,
      // As GitHub: false on a conflict, null while it works mergeability out.
      mergeable:
        pull.mergeable_state === 'dirty'
          ? false
          : pull.mergeable_state === 'unknown'
            ? null
            : true,
    };
  }

  function repoPayload(repo: FakeRepo) {
    return {
      id: repo.id,
      full_name: repo.full_name,
      name: repo.full_name.split('/')[1],
      owner: { login: repo.full_name.split('/')[0] },
      private: repo.private,
      default_branch: repo.default_branch,
      clone_url: `${origin}/${repo.full_name}.git`,
      html_url: `${origin}/${repo.full_name}`,
      description: repo.description,
      is_template: repo.is_template,
    };
  }

  /** The app's JWT, checked against its public key; true when it is the app's. */
  function appJwtValid(token: string | null): boolean {
    const [header, body, signature] = (token ?? '').split('.');
    if (!header || !body || !signature) return false;
    const verify = createVerify('RSA-SHA256');
    verify.update(`${header}.${body}`);
    if (!verify.verify(publicKey, Buffer.from(signature, 'base64url')))
      return false;
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString()) as {
      iss?: unknown;
    };
    return String(claims.iss) === app.appId;
  }

  const json = (
    status: number,
    body?: unknown,
    headers: Record<string, string> = {},
  ) =>
    new Response(
      status === 304 || status === 204 || body === undefined
        ? null
        : JSON.stringify(body),
      {
        status,
        // As GitHub, every answer is dated (`@octokit/oauth-methods` dates a person's token expiry from it).
        headers: {
          'content-type': 'application/json',
          date: new Date().toUTCString(),
          ...headers,
        },
      },
    );

  async function handle(url: URL, init: RequestInit): Promise<Response> {
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    // The scheme is case-insensitive: `@octokit/auth-app` writes `bearer`.
    const token =
      headers.get('authorization')?.replace(/^bearer /iu, '') ?? null;
    const etag = headers.get('if-none-match');
    const body: Record<string, unknown> =
      typeof init.body === 'string'
        ? (JSON.parse(init.body) as Record<string, unknown>)
        : {};
    const record = (status: number, conditional = false) =>
      requests.push({
        method,
        path: `${url.pathname}${url.search}`,
        conditional,
        status,
        token,
        ...(typeof init.body === 'string' ? { body } : {}),
      });
    const refuse = (status: number) => {
      record(status);
      return json(status, { message: 'GitHub stand-in refused.' });
    };
    const readable = () => tokens.size === 0 || (!!token && tokens.has(token));
    /** A GET answered as GitHub would: 401, 404, 304 or the body with its validator. */
    const get = (value: unknown, extra: Record<string, string> = {}) => {
      if (!readable()) return refuse(401);
      if (value === undefined) return refuse(404);
      const current = etagOf(value);
      if (etag && etag === current) {
        record(304, true);
        return json(304);
      }
      record(200, !!etag);
      return json(200, value, { etag: current, ...extra });
    };

    // The storage job logs are redirected to: signed addresses, which refuse a request carrying a credential.
    if (url.origin === FAKE_LOGS_ORIGIN) {
      if (token || url.searchParams.get('sig') !== 'signed') return refuse(400);
      const id = Number(url.pathname.split('/').pop());
      const run = [...checkRuns.values()].flat().find((item) => item.id === id);
      if (run?.log === undefined) return refuse(404);
      record(200);
      return new Response(run.log, {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });
    }

    // The web host: the OAuth token exchange and the device flow.
    if (url.origin === new URL(origin).origin) {
      const issue = (user: FakeUser) => {
        const access = `ghu_${++nextToken}`;
        users.set(access, user);
        tokens.add(access);
        refreshTokens.set(`ghr_${nextToken}`, user);
        record(200);
        return json(200, {
          access_token: access,
          expires_in: 28800,
          refresh_token: `ghr_${nextToken}`,
          refresh_token_expires_in: 15897600,
          token_type: 'bearer',
          scope: '',
        });
      };
      if (url.pathname === '/login/device/code' && method === 'POST') {
        if (body.client_id !== app.clientId) return refuse(401);
        if (!app.deviceFlow) {
          record(app.deviceFlowRefusalStatus);
          return json(app.deviceFlowRefusalStatus, {
            error: 'device_flow_disabled',
          });
        }
        record(200);
        const deviceCode = `dc_${++nextToken}`;
        const userCode = `WDJB-${String(nextToken).padStart(4, '0')}`;
        app.devices.set(deviceCode, { userCode, user: null });
        return json(200, {
          device_code: deviceCode,
          user_code: userCode,
          verification_uri: `${origin}/login/device`,
          expires_in: 899,
          interval: 5,
        });
      }
      if (url.pathname !== '/login/oauth/access_token' || method !== 'POST')
        return refuse(404);
      if (body.grant_type === 'urn:ietf:params:oauth:grant-type:device_code') {
        if (body.client_id !== app.clientId) return refuse(401);
        const device = app.devices.get(String(body.device_code ?? ''));
        if (!device) {
          record(200);
          return json(200, { error: 'expired_token' });
        }
        if (!device.user) {
          record(200);
          return json(200, { error: 'authorization_pending', interval: 5 });
        }
        app.devices.delete(String(body.device_code));
        if (device.user === 'denied') {
          record(200);
          return json(200, { error: 'access_denied' });
        }
        return issue(device.user);
      }
      if (
        body.client_id !== app.clientId ||
        body.client_secret !== app.clientSecret
      )
        return refuse(401);
      if (body.grant_type === 'refresh_token') {
        // A refresh token is used once: the answer carries the next one.
        const owner = refreshTokens.get(String(body.refresh_token ?? ''));
        if (!owner) {
          record(200);
          return json(200, { error: 'bad_refresh_token' });
        }
        refreshTokens.delete(String(body.refresh_token));
        return issue(owner);
      }
      const user = app.codes.get(String(body.code ?? ''));
      if (!user) {
        record(200);
        return json(200, { error: 'bad_verification_code' });
      }
      app.codes.delete(String(body.code));
      return issue(user);
    }

    if (
      fake.rateLimit &&
      (!fake.rateLimit.path ||
        fake.rateLimit.path.test(`${url.pathname}${url.search}`))
    ) {
      const limit = fake.rateLimit;
      if (limit.times !== undefined && --limit.times <= 0)
        fake.rateLimit = null;
      record(limit.status);
      return json(
        limit.status,
        { message: limit.message ?? 'API rate limit exceeded.' },
        limit.headers ?? {},
      );
    }
    if (fake.outage) {
      const { status } = fake.outage;
      if (--fake.outage.times <= 0) fake.outage = null;
      record(status);
      return json(status, { message: 'Unavailable.' });
    }
    const path = url.pathname.replace(
      new URL(api).pathname.replace(/\/+$/u, ''),
      '',
    );
    // The app's own endpoints, signed with its JWT.
    const installationOf = /^\/(orgs|users)\/([^/]+)\/installation$/u.exec(
      path,
    );
    if (installationOf?.[2]) {
      if (!appJwtValid(token)) return refuse(401);
      const id = app.installations.get(decodeURIComponent(installationOf[2]));
      if (!id) return refuse(404);
      record(200);
      return json(200, { id: Number(id) });
    }
    const conversion = /^\/app-manifests\/([^/]+)\/conversions$/u.exec(path);
    if (conversion?.[1] && method === 'POST') {
      const code = decodeURIComponent(conversion[1]);
      const created = app.manifestCodes.get(code);
      if (!created) return refuse(404);
      app.manifestCodes.delete(code);
      record(201);
      return json(201, {
        id: Number(app.appId),
        slug: created.slug,
        name: `Studio ${created.slug}`,
        owner: {
          login: created.owner,
          type: created.organization ? 'Organization' : 'User',
        },
        client_id: app.clientId,
        client_secret: app.clientSecret,
        webhook_secret: created.webhookSecret,
        pem: app.privateKey,
      });
    }
    const installationById = /^\/app\/installations\/([^/]+)$/u.exec(path);
    if (installationById?.[1] && method === 'GET') {
      if (!appJwtValid(token)) return refuse(401);
      const account = [...app.installations].find(
        ([, id]) => id === installationById[1],
      )?.[0];
      if (!account) return refuse(404);
      record(200);
      return json(200, {
        id: Number(installationById[1]),
        account: { login: account },
        permissions: installationPermissions.get(installationById[1]) ?? {
          ...APP_PERMISSIONS,
        },
        html_url: `${origin}/organizations/${account}/settings/installations/${installationById[1]}`,
      });
    }
    const minting = /^\/app\/installations\/([^/]+)\/access_tokens$/u.exec(
      path,
    );
    if (minting?.[1] && method === 'POST') {
      if (!appJwtValid(token)) return refuse(401);
      if (![...app.installations.values()].includes(minting[1]))
        return refuse(404);
      const minted = `ghs_${++nextToken}`;
      tokens.add(minted);
      app.minted.push({
        token: minted,
        installationId: minting[1],
        repositories: Array.isArray(body.repositories)
          ? (body.repositories as string[])
          : null,
      });
      record(201);
      return json(201, {
        token: minted,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      });
    }
    if (path === '/user') {
      const user = token ? users.get(token) : undefined;
      if (!user) return refuse(401);
      const expiration = token ? tokenExpirations.get(token) : undefined;
      return get(
        { ...user },
        expiration
          ? { 'github-authentication-token-expiration': expiration }
          : {},
      );
    }
    if (path === '/user/emails') {
      const user = token ? users.get(token) : undefined;
      if (!user) return refuse(401);
      return get(
        user.email
          ? [{ email: user.email, primary: true, verified: true }]
          : [],
      );
    }
    if (
      path === '/installation/repositories' ||
      (path === '/user/repos' && method === 'GET')
    ) {
      const perPage = Number(url.searchParams.get('per_page') ?? 30);
      const page = Number(url.searchParams.get('page') ?? 1);
      const all = [...repos.values()].map(repoPayload);
      const slice = all.slice((page - 1) * perPage, page * perPage);
      const link =
        page * perPage < all.length
          ? { link: `<${url.origin}${path}?page=${page + 1}>; rel="next"` }
          : {};
      return get(
        path === '/user/repos'
          ? slice
          : { total_count: all.length, repositories: slice },
        link,
      );
    }
    const orgRepos = /^\/orgs\/([^/]+)\/repos$/u.exec(path);
    if (method === 'POST' && (path === '/user/repos' || orgRepos?.[1])) {
      if (!readable()) return refuse(401);
      const owner = orgRepos?.[1]
        ? decodeURIComponent(orgRepos[1])
        : token
          ? users.get(token)?.login
          : undefined;
      if (!owner) return refuse(403);
      const fullName = `${owner}/${String(body.name)}`;
      if (repos.has(fullName)) return refuse(422);
      const repo = fake.addRepo(fullName, {
        private: body.private === true,
        description:
          typeof body.description === 'string' ? body.description : null,
        empty: body.auto_init !== true,
      });
      record(201);
      return json(201, repoPayload(repo));
    }

    const single = /^\/repos\/([^/]+\/[^/]+)$/u.exec(path);
    if (single?.[1] && method === 'GET') {
      if (!readable()) return refuse(401);
      const found = repos.get(decodeURIComponent(single[1]));
      return found ? get(repoPayload(found)) : refuse(404);
    }
    const generate = /^\/repos\/([^/]+\/[^/]+)\/generate$/u.exec(path);
    if (generate?.[1] && method === 'POST') {
      if (!readable()) return refuse(401);
      const template = repos.get(decodeURIComponent(generate[1]));
      if (!template?.is_template) return refuse(404);
      const fullName = `${String(body.owner)}/${String(body.name)}`;
      if (repos.has(fullName)) return refuse(422);
      const repo = fake.addRepo(fullName, {
        private: body.private === true,
        description:
          typeof body.description === 'string' ? body.description : null,
        generatedFrom: template.full_name,
      });
      // The template's files come along, its workflows among them.
      for (const workflow of workflows.get(template.full_name) ?? [])
        fake.addWorkflow(fullName, {
          name: workflow.name,
          path: workflow.path,
        });
      record(201);
      return json(201, repoPayload(repo));
    }

    // GraphQL: only turning a pull request into a draft and back, which the REST API cannot do.
    if (path === '/graphql' && method === 'POST') {
      if (!readable()) return refuse(401);
      const id = (body.variables as { id?: unknown } | undefined)?.id;
      const found = [...pulls.entries()]
        .flatMap(([repo, map]) =>
          [...map.values()].map((pull) => ({ repo, pull })),
        )
        .find(({ repo, pull }) => nodeIdOf(repo, pull.number) === id);
      record(200);
      if (!found || found.pull.state !== 'open')
        return json(200, { errors: [{ message: 'Could not resolve.' }] });
      const query = String(body.query ?? '');
      if (query.includes('convertPullRequestToDraft')) found.pull.draft = true;
      else if (query.includes('markPullRequestReadyForReview'))
        found.pull.draft = false;
      else return json(200, { errors: [{ message: 'Unknown mutation.' }] });
      touch(found.pull);
      return json(200, { data: {} });
    }

    const match = /^\/repos\/([^/]+\/[^/]+)\/(.+)$/u.exec(path);
    if (!match?.[1] || !match[2]) return refuse(404);
    const repo = decodeURIComponent(match[1]);
    const rest = match[2];
    const commitPullsMatch = /^commits\/([^/]+)\/pulls$/u.exec(rest);
    const compareMatch = /^compare\/(.+)\.\.\.(.+)$/u.exec(rest);
    if (commitPullsMatch?.[1])
      return get(
        [...of(repo).values()]
          .filter((pull) => pull.head.sha === commitPullsMatch[1])
          .map((pull) => payload(repo, pull)),
      );
    if (compareMatch?.[1] && compareMatch[2]) {
      // Each side is a branch (its head) or a commit; both must be on one of the repository's branches.
      const base = decodeURIComponent(compareMatch[1]);
      const head = decodeURIComponent(compareMatch[2]);
      const tipOf = (ref: string) => branches.get(`${repo}:${ref}`)?.at(-1);
      const baseSha = tipOf(base) ?? base;
      const headSha = tipOf(head) ?? head;
      const lists = [...branches.entries()]
        .filter(([key]) => key.startsWith(`${repo}:`))
        .map(([, list]) => list);
      const known = (sha: string) => lists.some((list) => list.includes(sha));
      if (!known(baseSha) || !known(headSha)) return get(undefined);
      if (baseSha === headSha) return get({ status: 'identical' });
      const shared = lists.find(
        (list) => list.includes(baseSha) && list.includes(headSha),
      );
      if (!shared) return get({ status: 'diverged' });
      return get({
        status:
          shared.indexOf(baseSha) < shared.indexOf(headSha)
            ? 'ahead'
            : 'behind',
      });
    }
    const headOfMatch = /^commits\/([^/]+)\/branches-where-head$/u.exec(rest);
    if (headOfMatch?.[1])
      return get(
        [...branches.entries()]
          .filter(
            ([key, list]) =>
              key.startsWith(`${repo}:`) && list.at(-1) === headOfMatch[1],
          )
          .map(([key]) => ({
            name: key.slice(repo.length + 1),
            commit: { sha: headOfMatch[1] },
          })),
      );
    if (rest === 'tags')
      return get(
        (tags.get(repo) ?? []).map((tag) => ({
          name: tag.name,
          commit: { sha: tag.sha },
        })),
      );
    const pullMatch = /^pulls\/(\d+)$/u.exec(rest);
    const mergeMatch = /^pulls\/(\d+)\/merge$/u.exec(rest);
    const statusMatch = /^commits\/([^/]+)\/status$/u.exec(rest);
    const runsMatch = /^commits\/([^/]+)\/check-runs$/u.exec(rest);
    const runById = (id: string | undefined) =>
      [...checkRuns.entries()]
        .filter(([key]) => key.startsWith(`${repo}@`))
        .flatMap(([, runs]) => runs)
        .find((run) => String(run.id) === id);
    const annotationsMatch = /^check-runs\/(\d+)\/annotations$/u.exec(rest);
    if (annotationsMatch?.[1] && method === 'GET') {
      const run = runById(annotationsMatch[1]);
      return get(run ? (run.annotations ?? []) : undefined);
    }
    const logsMatch = /^actions\/jobs\/(\d+)\/logs$/u.exec(rest);
    if (logsMatch?.[1] && method === 'GET') {
      if (!readable()) return refuse(401);
      const run = runById(logsMatch[1]);
      if (run?.log === undefined) return refuse(404);
      record(302);
      return new Response(null, {
        status: 302,
        headers: {
          location: `${FAKE_LOGS_ORIGIN}/logs/${run.id}?sig=signed`,
        },
      });
    }
    const permissionMatch = /^collaborators\/([^/]+)\/permission$/u.exec(rest);
    const protectionMatch = /^branches\/([^/]+)\/protection$/u.exec(rest);

    for (const [prefix, status] of failures)
      if (`${repo}/${rest}`.startsWith(prefix)) return refuse(status);
    const contentsMatch = /^contents\/(.+)$/u.exec(rest.split('?')[0] ?? '');
    const refMatch = /^git\/refs?\/heads\/(.+)$/u.exec(rest);
    const repoRow = repos.get(repo);
    if (rest === 'actions/secrets/public-key' && method === 'GET') {
      if (!readable() || !repoRow) return refuse(404);
      return get({
        key_id: `key-${repoRow.id}`,
        key: keysOf(repo).public.toString('base64'),
      });
    }
    const secretMatch = /^actions\/secrets\/([^/]+)$/u.exec(rest);
    if (secretMatch?.[1] && method === 'PUT') {
      if (!readable() || !repoRow) return refuse(404);
      if (body.key_id !== `key-${repoRow.id}`) return refuse(422);
      secrets.set(`${repo}:${decodeURIComponent(secretMatch[1])}`, {
        value: String(body.encrypted_value),
        keyId: String(body.key_id),
      });
      record(201);
      return json(201, undefined);
    }
    if (refMatch?.[1] && method === 'GET') {
      if (!readable() || !repoRow) return refuse(404);
      const head = fake.headOf(repo, decodeURIComponent(refMatch[1]));
      return head
        ? get({ ref: `refs/heads/${refMatch[1]}`, object: { sha: head } })
        : refuse(404);
    }
    if (rest === 'git/refs' && method === 'POST') {
      if (!readable() || !repoRow) return refuse(404);
      const name = String(body.ref).replace(/^refs\/heads\//u, '');
      if (fake.headOf(repo, name)) return refuse(422);
      branches.set(`${repo}:${name}`, [String(body.sha)]);
      copyFiles(repo, String(body.sha), name);
      record(201);
      return json(201, { ref: body.ref, object: { sha: body.sha } });
    }
    if (refMatch?.[1] && method === 'PATCH') {
      if (!readable() || !repoRow) return refuse(404);
      const name = decodeURIComponent(refMatch[1]);
      if (!fake.headOf(repo, name)) return refuse(422);
      branches.set(`${repo}:${name}`, [String(body.sha)]);
      copyFiles(repo, String(body.sha), name);
      record(200);
      return json(200, {
        ref: `refs/heads/${name}`,
        object: { sha: body.sha },
      });
    }
    if (contentsMatch?.[1] && method === 'GET') {
      if (!readable() || !repoRow) return refuse(404);
      const filePath = decodeURIComponent(contentsMatch[1]);
      const branch = url.searchParams.get('ref') ?? repoRow.default_branch;
      const file = files.get(`${repo}@${branch}:${filePath}`);
      return file
        ? get({
            sha: file.sha,
            encoding: 'base64',
            content: Buffer.from(file.content).toString('base64'),
          })
        : refuse(404);
    }
    if (contentsMatch?.[1] && method === 'PUT') {
      if (!readable() || !repoRow) return refuse(404);
      const filePath = decodeURIComponent(contentsMatch[1]);
      const branch = String(body.branch ?? repoRow.default_branch);
      // As GitHub: a protected branch takes changes through pull requests only.
      if (repoRow.protected && branch === repoRow.default_branch)
        return refuse(409);
      const head = fake.headOf(repo, branch);
      if (!head && !(repoRow.empty && branch === repoRow.default_branch))
        return refuse(404);
      const key = `${repo}@${branch}:${filePath}`;
      const existing = files.get(key);
      if (
        (existing?.sha ?? null) !== ((body.sha as string | undefined) ?? null)
      )
        return refuse(existing ? 409 : 422);
      const content = Buffer.from(String(body.content), 'base64').toString(
        'utf8',
      );
      const sha = createHash('sha1').update(content).digest('hex');
      files.set(key, { content, sha });
      const commit = `commit-${++nextCommit}`;
      fake.pushCommits(repo, branch, commit);
      repoRow.empty = false;
      record(201);
      return json(201, {
        content: { sha, path: filePath },
        commit: { sha: commit },
      });
    }

    const workflowRunsMatch = /^actions\/workflows\/([^/]+)\/runs$/u.exec(rest);
    const rerunMatch = /^actions\/runs\/(\d+)\/rerun$/u.exec(rest);
    if (rest === 'actions/workflows' && method === 'GET') {
      if (!readable() || !repos.has(repo)) return refuse(404);
      const perPage = Number(url.searchParams.get('per_page') ?? 30);
      const page = Number(url.searchParams.get('page') ?? 1);
      const all = (workflows.get(repo) ?? []).map((workflow) => ({
        ...workflow,
        html_url: `${origin}/${repo}/blob/main/${workflow.path}`,
      }));
      return get({
        total_count: all.length,
        workflows: all.slice((page - 1) * perPage, page * perPage),
      });
    }
    if (workflowRunsMatch?.[1] && method === 'GET') {
      if (!readable() || !repos.has(repo)) return refuse(404);
      const key = decodeURIComponent(workflowRunsMatch[1]);
      const workflow = (workflows.get(repo) ?? []).find(
        (item) => String(item.id) === key || item.path.endsWith(`/${key}`),
      );
      if (!workflow) return refuse(404);
      const runs = (workflowRuns.get(repo) ?? [])
        .filter((run) => run.workflow_id === workflow.id)
        .reverse();
      return get({ total_count: runs.length, workflow_runs: runs });
    }
    if (rerunMatch?.[1] && method === 'POST') {
      if (!readable()) return refuse(401);
      const run = (workflowRuns.get(repo) ?? []).find(
        (item) => String(item.id) === rerunMatch[1],
      );
      if (!run) return refuse(404);
      run.run_attempt += 1;
      run.status = 'queued';
      run.conclusion = null;
      record(201);
      return json(201, {});
    }
    if (protectionMatch?.[1] && method === 'PUT') {
      const found = repos.get(repo);
      if (!readable() || !found) return refuse(404);
      // GitHub protects only a branch that exists: an empty repository has none.
      if (found.empty) return refuse(404);
      found.protected = true;
      record(200);
      return json(200, {
        url: `${api}/repos/${repo}/branches/${protectionMatch[1]}/protection`,
      });
    }
    if (rest === 'pulls' && method === 'POST') {
      if (!readable()) return refuse(401);
      const head = String(body.head);
      if (
        [...of(repo).values()].some(
          (pull) => pull.head.ref === head && pull.state === 'open',
        )
      )
        return refuse(422);
      const number = Math.max(0, ...of(repo).keys()) + 1;
      const pull = fake.addPull(repo, {
        number,
        title: String(body.title),
        body: typeof body.body === 'string' ? body.body : null,
        draft: body.draft === true,
        head: { ref: head, sha: `sha-${number}-1` },
        base: { ref: String(body.base) },
        user: {
          login:
            (token ? users.get(token)?.login : undefined) ?? 'studio-app[bot]',
        },
      });
      record(201);
      return json(201, payload(repo, pull));
    }
    if (pullMatch?.[1] && method === 'PATCH') {
      if (!readable()) return refuse(401);
      const pull = of(repo).get(Number(pullMatch[1]));
      if (!pull) return refuse(404);
      // As GitHub: a merged pull request keeps its base and state.
      if (pull.merged && (body.base !== undefined || body.state !== undefined))
        return refuse(422);
      if (typeof body.body === 'string') pull.body = body.body;
      if (typeof body.title === 'string') pull.title = body.title;
      if (typeof body.base === 'string') pull.base = { ref: body.base };
      if (body.state === 'open' || body.state === 'closed')
        pull.state = body.state;
      touch(pull);
      record(200);
      return json(200, payload(repo, pull));
    }
    const commentsMatch = /^issues\/(\d+)\/comments$/u.exec(rest);
    if (commentsMatch?.[1] && method === 'POST') {
      if (!readable()) return refuse(401);
      if (!of(repo).has(Number(commentsMatch[1]))) return refuse(404);
      const key = `${repo}#${commentsMatch[1]}`;
      comments.set(key, [...(comments.get(key) ?? []), String(body.body)]);
      record(201);
      return json(201, { id: requests.length, body: body.body });
    }
    if (mergeMatch?.[1] && method === 'PUT') {
      if (!readable()) return refuse(401);
      const number = Number(mergeMatch[1]);
      const pull = of(repo).get(number);
      if (!pull || pull.state !== 'open') return refuse(405);
      if (protectedPulls.has(`${repo}#${number}`)) return refuse(405);
      if (pull.head.sha !== body.sha) return refuse(409);
      fake.merge(
        repo,
        number,
        (token ? users.get(token)?.login : undefined) ?? 'studio-app[bot]',
      );
      record(200);
      return json(200, { merged: true, sha: pull.merge_commit_sha ?? '' });
    }
    if (rest.startsWith('pulls?') || rest === 'pulls')
      return get(
        [...of(repo).values()]
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
          .map((pull) => payload(repo, pull)),
      );
    if (pullMatch?.[1]) {
      const pull = of(repo).get(Number(pullMatch[1]));
      return get(pull ? payload(repo, pull) : undefined);
    }
    if (statusMatch?.[1]) {
      const list = [
        ...(statuses.get(`${repo}@${statusMatch[1]}`)?.values() ?? []),
      ];
      return get({
        state: list.some((item) => item.state === 'failure')
          ? 'failure'
          : list.some((item) => item.state === 'pending') || list.length === 0
            ? 'pending'
            : 'success',
        total_count: list.length,
        statuses: list,
      });
    }
    if (runsMatch?.[1]) {
      const runs = (checkRuns.get(`${repo}@${runsMatch[1]}`) ?? []).map(
        ({ annotations: _annotations, log: _log, ...run }) => run,
      );
      return get({ total_count: runs.length, check_runs: runs });
    }
    if (permissionMatch?.[1]) {
      const permission = permissions.get(
        `${repo}:${decodeURIComponent(permissionMatch[1])}`,
      );
      if (!permission) return refuse(404);
      return get({ permission, role_name: permission });
    }
    return refuse(404);
  }

  const fake: FakeGitHub = {
    fetch: (input, init = {}) => handle(new URL(input), init),
    platform: undefined as unknown as GitPlatform,
    requests,
    tokens,
    protectedPulls,
    users,
    permissions,
    repos,
    app,
    tokenExpirations,
    enterDeviceCode(userCode, user) {
      for (const device of app.devices.values())
        if (device.userCode === userCode) device.user = user;
    },
    addRepo(fullName, options = {}) {
      const repo: FakeRepo = {
        id: nextRepoId++,
        full_name: fullName,
        private: false,
        default_branch: 'main',
        description: null,
        protected: false,
        is_template: false,
        generatedFrom: null,
        empty: false,
        ...options,
      };
      repos.set(fullName, repo);
      return repo;
    },
    addPull(repo, input) {
      const pull: FakePull = {
        title: `Pull request ${input.number}`,
        body: null,
        state: 'open',
        merged: false,
        merged_at: null,
        merged_by: null,
        draft: false,
        head: { ref: `feature-${input.number}`, sha: `sha-${input.number}-1` },
        base: { ref: 'main' },
        user: { login: 'octocat' },
        mergeable_state: 'clean',
        updated_at: new Date().toISOString(),
        ...input,
      };
      of(repo).set(pull.number, pull);
      return pull;
    },
    pull(repo, number) {
      const pull = of(repo).get(number);
      if (!pull) throw new Error(`No pull request ${repo}#${number}.`);
      return pull;
    },
    comments(repo, number) {
      return comments.get(`${repo}#${number}`) ?? [];
    },
    merge(repo, number, login) {
      const pull = fake.pull(repo, number);
      pull.state = 'closed';
      pull.merged = true;
      pull.merged_at = new Date().toISOString();
      pull.merged_by = { login };
      pull.merge_commit_sha = createHash('sha1')
        .update(`squash-${repo}-${number}-${pull.head.sha}`)
        .digest('hex');
      pull.mergeable_state = 'unknown';
      touch(pull);
    },
    setStatus(repo, sha, state, context = 'ci') {
      const key = `${repo}@${sha}`;
      const map = statuses.get(key) ?? new Map();
      map.set(context, {
        context,
        state,
        target_url: `${origin}/${repo}/actions/${context}`,
      });
      statuses.set(key, map);
    },
    pushCommits(repo, branch, ...shas) {
      const key = `${repo}:${branch}`;
      branches.set(key, [...(branches.get(key) ?? []), ...shas]);
    },
    workflowRuns,
    files,
    installationPermissions,
    failures,
    rateLimit: null,
    outage: null,
    waits: [],
    headOf(repo, branch) {
      const pushed = branches.get(`${repo}:${branch}`)?.at(-1);
      if (pushed) return pushed;
      const found = repos.get(repo);
      return found && !found.empty && branch === found.default_branch
        ? `base-${found.id}`
        : undefined;
    },
    openSecret(repo, name) {
      const sealed = secrets.get(`${repo}:${name}`);
      if (!sealed) return null;
      const opened = openSealedBox(
        keysOf(repo).secret,
        Buffer.from(sealed.value, 'base64'),
      );
      return opened ? Buffer.from(opened).toString('utf8') : null;
    },
    addWorkflow(repo, input) {
      const workflow: FakeWorkflow = {
        id: nextWorkflowId++,
        name: input.path.split('/').pop() ?? input.path,
        state: 'active',
        ...input,
      };
      workflows.set(repo, [...(workflows.get(repo) ?? []), workflow]);
      return workflow;
    },
    addWorkflowRun(repo, input) {
      const workflow = (workflows.get(repo) ?? []).find(
        (item) => item.id === input.workflow_id,
      );
      const id = nextRunId++;
      const run: FakeWorkflowRun = {
        id,
        name: workflow?.name ?? 'workflow',
        path: workflow?.path ?? '',
        head_branch: 'main',
        head_sha: `run-${id}`,
        status: 'completed',
        conclusion: 'success',
        html_url: `${origin}/${repo}/actions/runs/${id}`,
        run_attempt: 1,
        event: 'push',
        ...input,
      };
      workflowRuns.set(repo, [...(workflowRuns.get(repo) ?? []), run]);
      return run;
    },
    tag(repo, name, sha) {
      tags.set(repo, [{ name, sha }, ...(tags.get(repo) ?? [])]);
    },
    setCheck(repo, sha, run) {
      const key = `${repo}@${sha}`;
      const runs = (checkRuns.get(key) ?? []).filter(
        (item) => item.name !== run.name,
      );
      runs.push({
        html_url: `${origin}/${repo}/runs/${run.name}`,
        id: nextCheckId++,
        ...run,
      });
      checkRuns.set(key, runs);
    },
  };
  (fake as { platform: GitPlatform }).platform = createGitHubPlatform({
    fetch: (input, init) => fake.fetch(input, init),
    sleep: async (ms) => {
      fake.waits.push(ms);
    },
  });
  return fake;
}
