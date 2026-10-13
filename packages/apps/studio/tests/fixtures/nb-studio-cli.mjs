#!/usr/bin/env node
// `nb-studio` as `nocobase cli link` makes it: `@nocobase/app-cli-client` with the `nocobase.cli` of Studio's package.json,
// run from the workspace sources, which import their siblings by the compiled name (`./x.js`).
import { registerHooks } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

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
// Only discover credentials generated in this fixture's own cwd, never an agent run in an ancestor directory.
const localRun = path.join(process.cwd(), brand.runCredentialsFile);
if (existsSync(localRun)) process.env.AGENT_RUN_CREDENTIALS = localRun;
await runAppCli(
  {
    ...appCliConfigOf(brand, info),
    runCredentialsFile: `.nb-studio/absent-fixture-${randomUUID()}.json`,
  },
  process.argv.slice(2),
);
