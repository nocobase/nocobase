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
    name: 'create-plugin',
    command: 'create-plugin',
    argv: process.argv.slice(2),
    // create-plugin prints its documents indented, so the guard's matches.
    indent: 2,
  });
  process[stream].write(`${text}\n`);
  await exitWhenFlushed(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcEntry = path.join(root, 'src/create.ts');
const useDist =
  process.env.NOCOBASE_CREATE_PLUGIN_USE_DIST === '1' || !existsSync(srcEntry);
const entry = useDist ? '../dist/create.js' : '../src/create.ts';
const manifest = JSON.parse(
  readFileSync(path.join(root, 'package.json'), 'utf8'),
);
const { runCreatePluginCli } = await import(entry);

const exitCode = await runCreatePluginCli({
  argv: process.argv.slice(2),
  binary: 'create-plugin',
  version: manifest.version,
});

await exitWhenFlushed(exitCode);
