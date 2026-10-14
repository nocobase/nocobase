/**
 * Records the versions of the runner and the CLI this build ships with (`served-versions.ts`) in
 * `dist/server/agents/served-versions.json`. Not imported by the server: `pnpm build` runs the compiled file once the
 * server is built (an `afterServerBuild` hook in `cli/plugins.ts`), from the application root, where the development
 * dependencies are still installed. A package Studio declares but that is not installed fails the build, since the
 * deployment would otherwise serve no version of it; one it does not declare is left out.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  installedServedVersions,
  SERVED_NPM_PACKAGES,
  SERVED_VERSIONS_FILE,
} from './served-versions.js';

const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const declared = new Set(
  Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }),
);
const versions = installedServedVersions();
const missing = Object.entries(SERVED_NPM_PACKAGES).filter(
  ([product, name]) => declared.has(name) && versions[product] === undefined,
);
if (missing.length > 0) {
  console.error(
    `Cannot record the versions Studio serves: ${missing.map(([, name]) => name).join(', ')} is declared but not installed.`,
  );
  process.exit(1);
}
writeFileSync(SERVED_VERSIONS_FILE, `${JSON.stringify(versions, null, 2)}\n`);
console.log(
  `Recorded ${
    Object.entries(versions)
      .map(([, source]) => `${source.package}@${source.version}`)
      .join(', ') || 'no npm package'
  } in ${fileURLToPath(SERVED_VERSIONS_FILE)}`,
);
