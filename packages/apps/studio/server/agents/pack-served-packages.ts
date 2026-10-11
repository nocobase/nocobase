/**
 * Packs the runner (`nocobase-runner`) and `nb-studio` this build serves into `dist/runners/` (`BUILT_PACKAGES_DIR`),
 * one universal package each, without Node.js, with `nocobase cli build --universal`. Not imported by the server:
 * `pnpm build` runs the compiled file after `record-served-versions.js` (an `afterServerBuild` hook in
 * `cli/plugins.ts`), from the application root, where the development dependencies are installed and the workspace
 * packages are already built.
 *
 * Each product is packed at the version recorded in `served-versions.json`, the one Studio would otherwise name on npm:
 * the runner at the installed `@nocobase/agent-runner`'s own version, `nb-studio` at `@nocobase/studio-cli`'s
 * (`--version`), which publishes the same CLI. The build fails when the packages do not list exactly those versions.
 *
 * `cli build` installs the packages' dependencies from the npm registry, so the build needs network access to it.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BUILT_PACKAGES_DIR,
  packedVersionProblems,
  SERVED_CHANNEL,
  SERVED_VERSIONS_FILE,
  type ServedVersions,
} from './served-versions.js';

/** The runner's product (`RUNNER_PRODUCT`), written out for the reason `served-versions.ts` gives. */
const RUNNER = 'nocobase-runner';

const recorded = JSON.parse(
  readFileSync(SERVED_VERSIONS_FILE, 'utf8'),
) as ServedVersions;
const out = path.resolve(fileURLToPath(BUILT_PACKAGES_DIR));
rmSync(out, { recursive: true, force: true });

for (const [product, source] of Object.entries(recorded)) {
  const args = [
    'exec',
    'nocobase',
    'cli',
    'build',
    '--universal',
    '--skip-build',
    '--channel',
    SERVED_CHANNEL,
    '--out',
    out,
  ];
  // The runner's version is its package's own, and checked below; nb-studio's would otherwise be Studio's.
  if (product === RUNNER) args.push('--runner');
  else args.push('--version', source.version);
  const result = spawnSync('pnpm', args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`Packing ${product} ${source.version} failed.`);
    process.exit(result.status ?? 1);
  }
}

const problems = packedVersionProblems(out, recorded);
if (problems.length > 0) {
  console.error(
    [
      'The packages in dist/runners do not match the versions Studio records:',
      ...problems,
    ].join('\n  '),
  );
  process.exit(1);
}
console.log(
  `Packed ${
    Object.entries(recorded)
      .map(([product, source]) => `${product} ${source.version}`)
      .join(', ') || 'nothing'
  } into ${out}`,
);
