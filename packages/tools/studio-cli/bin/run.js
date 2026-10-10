#!/usr/bin/env node
// nb-studio: runs the CLI this package's nocobase.cli declares, the same entry `nocobase cli build` generates.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (Number(process.versions.node.split('.')[0]) < 24) {
  process.stderr.write(
    `nb-studio needs Node.js 24 or newer; this is ${process.version}.\n`,
  );
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { runAppCliPackage } = await import('@nocobase/app-cli-client');
await runAppCliPackage(root, process.argv.slice(2));
