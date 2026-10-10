/**
 * The runner and the CLI a Studio serves are the exact versions it was built with (`agents.dist.npm`), so redeploying
 * Studio moves every runner and `nb-studio update` to them, and a Studio without tarballs of its own (the published
 * image) names them on npm.
 *
 * A deployment does not install the runner: `@nocobase/agent-runner` pulls in the coding tools' SDKs, so it stays a
 * development dependency and its version cannot be read from `node_modules` at run time. `pnpm build` records the
 * versions instead (`record-served-versions.ts`, a build hook in `cli/plugins.ts`) in
 * `dist/server/agents/served-versions.json`, read here; in development, where that file does not exist, the installed
 * packages are read directly. Studio installed from npm as source builds on the target machine with its development
 * dependencies present, so it records what it was built with the same way.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import type { DistNpmSource } from '@nocobase/app-plugin-agents/server/tokens';

/**
 * Each product Studio serves, by the npm package it is published as: the runner (`RUNNER_PRODUCT`) and `nb-studio`.
 * Studio declares both as development dependencies, so each is pinned to the version Studio is built with.
 *
 * This module imports no package at run time: `pnpm build` runs it before the workspace packages it would import are
 * usable from a compiled file, so the runner's product name is written out (a test holds it to `RUNNER_PRODUCT`).
 */
export const SERVED_NPM_PACKAGES: Readonly<Record<string, string>> = {
  'nocobase-runner': '@nocobase/agent-runner',
  'nb-studio': '@nocobase/studio-cli',
};

/** Where `pnpm build` records the versions: beside this module, so `dist/server/agents/` in a build. */
export const SERVED_VERSIONS_FILE: URL = new URL(
  './served-versions.json',
  import.meta.url,
);

export type ServedVersions = Record<string, DistNpmSource>;

/**
 * The packages of `SERVED_NPM_PACKAGES` installed where `from` resolves them, with their exact versions; a package
 * that is not installed is left out.
 */
export function installedServedVersions(
  from: string = import.meta.url,
): ServedVersions {
  const require = createRequire(from);
  const versions: ServedVersions = {};
  for (const [product, name] of Object.entries(SERVED_NPM_PACKAGES)) {
    let manifest: string;
    try {
      manifest = require.resolve(`${name}/package.json`);
    } catch {
      continue;
    }
    const { version } = JSON.parse(readFileSync(manifest, 'utf8')) as {
      version?: unknown;
    };
    if (typeof version === 'string')
      versions[product] = { package: name, version };
  }
  return versions;
}

/**
 * The versions this Studio serves: the ones `pnpm build` recorded, else the installed packages' (development), else
 * none, in which case only tarballs are served.
 */
export function servedVersions(
  file: URL = SERVED_VERSIONS_FILE,
  from: string = import.meta.url,
): ServedVersions {
  let recorded: string;
  try {
    recorded = readFileSync(file, 'utf8');
  } catch {
    return installedServedVersions(from);
  }
  return JSON.parse(recorded) as ServedVersions;
}
