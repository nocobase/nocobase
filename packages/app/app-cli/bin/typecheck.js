#!/usr/bin/env node

import { existsSync } from 'node:fs';

const source = new URL('../src/tools/scripts/typecheck.mjs', import.meta.url);
const entry = existsSync(source)
  ? source
  : new URL('../dist/tools/scripts/typecheck.mjs', import.meta.url);
await import(entry.href);
