import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineCliPlugin } from '@nocobase/app-cli';

// The repository's carrier-only hook stays disabled until preview capacity is confirmed.
// Generated applications and child builds never contain the repository fixture helper.
// Flip only after the existing preview capacity is confirmed; no external CI edit is needed.
const capacityConfirmed = false;

export function acceptancePlugins(
  rootDir = path.resolve(import.meta.dirname, '..'),
  env = process.env,
) {
  const helper = path.resolve(
    rootDir,
    '../../../tests/fixtures/list-recovery/preview/build.mjs',
  );
  if (
    env.ENVIRONMENT !== 'preview' ||
    env.APP_ID !== 'nocobase-v3-pr-11186' ||
    (!capacityConfirmed && env.NOCOBASE_ACCEPTANCE_BUILD !== '1') ||
    path.basename(rootDir) !== 'app-template-examples' ||
    !existsSync(helper)
  )
    return [];
  return [
    defineCliPlugin({
      packageName: '@nocobase/list-recovery-preview',
      buildHooks: {
        afterBuild: [{ command: [process.execPath, helper, rootDir] }],
      },
    }),
  ];
}
