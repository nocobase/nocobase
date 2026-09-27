import spawn from 'cross-spawn';
import path from 'node:path';
import { loadStandaloneAppEnv } from '@nocobase/app-server/node';
import {
  DEFAULT_APP_BASE_PATH,
  normalizeBasePath,
} from '@nocobase/app-server/support';

import { readCliHooks, runHookStage } from '../utils/cli-hooks.mjs';
import { assertConfigurationPresent } from '../utils/config-presence.mjs';
import { resolvePluginWatchIncludes } from './plugin-watches.mjs';
import { resolveConfigWatch, watchConfigFiles } from './config-watch.mjs';
import {
  DEPENDENCY_SETTLE_MS,
  resolveDependencyWatch,
} from './dependency-watch.mjs';
import { acquireDevInstanceLock } from './instance-lock.mjs';
import { resolveDevShutdownEnv } from './shutdown-budget.mjs';
import { resolveWatchEnvironment } from './watch-environment.mjs';
import { findAvailablePort } from './ports.mjs';
import { waitForHttpReady } from './readiness.mjs';
import { parseProxyTarget } from './proxy.mjs';
import { resolveDevTrustedOrigins } from './trusted-origins.mjs';

const startedAt = performance.now();
const progress = (message) =>
  console.log(
    `[dev] ${message} (${((performance.now() - startedAt) / 1000).toFixed(1)}s)`,
  );

// All child commands run from the explicitly supplied application root.
const rootDir = path.resolve(process.env.NOCOBASE_TOOL_ROOT || process.cwd());
const viteDevPreferredPort = 5173;

const loadEnv = () => loadStandaloneAppEnv({ rootDir });

const toUrlHost = (host) => {
  if (host === '0.0.0.0') return '127.0.0.1';
  if (host === '::') return '[::1]';
  if (host.includes(':') && !host.startsWith('[')) return `[${host}]`;
  return host;
};

const numberFromEnv = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const pipeViteOutput = (child) => {
  let suppressStartupBanner = true;
  let buffer = '';

  child.stdout?.on('data', (chunk) => {
    if (!suppressStartupBanner) {
      process.stdout.write(chunk);
      return;
    }

    buffer += chunk.toString();

    const helpIndex = buffer.indexOf('press h + enter to show help');
    if (helpIndex >= 0) {
      suppressStartupBanner = false;
      const nextLineIndex = buffer.indexOf('\n', helpIndex);
      const rest = nextLineIndex >= 0 ? buffer.slice(nextLineIndex + 1) : '';
      if (rest) {
        process.stdout.write(rest);
      }
      buffer = '';
      return;
    }

    if (buffer.length > 16_000) {
      suppressStartupBanner = false;
      process.stdout.write(buffer);
      buffer = '';
    }
  });

  child.stderr?.pipe(process.stderr);
};

const spawnDevProcess = (label, command, args, env, options = {}) => {
  const child = spawn(command, args, {
    cwd: rootDir,
    env,
    stdio:
      options.stdio ??
      (options.filterViteStartup ? ['inherit', 'pipe', 'pipe'] : 'inherit'),
  });

  if (options.filterViteStartup) {
    pipeViteOutput(child);
  }

  child.once('error', (error) => {
    console.error(`[${label}] failed to start`, error);
    shutdown(1);
  });

  child.once('exit', (code, signal) => {
    if (shuttingDown) return;

    console.error(
      `[${label}] exited unexpectedly; code=${code ?? 'null'} signal=${signal ?? 'null'}`,
    );
    shutdown(typeof code === 'number' && code !== 0 ? code : 1);
  });

  return child;
};

let shuttingDown = false;
let envRestartTimer;
let envWatcher;
let dependencyWatchers = [];
let dependencyRestartTimer;
let instanceLock;

const shutdown = (exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = exitCode;

  if (envRestartTimer) {
    clearTimeout(envRestartTimer);
    envRestartTimer = undefined;
  }
  envWatcher?.close();
  if (dependencyRestartTimer) {
    clearTimeout(dependencyRestartTimer);
    dependencyRestartTimer = undefined;
  }
  for (const watcher of dependencyWatchers.splice(0)) watcher.close();
  instanceLock?.release();

  // The supervisor owns the complete process group. Exiting the worker starts
  // Execa's graceful termination and bounded escalation for all descendants.
  process.exit(exitCode);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

progress('Loading application environment');
const env = loadEnv();
// Checked before anything is spawned: the server runs under a watcher that will not exit on a startup error, so a
// missing configuration would otherwise surface as a Vite URL that serves a page with no API behind it.
assertConfigurationPresent(rootDir, env, 'dev');
const strictStartup = env.NOCOBASE_STRICT_STARTUP === 'true';
const watchEnv = await resolveWatchEnvironment(env);
progress('Selecting development ports');
const proxyTarget = parseProxyTarget(env.PROXY_TARGET_URL);
const viteDevHost = env.APP_VITE_DEV_HOST || '0.0.0.0';
// In proxy mode Vite is the public app server, so it owns APP_SERVER_PORT.
const configuredVitePort = proxyTarget
  ? numberFromEnv(env.APP_SERVER_PORT, viteDevPreferredPort)
  : viteDevPreferredPort;
const vitePort = await findAvailablePort({
  host: viteDevHost,
  label: 'Vite dev',
  preferredPort: configuredVitePort,
});
// Resolved once and passed to both children, so the server mounts and Vite serves the same path. The server keeps
// the only default; an empty value mounts at the origin root, as it does for the server.
const resolvedBasePath = normalizeBasePath(
  env.APP_BASE_PATH ?? DEFAULT_APP_BASE_PATH,
);
const initialEnv = {
  ...watchEnv,
  APP_BASE_PATH: resolvedBasePath,
  APP_SERVER_HOST: env.APP_SERVER_HOST || '0.0.0.0',
  APP_VITE_DEV_HOST: viteDevHost,
  APP_VITE_DEV_PORT: String(vitePort),
  APP_VITE_DEV_URL: `http://${toUrlHost(viteDevHost)}:${vitePort}`,
};
const appServerHost = initialEnv.APP_SERVER_HOST || '127.0.0.1';
const configuredAppServerPort = numberFromEnv(
  initialEnv.APP_SERVER_PORT,
  13000,
);
const appServerPort = proxyTarget
  ? undefined
  : await findAvailablePort({
      excludedPorts: [vitePort],
      host: appServerHost,
      label: 'application server',
      preferredPort: configuredAppServerPort,
    });
if (proxyTarget && vitePort !== configuredVitePort) {
  console.log(
    `  Vite port ${configuredVitePort} is unavailable; using ${vitePort}.`,
  );
}
if (!proxyTarget && appServerPort !== configuredAppServerPort) {
  console.log(
    `  App server port ${configuredAppServerPort} is unavailable; using ${appServerPort}.`,
  );
}
const nextEnv = {
  ...initialEnv,
  APP_SERVER_HOST: appServerHost,
  ...(appServerPort === undefined
    ? {}
    : { APP_SERVER_PORT: String(appServerPort) }),
};
const appOrigin = proxyTarget
  ? nextEnv.APP_VITE_DEV_URL
  : `http://${toUrlHost(appServerHost)}:${appServerPort}`;
const appBasePath = resolvedBasePath.replace(/^\/+/, '');
const appUrl = appBasePath ? `${appOrigin}/${appBasePath}/` : `${appOrigin}/`;
const healthUrl = `${appOrigin}/${[appBasePath, 'api/healthz']
  .filter(Boolean)
  .join('/')}`;
const viteUrl = `${nextEnv.APP_VITE_DEV_URL}/${appBasePath ? `${appBasePath}/` : ''}`;
// Plugin work that has to happen before the client and server processes start. A failure stops the dev run rather
// than being reported and stepped over: whatever the hook produces is something the application is about to read, so
// starting without it gives a running application that is quietly wrong.
const runDevHook = (label, command, args) => {
  console.log(`\n> ${label}`);

  const result = spawn.sync(command, args, {
    cwd: rootDir,
    env: nextEnv,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

progress('Running beforeDev hooks');
runHookStage(readCliHooks().dev, 'beforeDev', runDevHook);
const pluginWatchIncludes = proxyTarget
  ? []
  : await resolvePluginWatchIncludes(rootDir);

// Only a run that owns a local server contends for the application's database;
// a proxy run talks to someone else's and may share the root. Claimed before
// anything starts, so a duplicate costs nothing.
if (!proxyTarget && nextEnv.NOCOBASE_DEV_ALLOW_MULTIPLE !== 'true') {
  const lock = acquireDevInstanceLock({ rootDir });
  if (!lock.acquired) {
    const startedAt = Number(lock.startedAt);
    const since = Number.isFinite(startedAt)
      ? ` started ${new Date(startedAt).toLocaleTimeString()}`
      : '';
    console.error(
      `[dev] A development server for this application is already running (pid ${lock.pid}${since}).`,
    );
    console.error(
      '[dev] Stop it first. A second one takes the next free port and then fails on the migration lock the first one holds. Set NOCOBASE_DEV_ALLOW_MULTIPLE=true to start one anyway.',
    );
    shutdown(1);
  }
  instanceLock = lock;
}

console.log(
  `\n  Starting ${proxyTarget ? 'Vite with remote backend' : 'app dev server'}...`,
);

progress('Starting Vite');
spawnDevProcess(
  'client',
  'vite',
  ['--host', viteDevHost, '--port', String(vitePort), '--strictPort'],
  nextEnv,
  { filterViteStartup: true },
);

// A remote backend owns its lifecycle; do not allocate, start, or watch a local server.
if (!proxyTarget) {
  const serverEnv = {
    ...nextEnv,
    ...resolveDevShutdownEnv(nextEnv),
    APP_VITE_DEV_HOST: viteDevHost,
    APP_VITE_DEV_PORT: String(vitePort),
    APP_VITE_DEV_URL: `http://${toUrlHost(viteDevHost)}:${vitePort}`,
    APP_SERVER_HOST: appServerHost,
    APP_SERVER_PORT: String(appServerPort),
    APP_SERVER_START_LOG: 'false',
    // Asks the server to refresh database/<connection>/collections/ after its startup migrations change a schema.
    // It names this application's root, so a Hub's in-process applications, which see the same environment, leave
    // their deployed revisions alone. Read by DatabaseProvider in @nocobase/app-server.
    NOCOBASE_COLLECTIONS_REFRESH: rootDir,
    BETTER_AUTH_TRUSTED_ORIGINS: resolveDevTrustedOrigins(
      nextEnv.BETTER_AUTH_TRUSTED_ORIGINS,
      appServerPort,
    ),
    APP_PUBLIC_ORIGIN:
      String(nextEnv.APP_PUBLIC_ORIGIN || '').trim() || appOrigin,
  };

  progress('Starting application server');
  const serverChild = spawnDevProcess(
    'server',
    'tsx',
    [
      ...(strictStartup ? [] : ['watch']),
      '--tsconfig',
      'tsconfig.server.json',
      ...(strictStartup
        ? []
        : [
            '--clear-screen=false',
            // tsx's cwd-relative default misses pnpm dependencies above the app.
            '--exclude',
            `${path.parse(rootDir).root.replaceAll('\\', '/')}**/node_modules/**`,
            ...pluginWatchIncludes.flatMap((include) => ['--include', include]),
          ]),
      'server/standalone.ts',
    ],
    serverEnv,
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );

  if (!strictStartup && serverChild.stdin) {
    process.stdin.pipe(serverChild.stdin);
  }

  if (!strictStartup)
    dependencyWatchers = resolveDependencyWatch(rootDir).map((watch) =>
      watchConfigFiles(watch, (_eventType, filename) => {
        clearTimeout(dependencyRestartTimer);
        dependencyRestartTimer = setTimeout(() => {
          dependencyRestartTimer = undefined;
          if (shuttingDown) return;
          console.log(`[dev] ${filename} changed; restarting server`);
          serverChild.stdin?.write('\n');
        }, DEPENDENCY_SETTLE_MS);
      }),
    );

  const configuredConfigPath = serverEnv.APP_CONFIG_FILE;
  const configWatch = resolveConfigWatch(rootDir, configuredConfigPath);

  if (!strictStartup)
    envWatcher = watchConfigFiles(configWatch, (_eventType, filename) => {
      const changedFile = filename?.toString();
      if (!changedFile || !configWatch.filenames.has(changedFile)) return;

      if (envRestartTimer) clearTimeout(envRestartTimer);
      envRestartTimer = setTimeout(() => {
        envRestartTimer = undefined;
        console.log(`[dev] ${changedFile} changed; restarting server`);
        serverChild.stdin?.write('\n');
      }, 100);
    });
}

try {
  progress('Waiting for Vite and application HTTP readiness');
  const waiting = setInterval(
    () => progress('Still waiting for HTTP readiness'),
    5000,
  );
  try {
    await Promise.all([
      waitForHttpReady({
        label: 'Vite dev server',
        url: viteUrl,
      }).then(() => progress('Vite HTTP ready')),
      ...(!proxyTarget
        ? [
            waitForHttpReady({
              isReady: (response, body) => {
                if (!response.ok) return false;

                try {
                  return JSON.parse(body).ok === true;
                } catch {
                  return false;
                }
              },
              label: 'Application server',
              url: healthUrl,
            }).then(() => progress('Application HTTP ready')),
          ]
        : []),
    ]);
  } finally {
    clearInterval(waiting);
  }
} catch (error) {
  console.error(`[dev] ${error instanceof Error ? error.message : error}`);
  shutdown(1);
}

if (!shuttingDown) {
  console.log(
    `\n  App dev server ready in ${((performance.now() - startedAt) / 1000).toFixed(1)}s`,
  );
  console.log(`  Local:     ${appUrl}`);
  if (proxyTarget) console.log(`  Backend:   ${proxyTarget.href}`);
  console.log();
}
