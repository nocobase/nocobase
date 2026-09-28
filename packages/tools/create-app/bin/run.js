#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  exitWhenFlushed,
  isSupportedNodeVersion,
  unsupportedNodeVersionOutput,
} from '@nocobase/cli-envelope/node-guard';

if (!isSupportedNodeVersion()) {
  const { stream, text } = unsupportedNodeVersionOutput({
    name: 'create-app',
    command: 'create-app',
    argv: process.argv.slice(2),
  });
  process[stream].write(`${text}\n`);
  await exitWhenFlushed(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Node 24 strips types from `.ts` files it loads directly, so development runs straight from `src` with no loader and
 * no re-exec. That does not work once the package lives in `node_modules`, where Node refuses type stripping outright,
 * so published installs must run the compiled `dist` output instead. `files` ships only `bin` and `dist`, which makes
 * the presence of `src` a reliable signal for which of the two modes we are in.
 */
const srcEntry = path.join(root, 'src/create.ts');
const useDist =
  process.env.NOCOBASE_CREATE_APP_USE_DIST === '1' || !existsSync(srcEntry);
const entry = useDist ? '../dist/create.js' : '../src/create.ts';

const pjson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

const { createApp } = await import(entry);

const exitCode = await createApp({
  argv: process.argv.slice(2),
  binary: 'create-app',
  version: pjson.version,
});

await exitWhenFlushed(exitCode);
