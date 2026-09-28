#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  isSupportedNodeVersion,
  unsupportedNodeVersionOutput,
} from './node-version.js';

/**
 * Exits once stdout and stderr have taken everything written to them. `process.exit` alone drops output still queued
 * for a pipe, which can cut the one JSON document `--json` promises in half; it is still called, so nothing a command
 * left running keeps the process alive.
 */
async function exitWhenFlushed(code) {
  await Promise.all(
    [process.stdout, process.stderr].map(
      (stream) => new Promise((resolve) => stream.write('', resolve)),
    ),
  );
  process.exit(code);
}

if (!isSupportedNodeVersion()) {
  const { stream, text } = unsupportedNodeVersionOutput(process.argv.slice(2));
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
