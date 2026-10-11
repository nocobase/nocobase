#!/usr/bin/env node
// `nb-studio` as `nocobase cli link` makes it: `@nocobase/app-cli-client` with the `nocobase.cli` of Studio's package.json,
// run from the workspace sources, which import their siblings by the compiled name (`./x.js`).
import { registerHooks } from 'node:module';
import path from 'node:path';
import process from 'node:process';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const parent = context.parentURL ?? '';
      if (
        specifier.startsWith('.') &&
        specifier.endsWith('.js') &&
        parent.endsWith('.ts') &&
        !parent.includes('/node_modules/')
      )
        return nextResolve(`${specifier.slice(0, -3)}.ts`, context);
      throw error;
    }
  },
});

const { runAppCliPackage } = await import('@nocobase/app-cli-client');
await runAppCliPackage(
  path.resolve(import.meta.dirname, '../..'),
  process.argv.slice(2),
);
