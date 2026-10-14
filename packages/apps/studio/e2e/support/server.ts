/**
 * Starts a throwaway Studio for the browser tests: the built server (`dist/server/standalone.js`, from `pnpm build`) on a
 * free port, with a configuration, a SQLite database and a storage directory of its own in a temporary directory, and
 * the demo data (`app.sampleData`) built at installation. Nothing is shared with a development server or with the
 * checkout's `storage/`.
 *
 * It also starts a local OpenAI-compatible model (`mock-llm.ts`) in a process of its own and, once the demo is built,
 * adds it through the agents API as the model service `mock-llm` (`setUpModelService`), which the application's own
 * model calls use without a real model. Agents answer on runners; the tests stand one in (`runner.ts`).
 *
 * Used by `global-setup.ts`, which records what it started in a state file that `global-teardown.ts` and the tests
 * read (`readState`).
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  openSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { MOCK_MODEL } from './mock-llm.ts';

export const STUDIO_ROOT = path.resolve(import.meta.dirname, '../..');

/** Where global setup records the server it started. */
export const STATE_FILE = path.join(
  STUDIO_ROOT,
  'node_modules/.tmp/studio-e2e-state.json',
);

/** The port a shared preview runs on; the tests never use it. */
const RESERVED_PORTS = new Set([13917]);

export const ADMIN = {
  username: 'nocobase',
  email: 'admin@nocobase.com',
  password: 'admin123',
} as const;

export interface ServerState {
  /** `http://127.0.0.1:<port>/main`, without a trailing slash. */
  readonly baseURL: string;
  readonly origin: string;
  readonly pid: number;
  readonly directory: string;
  /** Whether this run started the server, rather than reusing one through `NB_STUDIO_E2E_URL`. */
  readonly owned: boolean;
  /** A server reserved exclusively for a destructive test, never the global server. */
  readonly isolated?: boolean;
  /** The mock model's process and base URL, when this run started one. */
  readonly llm?: { readonly pid: number; readonly url: string };
}

export function readState(): ServerState {
  const fromEnv = process.env.NB_STUDIO_E2E_URL;
  if (fromEnv) {
    const baseURL = fromEnv.replace(/\/+$/, '');
    return {
      baseURL,
      origin: new URL(baseURL).origin,
      pid: 0,
      directory: '',
      owned: false,
    };
  }
  if (!existsSync(STATE_FILE))
    throw new Error(
      'No Studio e2e server: run the tests through `pnpm test:e2e`, whose global setup starts one.',
    );
  return JSON.parse(readFileSync(STATE_FILE, 'utf8')) as ServerState;
}

export function writeState(state: ServerState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function freePort(): Promise<number> {
  for (;;) {
    const port = await new Promise<number>((resolve, reject) => {
      const server = createServer();
      server.unref();
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        const value = typeof address === 'object' && address ? address.port : 0;
        server.close(() => resolve(value));
      });
    });
    if (port && !RESERVED_PORTS.has(port)) return port;
  }
}

/** The model service the application's own model calls use in the browser tests: the mock model (`mock-llm.ts`), named from its title. */
export const MOCK_SERVICE = { name: 'mock-llm', title: 'Mock LLM' } as const;

function configYaml(options: {
  origin: string;
  port: number;
  directory: string;
}): string {
  const secret = () => randomBytes(32).toString('hex');
  // JSON is YAML, and keeps quoting out of the way.
  return JSON.stringify(
    {
      app: { publicOrigin: options.origin, sampleData: true },
      i18n: { defaultLocale: 'zh-CN' },
      client: { app: { title: 'Studio' } },
      users: { initialAdmin: ADMIN },
      secrets: { keys: [{ version: 1, key: secret() }] },
      auth: {
        emailAndPassword: { enabled: true, autoSignIn: false },
        session: { storeSessionInDatabase: true },
        // The tests sign in far more often than a person would; Better Auth's sign-in limit would refuse them.
        rateLimit: { enabled: false },
      },
      notification: { channels: { inbox: { provider: 'in-app' } } },
      database: {
        default: 'main',
        connections: {
          main: {
            dialect: 'sqlite',
            database: path.join(options.directory, 'database.sqlite'),
            debug: false,
            schemaManagement: 'managed',
            migrations: { autoRun: true },
            seeds: { autoRun: true },
          },
        },
      },
      jobs: { default: 'memory' },
      server: { host: '127.0.0.1', port: options.port, startLog: true },
      logging: {
        level: 'warn',
        file: { enabled: false },
        console: { enabled: true, pretty: false },
      },
    },
    null,
    2,
  );
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Signs in and returns the session cookie, or null while the account does not exist yet. */
async function trySignIn(
  baseURL: string,
  origin: string,
  email: string,
  password: string,
): Promise<string | null> {
  try {
    const response = await fetch(`${baseURL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return null;
    return response.headers
      .getSetCookie()
      .map((header) => header.split(';')[0])
      .join('; ');
  } catch {
    return null;
  }
}

/**
 * Waits until the demo data is there. The demo is built after the server starts listening, knowledge last, so the
 * demo knowledge proposal is the last thing to appear.
 */
async function waitForDemo(
  baseURL: string,
  origin: string,
  deadline: number,
): Promise<void> {
  while (Date.now() < deadline) {
    const cookie = await trySignIn(
      baseURL,
      origin,
      'alex@example.com',
      'demo1234',
    );
    if (cookie) {
      const response = await fetch(`${baseURL}/api/knowledge/proposals`, {
        headers: { cookie },
      }).catch(() => null);
      if (response?.ok) {
        const body = (await response.json()) as { data?: unknown[] };
        if ((body.data?.length ?? 0) > 0) return;
      }
    }
    await sleep(1000);
  }
  throw new Error(
    'The Studio e2e server did not finish building its demo data.',
  );
}

/** A call to the API as a signed-in person; its `data`, or throws with what the server said. */
async function call<T>(
  baseURL: string,
  origin: string,
  cookie: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${baseURL}/api/${path}`, {
    method,
    headers: { 'content-type': 'application/json', origin, cookie },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  if (!response.ok)
    throw new Error(`${method} /api/${path}: ${response.status} ${text}`);
  if (!text) return undefined as T;
  const json = JSON.parse(text) as { data?: unknown };
  return (
    json && typeof json === 'object' && 'data' in json ? json.data : json
  ) as T;
}

/** Adds the mock model as a model service through the agents API, for the application's own model calls. */
async function setUpModelService(
  baseURL: string,
  origin: string,
  llmUrl: string,
): Promise<void> {
  const cookie = await trySignIn(baseURL, origin, ADMIN.email, ADMIN.password);
  if (!cookie) throw new Error('The e2e administrator could not sign in.');
  const api = <T>(method: string, path: string, body?: unknown) =>
    call<T>(baseURL, origin, cookie, method, path, body);
  const service = await api<{ name: string }>('POST', 'agents/services', {
    title: MOCK_SERVICE.title,
    provider: 'openai-compatible',
    baseUrl: llmUrl,
    apiKey: 'mock-key',
    models: [{ value: MOCK_MODEL, label: 'Mock model' }],
  });
  if (service.name !== MOCK_SERVICE.name)
    throw new Error(`The mock model service is named ${service.name}.`);
}

/** Starts the mock model in a process of its own on a free port; its base URL. */
async function startLlm(
  directory: string,
): Promise<{ pid: number; url: string }> {
  const port = await freePort();
  const log = openSync(path.join(directory, 'mock-llm.log'), 'a');
  const child = spawn(
    process.execPath,
    [path.join(import.meta.dirname, 'mock-llm.ts'), '--port', String(port)],
    { detached: true, stdio: ['ignore', log, log] },
  );
  child.unref();
  if (!child.pid) throw new Error('The mock model did not start.');
  const url = `http://127.0.0.1:${port}/v1`;
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${url}/models`).catch(() => null);
    if (response?.ok) return { pid: child.pid, url };
    await sleep(200);
  }
  throw new Error('The mock model did not answer.');
}

export async function startStudio(
  options: { isolated?: boolean } = {},
): Promise<ServerState> {
  const entry = path.join(STUDIO_ROOT, 'dist/server/standalone.js');
  if (!existsSync(entry))
    throw new Error(
      'dist/server/standalone.js is missing: run `pnpm build` before the browser tests.',
    );
  const directory = mkdtempSync(path.join(tmpdir(), 'studio-e2e-'));
  const llm = await startLlm(directory);
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const configFile = path.join(directory, 'config.yml');
  writeFileSync(configFile, configYaml({ origin, port, directory }));
  const log = openSync(path.join(directory, 'server.log'), 'a');
  const child = spawn(process.execPath, [entry], {
    cwd: path.join(STUDIO_ROOT, 'dist'),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      APP_CONFIG_FILE: configFile,
      APP_STORAGE_DIR: path.join(directory, 'storage'),
      APP_BASE_PATH: '/main',
      APP_SERVER_PORT: String(port),
      APP_SERVER_HOST: '127.0.0.1',
      APP_PUBLIC_ORIGIN: origin,
    },
    // Its own process group, so teardown stops it and everything it started, and nothing else.
    detached: true,
    stdio: ['ignore', log, log],
  });
  child.unref();
  if (!child.pid) throw new Error('The Studio e2e server did not start.');
  const baseURL = `${origin}/main`;
  const state: ServerState = {
    baseURL,
    origin,
    pid: child.pid,
    directory,
    owned: true,
    isolated: options.isolated === true,
    llm,
  };
  if (!state.isolated) writeState(state);
  let exited: number | null = null;
  child.once('exit', (code) => {
    exited = code ?? -1;
  });
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (exited !== null)
      throw new Error(
        `The Studio e2e server exited (${exited}); see ${path.join(directory, 'server.log')}.`,
      );
    const response = await fetch(`${baseURL}/login`).catch(() => null);
    if (response?.ok) break;
    await sleep(500);
  }
  await waitForDemo(baseURL, origin, deadline);
  await setUpModelService(baseURL, origin, llm.url);
  return state;
}

export async function stopStudio(state: ServerState): Promise<void> {
  if (!state.owned || !state.pid) return;
  if (state.llm)
    try {
      process.kill(-state.llm.pid, 'SIGTERM');
    } catch {
      // Already gone.
    }
  const alive = () => {
    try {
      process.kill(state.pid, 0);
      return true;
    } catch {
      return false;
    }
  };
  try {
    process.kill(-state.pid, 'SIGTERM');
  } catch {
    // Already gone.
  }
  const deadline = Date.now() + 20_000;
  while (alive() && Date.now() < deadline) await sleep(200);
  if (alive()) {
    try {
      process.kill(-state.pid, 'SIGKILL');
    } catch {
      // Already gone.
    }
  }
}

/** Crashes and restarts only this test's owned server against its existing database and configuration. */
export async function restartOwnedStudio(
  state: ServerState,
): Promise<ServerState> {
  if (!state.owned || !state.isolated)
    throw new Error(
      'Crash verification requires a throwaway server owned by this test.',
    );
  process.kill(-state.pid, 'SIGKILL');
  await sleep(500);
  const log = openSync(path.join(state.directory, 'server.log'), 'a');
  const port = new URL(state.origin).port;
  const child = spawn(
    process.execPath,
    [path.join(STUDIO_ROOT, 'dist/server/standalone.js')],
    {
      cwd: path.join(STUDIO_ROOT, 'dist'),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        APP_CONFIG_FILE: path.join(state.directory, 'config.yml'),
        APP_STORAGE_DIR: path.join(state.directory, 'storage'),
        APP_BASE_PATH: '/main',
        APP_SERVER_PORT: port,
        APP_SERVER_HOST: '127.0.0.1',
        APP_PUBLIC_ORIGIN: state.origin,
      },
      detached: true,
      stdio: ['ignore', log, log],
    },
  );
  child.unref();
  if (!child.pid) throw new Error('The test server could not restart.');
  const restarted = { ...state, pid: child.pid };
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${state.baseURL}/login`).catch(() => null);
    if (response?.ok) {
      await waitForDemo(state.baseURL, state.origin, deadline);
      return restarted;
    }
    await sleep(500);
  }
  throw new Error('The test server did not recover after a crash.');
}
