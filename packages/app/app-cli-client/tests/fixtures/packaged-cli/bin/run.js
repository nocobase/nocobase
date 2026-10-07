#!/usr/bin/env node
// The entry `nocobase cli build` generates, running this package's sources: the client from `src`, with the resolve
// hooks a source checkout needs.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

await import('../../source-hooks.js');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { runAppCliPackage } = await import('../../../../src/brand.ts');
await runAppCliPackage(root, process.argv.slice(2));
