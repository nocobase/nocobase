// Checks Studio's API document with the framework's check, `vendor/nocobase3/scripts/check-openapi.mjs`: every `/api`
// route declares itself, every documented operation has tags, a summary and an operationId, and no schema reference
// dangles. The rules are the framework's; this file only names the application to check.
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { runOpenApiCheck } from '../../../../scripts/check-openapi.mjs';

export const repositoryRoot = path.resolve(
  fileURLToPath(new URL('..', import.meta.url)),
);

/** NocoBase Studio, the application at the repository root. */
export const studioTarget = Object.freeze({
  name: 'studio',
  appDir: repositoryRoot,
});

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = await runOpenApiCheck([studioTarget], {
    rerun: 'pnpm openapi:check',
  });
}
