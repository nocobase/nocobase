import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import {
  mkdir,
  mkdtemp,
  open,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { loadStandaloneAppEnv } from '@nocobase/app-server/node';
import {
  DEFAULT_APP_BASE_PATH,
  normalizeBasePath,
} from '@nocobase/app-server/support';
import { waitForHttpReady } from '../../tools/scripts/dev/readiness.mjs';

export interface ScreenshotCredentials {
  readonly email: string;
  readonly password: string;
}

interface ScreenshotSettings {
  readonly env?: Readonly<Record<string, string>>;
  readonly readyPath?: string;
}

interface ScreenshotServerOptions {
  readonly root: string;
  readonly logPath: string;
  readonly hooks: string;
  readonly sampleData: boolean;
  readonly signal: AbortSignal;
}

export interface ScreenshotServer {
  readonly baseURL: URL;
  readonly credentials: ScreenshotCredentials;
  readonly sessionPath: string;
  readonly exited: Promise<string>;
  readonly close: () => Promise<void>;
}

const devEntry = fileURLToPath(
  new URL('../../tools/scripts/dev/index.mjs', import.meta.url),
);
const shellEnvironment = [
  'PATH',
  'HOME',
  'USERPROFILE',
  'LANG',
  'LC_ALL',
  'TMPDIR',
  'TMP',
  'TEMP',
  'SYSTEMROOT',
  'XDG_CACHE_HOME',
  'XDG_CONFIG_HOME',
];

export async function startScreenshotServer(
  options: ScreenshotServerOptions,
): Promise<ScreenshotServer> {
  if (process.platform === 'win32') {
    throw new Error(
      'Starting an isolated screenshot server requires macOS or Linux. Use --url to capture an existing instance on Windows.',
    );
  }
  const { root, logPath, signal } = options;
  const manifest = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8'),
  ) as {
    nocobase?: { screenshot?: ScreenshotSettings };
  };
  const settings = manifest.nocobase?.screenshot;
  const extensionEnv = settings?.env;
  if (
    extensionEnv &&
    (typeof extensionEnv !== 'object' ||
      Array.isArray(extensionEnv) ||
      Object.values(extensionEnv).some((value) => typeof value !== 'string'))
  ) {
    throw new Error(
      'package.json nocobase.screenshot.env must map environment variable names to strings.',
    );
  }
  const readyPath = settings?.readyPath;
  if (readyPath !== undefined && typeof readyPath !== 'string') {
    throw new Error(
      'package.json nocobase.screenshot.readyPath must be an application-relative HTTP path.',
    );
  }
  const basePath = normalizeBasePath(
    loadStandaloneAppEnv({ rootDir: root }).APP_BASE_PATH ??
      DEFAULT_APP_BASE_PATH,
  );
  const directory = await mkdtemp(path.join(tmpdir(), 'nocobase-screenshot-'));
  const configPath = path.join(directory, 'config.yml');
  const sessionPath = path.join(directory, 'session.json');
  const storage = path.join(directory, 'storage');
  const credentials = {
    email: 'screenshot@nocobase.test',
    password: randomBytes(24).toString('base64url'),
  };
  let stopWorker: (() => Promise<void>) | undefined;
  try {
    await mkdir(storage);
    await writeFile(
      configPath,
      JSON.stringify({
        app: { sampleData: options.sampleData },
        database: {
          default: 'main',
          connections: {
            main: {
              dialect: 'sqlite',
              filename: path.join(storage, 'database.sqlite'),
              schemaManagement: 'managed',
              migrations: { autoRun: true },
              seeds: { autoRun: true },
            },
          },
        },
        users: { initialAdmin: { username: 'screenshot', ...credentials } },
        secrets: {
          keys: [{ version: 1, key: randomBytes(32).toString('hex') }],
        },
        auth: {
          emailAndPassword: { enabled: true, autoSignIn: false },
          session: { storeSessionInDatabase: true },
          rateLimit: { enabled: false },
        },
      }),
      { mode: 0o600 },
    );

    signal.throwIfAborted();
    const env = Object.fromEntries(
      shellEnvironment.map((key) => [key, process.env[key]]),
    );
    const log = await open(logPath, 'a', 0o600);
    let child;
    try {
      child = spawn(process.execPath, ['--import', 'tsx', devEntry], {
        cwd: root,
        detached: true,
        stdio: ['ignore', log.fd, log.fd, 'ipc'],
        env: {
          ...env,
          ...extensionEnv,
          NODE_ENV: 'development',
          NOCOBASE_TOOL_ROOT: root,
          NOCOBASE_CLI_HOOKS: options.hooks,
          NOCOBASE_DEV_ISOLATED: 'true',
          NOCOBASE_DEV_ALLOW_MULTIPLE: 'true',
          NOCOBASE_STRICT_STARTUP: 'true',
          NOCOBASE_SCREENSHOT_VITE_CACHE: path.join(directory, 'vite'),
          NOCOBASE_COLLECTIONS_REFRESH: '',
          APP_BASE_PATH: basePath,
          APP_CONFIG_FILE: configPath,
          APP_STORAGE_DIR: storage,
          APP_SERVER_HOST: '127.0.0.1',
          APP_VITE_DEV_HOST: '127.0.0.1',
          PROXY_TARGET_URL: '',
          DB_DIALECT: 'sqlite',
          DB_FILENAME: path.join(storage, 'database.sqlite'),
          APP_SAMPLE_DATA: String(options.sampleData),
          INITIAL_ADMIN_USERNAME: 'screenshot',
          INITIAL_ADMIN_EMAIL: credentials.email,
          INITIAL_ADMIN_PASSWORD: credentials.password,
        },
      });
    } catch (error) {
      await log.close();
      throw error;
    }
    const exited = new Promise<string>((resolve) => {
      child.once('error', (error) => resolve(error.message));
      child.once('exit', (code, exitSignal) =>
        resolve(String(exitSignal ?? code)),
      );
    });
    stopWorker = async () => {
      try {
        if (child.pid !== undefined) await stopProcessGroup(child.pid);
        await exited;
      } finally {
        await log.close();
      }
    };

    const startupSignal = AbortSignal.any([
      signal,
      AbortSignal.timeout(150_000),
    ]);
    const prematureExit = exited.then((result) => {
      throw new Error(`Development server exited (${result}).`);
    });
    const [message] = (await Promise.race([
      once(child, 'message', { signal: startupSignal }),
      prematureExit,
    ])) as [{ appUrl: string }];
    const baseURL = new URL(message.appUrl);
    if (readyPath) {
      await Promise.race([
        waitForHttpReady({
          url: appRelativeURL(baseURL, readyPath).href,
          label: 'Application screenshot readiness check',
          signal: startupSignal,
        }),
        prematureExit,
      ]);
    }
    return {
      baseURL,
      credentials,
      sessionPath,
      exited,
      close: async () => {
        try {
          await stopWorker?.();
        } finally {
          await rm(directory, { recursive: true, force: true });
        }
      },
    };
  } catch (error) {
    try {
      await stopWorker?.();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
    throw error;
  }
}

async function stopProcessGroup(pid: number): Promise<void> {
  const signalGroup = (signal: NodeJS.Signals | 0): boolean => {
    try {
      return process.kill(-pid, signal);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false;
      throw error;
    }
  };
  if (!signalGroup('SIGTERM')) return;
  const deadline = performance.now() + 5_000;
  while (signalGroup(0)) {
    if (performance.now() >= deadline) {
      signalGroup('SIGKILL');
      return;
    }
    await delay(50);
  }
}

export function appRelativeURL(base: URL, route: string): URL {
  if (/^[a-z][a-z\d+.-]*:|^[\\/]{2}|\\/iu.test(route)) {
    throw new Error(`Expected an application-relative path: ${route}`);
  }
  const url = new URL(route.replace(/^\//u, ''), base);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new Error(`Path leaves the application base: ${route}`);
  }
  return url;
}

export async function writeScreenshotSession(
  server: ScreenshotServer,
): Promise<void> {
  await writeFile(
    server.sessionPath,
    JSON.stringify({
      url: server.baseURL.href,
      ...server.credentials,
    }),
    { mode: 0o600, flag: 'wx' },
  );
}

export async function readScreenshotSession(
  sessionPath: string,
  baseURL: URL,
): Promise<ScreenshotCredentials> {
  const session = JSON.parse(await readFile(sessionPath, 'utf8')) as {
    url?: string;
    email?: string;
    password?: string;
  };
  if (session.url !== baseURL.href || !session.email || !session.password) {
    throw new Error('The screenshot session file does not match --url.');
  }
  return { email: session.email, password: session.password };
}
