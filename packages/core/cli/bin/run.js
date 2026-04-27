#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const requireFromCli = createRequire(import.meta.url);
const root = path.resolve(__dirname, '..');
const realRoot = fs.realpathSync(root);
const isSourcePackage = realRoot.split(path.sep).join('/').endsWith('/packages/core/cli');
let isDev = isSourcePackage;
if (process.env.NB_CLI_USE_DIST === '1') {
  isDev = false;
}

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
const startupUpdatePath = isDev
  ? path.join(root, 'src/lib/startup-update.ts')
  : path.join(root, 'dist/lib/startup-update.js');
const { maybeRunStartupUpdatePrompt } = await import(pathToFileURL(startupUpdatePath).href);
const { flush, run, settings } = await import('@oclif/core');

if (isDev) {
  settings.debug = true;
}

function getCommandToken(argv) {
  const tokens = [];

  for (const token of argv) {
    if (!token || token.startsWith('-')) {
      continue;
    }

    tokens.push(token);
  }

  if (tokens[0] === 'api') {
    return tokens[1] ?? tokens[0];
  }

  return tokens[0];
}

function formatCliEntryError(error, argv) {
  const message = error instanceof Error ? error.message : String(error);
  const missingCommandMatch = message.match(/^Command (.+) not found\.$/);
  if (missingCommandMatch) {
    const commandToken = getCommandToken(argv) ?? missingCommandMatch[1];
    return [
      `Unknown command: \`${commandToken}\`.`,
      'If this is a built-in command or a typo, run `nb --help` to inspect available commands.',
      `If \`${commandToken}\` should be a runtime command from your NocoBase app, run \`nb env update\` and try again.`,
    ].join('\n');
  }

  return message;
}

try {
  const argv = process.argv.slice(2);
  const startupUpdate = await maybeRunStartupUpdatePrompt(argv);
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
} catch (error) {
  const message = formatCliEntryError(error, process.argv.slice(2));
  console.error(message);
  process.exitCode = 1;
}
