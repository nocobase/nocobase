#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import pc from 'picocolors';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { formatUnsupportedNodeVersionMessage, isSupportedNodeVersion } from './node-version.js';
import { normalizeNodeOptions, normalizeSessionEnv } from './session-env.js';
import { ensureWindowsAdministrator } from './windows-admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const requireFromCli = createRequire(import.meta.url);
const root = path.resolve(__dirname, '..');
const realRoot = fs.realpathSync(root);
const isSourcePackage = realRoot.split(path.sep).join('/').endsWith('/packages/core/cli');
let isDev = isSourcePackage;
if (process.env.NB_CLI_USE_DIST === '1') {
  isDev = false;
}

if (!isSupportedNodeVersion()) {
  console.error(pc.red(formatUnsupportedNodeVersionMessage(process.version)));
  process.exit(1);
}

normalizeSessionEnv();
normalizeNodeOptions();

ensureWindowsAdministrator();

/**
 * In the monorepo, plain `node` cannot load `.ts`. Re-exec once with `--import <tsx>`
 * (same effect as a dedicated dev entry with `#!/usr/bin/env -S node --import tsx`).
 *
 * Use the tsx package resolved from this CLI install (not CWD), so `nb` works when
 * invoked from a project directory that does not depend on `tsx`.
 */
function reexecWithTsx() {
  let tsxEntry;
  try {
    tsxEntry = requireFromCli.resolve('tsx');
  } catch {
    console.error(
      [
        'Cannot load dev dependency `tsx` for the NocoBase CLI.',
        'Install monorepo dependencies (e.g. `yarn install` at the repo root),',
        'or set NB_CLI_USE_DIST=1 to run the compiled CLI without TypeScript sources.',
      ].join(' '),
    );
    process.exit(1);
  }

  const reexecArgs = ['--import', pathToFileURL(tsxEntry).href];
  const supportedFlags = Array.from(process.allowedNodeEnvironmentFlags);
  if (supportedFlags.some((flag) => flag === '--disable-warning' || flag.startsWith('--disable-warning='))) {
    reexecArgs.push('--disable-warning=ExperimentalWarning');
  }

  const result = spawnSync(process.execPath, [...reexecArgs, ...process.argv.slice(1)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      _NOCO_CLI_TSX_CHILD: '1',
      NODE_ENV: 'development',
    },
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (isDev && !process.env._NOCO_CLI_TSX_CHILD) {
  reexecWithTsx();
}

const bootstrapPath = isDev ? path.join(root, 'src/lib/bootstrap.ts') : path.join(root, 'dist/lib/bootstrap.js');
const { ensureRuntimeFromArgv } = await import(pathToFileURL(bootstrapPath).href);
const commandLogPath = isDev ? path.join(root, 'src/lib/command-log.ts') : path.join(root, 'dist/lib/command-log.js');
const { finalizeCommandLogSessionSync, initCommandLogSession, installCommandLogWriteHooks } = await import(
  pathToFileURL(commandLogPath).href
);
const startupUpdatePath = isDev
  ? path.join(root, 'src/lib/startup-update.ts')
  : path.join(root, 'dist/lib/startup-update.js');
const { maybeRunStartupUpdate } = await import(pathToFileURL(startupUpdatePath).href);
const cliEntryErrorPath = isDev
  ? path.join(root, 'src/lib/cli-entry-error.ts')
  : path.join(root, 'dist/lib/cli-entry-error.js');
const { appendDiagnosticLogPath, formatCliEntryError } = await import(pathToFileURL(cliEntryErrorPath).href);
const { flush, run, settings } = await import('@oclif/core');
const forcedColors = pc.createColors(true);

if (isDev) {
  settings.debug = true;
}

const cliPackageJson = requireFromCli(path.join(root, 'package.json'));
const argv = process.argv.slice(2);
const commandLogSession = await initCommandLogSession({
  argv,
  cwd: process.cwd(),
  sessionId: process.env.NB_SESSION_ID,
  cliVersion: cliPackageJson?.version,
  nodeVersion: process.version,
  platform: process.platform,
  interactive: Boolean(process.stdin.isTTY && process.stdout.isTTY),
  verbose: argv.includes('--verbose'),
});
const restoreCommandLogHooks = installCommandLogWriteHooks();
let commandLogFinalized = false;

function finalizeCommandLogOnce(options = {}) {
  if (commandLogFinalized) {
    return;
  }

  commandLogFinalized = true;
  restoreCommandLogHooks?.();
  finalizeCommandLogSessionSync(commandLogSession, options);
}

process.once('exit', (code) => {
  finalizeCommandLogOnce({ exitCode: code ?? undefined });
});

try {
  const startupUpdate = await maybeRunStartupUpdate(argv);
  if (startupUpdate.kind === 'updated') {
    const result = spawnSync(process.execPath, process.argv.slice(1), {
      stdio: 'inherit',
      env: {
        ...process.env,
        NB_SKIP_STARTUP_UPDATE: '1',
      },
    });
    process.exit(result.status === null ? 1 : result.status);
  }
  if (argv[0] === 'api') {
    await ensureRuntimeFromArgv(argv, {
      configFile: path.join(root, 'nocobase-ctl.config.json'),
    });
  }
  await run(argv, import.meta.url);
  flush();
  finalizeCommandLogOnce({ exitCode: 0 });
} catch (error) {
  const message = appendDiagnosticLogPath(
    formatCliEntryError(error, process.argv.slice(2)),
    commandLogSession?.logFile,
  );
  console.error(forcedColors.red(message));
  finalizeCommandLogOnce({ exitCode: 1, errorMessage: message });
  process.exit(1);
}
