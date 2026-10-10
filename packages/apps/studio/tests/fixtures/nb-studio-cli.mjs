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

const { readAppCliPackage, appCliConfigOf, runAppCli } =
  await import('@nocobase/app-cli-client');
const { brand, info } = readAppCliPackage(
  path.resolve(import.meta.dirname, '../..'),
);
// A distinct filename prevents an ancestor runner directory from supplying the real run's identity.
await runAppCli(
  {
    ...appCliConfigOf(brand, info),
    runCredentialsFile: '.nb-studio-test/run.json',
  },
  process.argv.slice(2),
);
