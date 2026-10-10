// A run's repository credentials, kept in the worker's memory and handed to git only when it asks.
//
// The broker (`GitCredentialBroker`) answers for every repository the run carries a credential for. A repository the
// application lists in `RunGit.onDemand` (the `gitCredentials` feature) has its credential asked for from the server
// (`RUNNER_ROUTES.gitCredential`) whenever git needs one and the broker holds none that lasts another
// `REFRESH_MARGIN_MS`; a credential the claim handed out (`RunGit.credentials`, older applications) is answered as it
// is. When git says the remote refused a credential (`erase`), the broker forgets it, and the next request asks for a
// new one with `refresh`, at most once per repository every `FORCED_REFRESH_INTERVAL_MS`, so an agent that keeps
// erasing cannot make the application issue credentials in a loop. An `erase` names the password git used, and
// forgets the credential only when it is the one the broker holds, so a late `erase` from an older git process does
// not throw away a credential fetched since.
//
// Nothing else is used for such a repository: not the host's own git credentials, not an earlier credential. When the
// application cannot issue one the request fails with a reason (`RepoAccessFailure`): `unavailable` (its code host is
// down or slow; try again later), `denied` (it will not issue one) or `leaseLost` (the run is no longer this runner's,
// and the worker stops). Each failure is recorded as an `error` event (`meta.kind` `gitCredential`) with a message safe
// to show.
//
// The agent's git reaches the broker through a credential helper (`HELPER_SCRIPT`, written into the runner's own
// directory and started with this runner's Node), which env.ts configures for each repository URL with the repository's
// index as its argument, so two repositories on one host are told apart without git sending the path. The helper
// connects to a Unix socket only this run's worker serves (`serveGitCredentials`), in a 0700 directory, and presents a
// nonce made for the run; the socket's path and the nonce are in the agent's environment, the credential never is. The
// helper answers `quit=1` with a line on stderr when there is no credential, so git stops rather than trying another
// helper or prompting.
//
// The runner's own git (checkout, submodules, the end-of-run push) asks the broker directly (checkout.ts
// `withRepoAuth`) and retries once with a fresh credential when the remote refuses the first.
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { chmod, lstat, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';

import {
  GitCredentialSchema,
  RUNNER_ROUTES,
  routePath,
  type RepoCredential,
} from '../protocol/index.ts';
import { ApiError, type ApiClient } from '../lib/http.ts';
import { LOST_CODES } from '../core/lease.ts';
import {
  RepoAccessFailure,
  type GitAuth,
  type RepoAuthSource,
} from '../core/checkout.ts';
import type { SpoolEvent } from '../core/events.ts';

/** The environment variables the helper finds the worker's socket and the run's nonce in. */
export const CREDENTIAL_SOCKET_ENV = 'NOCOBASE_RUNNER_GIT_CREDENTIAL_SOCKET';
export const CREDENTIAL_NONCE_ENV = 'NOCOBASE_RUNNER_GIT_CREDENTIAL_NONCE';

/** A held credential is asked for anew once it has less than this left. */
export const REFRESH_MARGIN_MS: number = 5 * 60_000;
/** At most one forced refresh (after the remote refused a credential) per repository in this long. */
export const FORCED_REFRESH_INTERVAL_MS = 60_000;
/** How long the broker waits for the server's answer. */
export const ISSUE_REQUEST_TIMEOUT_MS = 30_000;
/** At most this many failure events per repository, so an agent retrying in a loop does not flood the transcript. */
const MAX_FAILURE_EVENTS = 20;

export interface GitCredentialBrokerOptions {
  client: ApiClient;
  runId: string;
  attempt: number;
  /** `RunGit.onDemand`. */
  onDemand?: readonly string[];
  /** `RunGit.credentials`. */
  credentials?: readonly RepoCredential[];
  /** Every credential the broker holds, as it gets it: for the run's redactor. */
  onSecret: (secret: string) => void;
  /** The server says the run is no longer this runner's. */
  onLost: (code: string) => void;
  event?: (event: SpoolEvent) => void;
  log?: (message: string) => void;
  now?: () => number;
  timeoutMs?: number;
}

interface Held {
  readonly auth: GitAuth;
  /** Epoch ms; infinite for a claim's credential, which the broker cannot renew. */
  readonly expiresAt: number;
}

export class GitCredentialBroker implements RepoAuthSource {
  /** Every URL it answers for, in a fixed order: the helper names a repository by its index here. */
  readonly urls: readonly string[];
  private readonly options: GitCredentialBrokerOptions;
  private readonly onDemand: ReadonlySet<string>;
  private readonly fixed = new Map<string, Held>();
  private readonly held = new Map<string, Held>();
  private readonly stale = new Set<string>();
  private readonly lastForced = new Map<string, number>();
  private readonly inflight = new Map<string, Promise<GitAuth>>();
  private readonly failures = new Map<string, number>();
  private closed = false;

  constructor(options: GitCredentialBrokerOptions) {
    this.options = options;
    this.onDemand = new Set(options.onDemand ?? []);
    for (const credential of options.credentials ?? []) {
      if (this.onDemand.has(credential.url)) continue;
      this.fixed.set(credential.url, {
        auth: { username: credential.username, token: credential.password },
        expiresAt: Number.POSITIVE_INFINITY,
      });
      options.onSecret(credential.password);
    }
    this.urls = [...this.onDemand, ...this.fixed.keys()];
  }

  private now(): number {
    return this.options.now?.() ?? Date.now();
  }

  covers(url: string): boolean {
    return this.onDemand.has(url) || this.fixed.has(url);
  }

  /** Whether the run is still this runner's, as far as the broker knows. */
  get isClosed(): boolean {
    return this.closed;
  }

  async get(
    url: string,
    options: { refresh?: boolean } = {},
  ): Promise<GitAuth> {
    if (this.closed)
      throw this.fail(
        url,
        new RepoAccessFailure(
          'leaseLost',
          `The run is no longer this runner's, so no credential is given for ${url}.`,
        ),
      );
    const fixed = this.fixed.get(url);
    if (fixed !== undefined) return fixed.auth;
    if (!this.onDemand.has(url))
      throw new RepoAccessFailure(
        'denied',
        `${url} is not one of the run's repositories.`,
      );
    const forced = options.refresh === true || this.stale.has(url);
    const held = this.held.get(url);
    if (
      !forced &&
      held !== undefined &&
      held.expiresAt - this.now() > REFRESH_MARGIN_MS
    )
      return held.auth;
    const pending = this.inflight.get(url);
    if (pending !== undefined) return pending;
    const request = this.fetch(url, forced && this.mayForce(url)).finally(() =>
      this.inflight.delete(url),
    );
    this.inflight.set(url, request);
    return request;
  }

  /**
   * git says the remote refused `auth`: forget it when it is the credential held for `url`, so the next request asks
   * for a fresh one. True when it was.
   */
  erase(url: string, auth: Pick<GitAuth, 'token'>): boolean {
    const held = this.held.get(url);
    if (held === undefined || held.auth.token !== auth.token) return false;
    this.held.delete(url);
    this.stale.add(url);
    this.options.log?.(
      `git credential: ${url}: refused by the remote; discarded`,
    );
    return true;
  }

  /** Forgets everything and answers nothing more: the run ended, or is no longer this runner's. */
  close(): void {
    this.closed = true;
    this.held.clear();
    this.fixed.clear();
  }

  private mayForce(url: string): boolean {
    const last = this.lastForced.get(url);
    const now = this.now();
    if (last !== undefined && now - last < FORCED_REFRESH_INTERVAL_MS)
      return false;
    this.lastForced.set(url, now);
    return true;
  }

  private async fetch(url: string, refresh: boolean): Promise<GitAuth> {
    const { client, runId, attempt } = this.options;
    try {
      const credential = await client.post(
        routePath(RUNNER_ROUTES.gitCredential, { runId }),
        { attempt, url, ...(refresh ? { refresh: true } : {}) },
        GitCredentialSchema,
        { timeoutMs: this.options.timeoutMs ?? ISSUE_REQUEST_TIMEOUT_MS },
      );
      this.options.onSecret(credential.password);
      if (this.closed)
        throw new RepoAccessFailure(
          'leaseLost',
          `The run is no longer this runner's, so no credential is given for ${url}.`,
        );
      const expiresAt = Date.parse(credential.expiresAt);
      // A credential that expired on its way here (or names no expiry) is neither kept nor given to git, and the one
      // held before is not used instead.
      if (Number.isNaN(expiresAt) || expiresAt <= this.now()) {
        this.held.delete(url);
        throw new RepoAccessFailure(
          'unavailable',
          `The application issued a credential for ${url} that had already expired when it arrived. Try again in a minute.`,
        );
      }
      const auth: GitAuth = {
        username: credential.username,
        token: credential.password,
      };
      this.held.set(url, { auth, expiresAt });
      this.stale.delete(url);
      this.options.log?.(
        `git credential: ${url}: issued${refresh ? ' anew' : ''}, valid until ${credential.expiresAt}`,
      );
      return auth;
    } catch (error) {
      throw this.fail(url, this.failureOf(url, error));
    }
  }

  private failureOf(url: string, error: unknown): RepoAccessFailure {
    if (error instanceof RepoAccessFailure) return error;
    if (!(error instanceof ApiError))
      return new RepoAccessFailure(
        'unavailable',
        `Could not ask the application for a credential for ${url}: ${error instanceof Error ? error.message : String(error)}. Try again in a minute.`,
      );
    if (LOST_CODES.has(error.reason)) {
      this.close();
      this.options.onLost(error.reason);
      return new RepoAccessFailure(
        'leaseLost',
        `The run is no longer this runner's (${error.reason}), so no credential is given for ${url}.`,
      );
    }
    if (error.reason === 'REPO_ACCESS_UNAVAILABLE' || error.transient)
      return new RepoAccessFailure(
        'unavailable',
        `The application could not issue a credential for ${url} just now: ${error.message} Try again in a minute.`,
      );
    return new RepoAccessFailure(
      'denied',
      `The application will not issue a credential for ${url}: ${error.message} A person has to check the application's access to the repository.`,
    );
  }

  private fail(url: string, failure: RepoAccessFailure): RepoAccessFailure {
    const count = (this.failures.get(url) ?? 0) + 1;
    this.failures.set(url, count);
    if (count <= MAX_FAILURE_EVENTS)
      this.options.event?.({
        type: 'error',
        content: failure.message,
        meta: { kind: 'gitCredential', url, reason: failure.kind },
      });
    this.options.log?.(`git credential: ${url}: ${failure.kind}`);
    return failure;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// The socket the helper talks to

/** Where a Unix socket path must fit: `sun_path` is 108 bytes on Linux and 104 on macOS, the terminating NUL included. */
export const MAX_SOCKET_PATH_BYTES = 100;

/** A directory only this user can enter, for the runner's sockets: created 0700, refused when someone else owns it. */
async function privateDir(dir: string): Promise<string> {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const info = await lstat(dir);
  if (
    !info.isDirectory() ||
    info.isSymbolicLink() ||
    (process.getuid !== undefined && info.uid !== process.getuid())
  )
    throw new Error(`${dir} is not a private directory of this user.`);
  await chmod(dir, 0o700);
  return dir;
}

/**
 * A new socket path for one run: in `<runner home>/sockets`, or, when that path would be too long for a Unix socket,
 * in `/tmp/nocobase-runner-<uid>` (private to this user).
 */
export async function credentialSocketPath(home: string): Promise<string> {
  const name = `${randomBytes(6).toString('hex')}.sock`;
  const preferred = path.join(home, 'sockets');
  if (Buffer.byteLength(path.join(preferred, name)) <= MAX_SOCKET_PATH_BYTES)
    return path.join(await privateDir(preferred), name);
  const uid = process.getuid?.() ?? 'user';
  const fallback = path.join('/tmp', `nocobase-runner-${uid}`);
  return path.join(await privateDir(fallback), name);
}

export interface CredentialServer {
  readonly socket: string;
  readonly nonce: string;
  close(): Promise<void>;
}

interface HelperRequest {
  readonly nonce?: unknown;
  readonly action?: unknown;
  readonly index?: unknown;
  readonly password?: unknown;
}

const MAX_REQUEST_BYTES = 64 * 1024;

function sameNonce(given: unknown, nonce: string): boolean {
  if (typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(nonce);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Serves `broker` to the helper on a new Unix socket for this run. */
export async function serveGitCredentials(
  broker: GitCredentialBroker,
  home: string,
): Promise<CredentialServer> {
  const socket = await credentialSocketPath(home);
  const nonce = randomBytes(24).toString('hex');
  const answer = async (request: HelperRequest): Promise<object> => {
    if (!sameNonce(request.nonce, nonce))
      return { ok: false, message: 'This helper does not belong to the run.' };
    const url =
      typeof request.index === 'number'
        ? broker.urls[request.index]
        : undefined;
    if (url === undefined)
      return { ok: false, message: 'Not one of the run’s repositories.' };
    if (request.action === 'erase') {
      const erased =
        typeof request.password === 'string' &&
        broker.erase(url, { token: request.password });
      return { ok: true, erased, url };
    }
    if (request.action !== 'get')
      return {
        ok: false,
        message: `Unknown action ${String(request.action)}.`,
      };
    try {
      const auth = await broker.get(url);
      return {
        ok: true,
        username: auth.username ?? 'x-access-token',
        password: auth.token,
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'No credential is available.',
      };
    }
  };
  const server = net.createServer((connection) => {
    let buffer = '';
    connection.setEncoding('utf8');
    connection.on('error', () => undefined);
    connection.on('data', (chunk: string) => {
      buffer += chunk;
      if (buffer.length > MAX_REQUEST_BYTES) {
        connection.destroy();
        return;
      }
      const end = buffer.indexOf('\n');
      if (end === -1) return;
      let request: HelperRequest;
      try {
        request = JSON.parse(buffer.slice(0, end)) as HelperRequest;
      } catch {
        connection.end(
          `${JSON.stringify({ ok: false, message: 'Bad request.' })}\n`,
        );
        return;
      }
      buffer = '';
      void answer(request).then((response) =>
        connection.end(`${JSON.stringify(response)}\n`),
      );
    });
  });
  await rm(socket, { force: true });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(socket, () => {
      server.off('error', reject);
      resolve();
    });
  });
  await chmod(socket, 0o600);
  return {
    socket,
    nonce,
    async close() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await rm(socket, { force: true });
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// The helper git runs

export const HELPER_FILE = 'git-credential-nocobase-runner.mjs';

/**
 * The credential helper, run by git as `<node> <file> <index> <action>` with git's request on stdin. It holds no
 * secret: it asks the worker's socket, and prints what git needs.
 */
export const HELPER_SCRIPT: string = `// Installed by nocobase-runner: answers git's credential requests for a run's repository from the runner.
import net from 'node:net';

const [index, action] = process.argv.slice(2);
const socket = process.env.${CREDENTIAL_SOCKET_ENV};
const nonce = process.env.${CREDENTIAL_NONCE_ENV};
const say = (line) => process.stderr.write('nocobase-runner: ' + line + '\\n');

let input = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) input += chunk;
if (action !== 'get' && action !== 'erase') process.exit(0);
const fields = Object.fromEntries(
  input.split('\\n').filter((line) => line.includes('=')).map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);

const ask = (request) => new Promise((resolve) => {
  if (!socket || !nonce) {
    resolve({ ok: false, message: 'This shell is not part of a run; no credential is available.' });
    return;
  }
  let answer = '';
  const connection = net.createConnection(socket);
  const timer = setTimeout(() => {
    connection.destroy();
    resolve({ ok: false, message: 'The runner did not answer in time; try again.' });
  }, 60_000);
  connection.setEncoding('utf8');
  connection.on('connect', () => connection.write(JSON.stringify({ ...request, nonce }) + '\\n'));
  connection.on('data', (chunk) => { answer += chunk; });
  connection.on('error', () => {
    clearTimeout(timer);
    resolve({ ok: false, message: 'The runner that held this run is gone; no credential is available.' });
  });
  connection.on('close', () => {
    clearTimeout(timer);
    try { resolve(JSON.parse(answer)); } catch { resolve({ ok: false, message: 'The runner gave no answer.' }); }
  });
});

const response = await ask({ action, index: Number(index), password: fields.password });
if (action === 'get') {
  if (response.ok) process.stdout.write('username=' + response.username + '\\npassword=' + response.password + '\\n');
  else {
    say(response.message);
    process.stdout.write('quit=1\\n');
  }
} else if (response.ok && response.erased) {
  say('the remote refused the credential for ' + response.url + '; the runner discarded it. Run the git command again once to use a fresh one.');
}
`;

/** Writes the helper into `dir` (the runner's own directory), replacing an older copy atomically; answers its path. */
export async function installCredentialHelper(dir: string): Promise<string> {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, HELPER_FILE);
  const temporary = `${file}.${process.pid}.${randomBytes(4).toString('hex')}`;
  await writeFile(temporary, HELPER_SCRIPT, { mode: 0o755 });
  await rename(temporary, file);
  return file;
}

/** The `credential.<url>.helper` value that runs the helper for the repository at `index`. */
export function helperCommand(helper: string, index: number): string {
  const quote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;
  return `!${quote(process.execPath)} ${quote(helper)} ${index}`;
}
