#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  exitWhenFlushed,
  isSupportedNodeVersion,
  unsupportedNodeVersionOutput,
} from '@nocobase/cli-envelope/node-guard';

// Before anything else: an older Node.js cannot load what follows, and answers `--json` in the cli-envelope.
if (!isSupportedNodeVersion()) {
  const { stream, text } = unsupportedNodeVersionOutput({
    name: 'nocobase-runner',
    argv: process.argv.slice(2),
    indent: 2,
  });
  process[stream].write(`${text}\n`);
  await exitWhenFlushed(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Node 24 strips types from `.ts` files it loads directly, so in this repository the runner runs from `src`. A
// published install ships only `bin` and `dist`, and Node refuses type stripping inside node_modules, so it runs `dist`.
const useDist =
  process.env.NOCOBASE_RUNNER_USE_DIST === '1' ||
  !existsSync(path.join(root, 'src/run.ts'));

// In this repository, workspace packages resolve to their TypeScript sources whichever of the two runs (see
// source-hooks.js); in a published install the hooks never apply.
await import('./source-hooks.js');

const { runRunner } = await import(
  new URL(useDist ? './dist/run.js' : './src/run.ts', `file://${root}/`).href
);

await runRunner(process.argv.slice(2));
