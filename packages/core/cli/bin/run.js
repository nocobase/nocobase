#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const realRoot = fs.realpathSync(root);
const isSourcePackage = realRoot.split(path.sep).join('/').endsWith('/packages/core/cli');
let isDev = isSourcePackage;
if (process.env.NODE_ENV === 'production') {
  isDev = false;
}

/**
 * In the monorepo, plain `node` cannot load `.ts`. Re-exec once with `--import tsx`
 * (same effect as a dedicated dev entry with `#!/usr/bin/env -S node --import tsx`).
 */
function reexecWithTsx() {
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--disable-warning=ExperimentalWarning', ...process.argv.slice(1)],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        _NOCO_CLI_TSX_CHILD: '1',
        NODE_ENV: 'development',
      },
    },
  );
  process.exit(result.status === null ? 1 : result.status);
}

if (isDev && !process.env._NOCO_CLI_TSX_CHILD) {
  reexecWithTsx();
}

const bootstrapPath = isDev ? path.join(root, 'src/lib/bootstrap.ts') : path.join(root, 'dist/lib/bootstrap.js');
const { ensureRuntimeFromArgv } = await import(pathToFileURL(bootstrapPath).href);
const { flush, run, settings } = await import('@oclif/core');

if (isDev) {
  settings.debug = true;
}

function getCommandToken(argv) {
  for (const token of argv) {
    if (!token || token.startsWith('-')) {
      continue;
    }

    return token;
  }

  return undefined;
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
