#!/usr/bin/env node

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  exitWhenFlushed,
  isSupportedNodeVersion,
  unsupportedNodeVersionOutput,
} from '@nocobase/cli-envelope/node-guard';

if (!isSupportedNodeVersion()) {
  // The document names the command as typed, such as `db apply`: the arguments before the first flag.
  const { stream, text } = unsupportedNodeVersionOutput({
    name: 'nocobase',
    argv: process.argv.slice(2),
  });
  process[stream].write(`${text}\n`);
  await exitWhenFlushed(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Node 24 strips types from `.ts` files it loads directly, so development runs sources straight from `src` with no
 * loader and no re-exec. That does not work once the package lives in `node_modules`, where Node refuses type
 * stripping outright, so published installs must run the compiled `dist` output instead. `files` ships only `bin` and
 * `dist`, which makes the presence of `src/runtime` a reliable signal for which of the two modes we are in.
 */
const useDist =
  process.env.NOCOBASE_CLI_USE_DIST === '1' ||
  !existsSync(path.join(root, 'src/runtime'));
const runtimeEntry = useDist ? './dist/runtime/run.js' : './src/runtime/run.ts';

const { runAppCli } = await import(
  new URL(runtimeEntry, `file://${root}/`).href
);

// The application is found from the working directory: inside one, its own commands and its plugins' commands join the
// built-in ones; anywhere else, only the commands that take their target from a flag run.
await runAppCli();
