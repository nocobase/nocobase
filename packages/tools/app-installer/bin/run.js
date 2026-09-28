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
  // The document names the command as typed: the arguments before the first flag, as the application CLI's does.
  const { stream, text } = unsupportedNodeVersionOutput({
    name: 'app-installer',
    argv: process.argv.slice(2),
  });
  process[stream].write(`${text}\n`);
  await exitWhenFlushed(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Development runs straight from `src`, which Node 24 strips types from. A published install lives in `node_modules`,
 * where Node refuses to strip types, so it runs the compiled `dist` instead. `files` ships only `bin` and `dist`, which
 * makes the presence of `src` a reliable signal for which mode this is.
 */
const srcEntry = path.join(root, 'src/cli.ts');
const useDist =
  process.env.NOCOBASE_APP_INSTALLER_USE_DIST === '1' || !existsSync(srcEntry);
const entry = useDist ? '../dist/cli.js' : '../src/cli.ts';

const pjson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

const { runInstaller } = await import(entry);

const exitCode = await runInstaller({
  argv: process.argv.slice(2),
  version: pjson.version,
});

await exitWhenFlushed(exitCode);
