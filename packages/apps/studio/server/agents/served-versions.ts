/**
 * The runner and the CLI a Studio serves are the exact versions it was built with, so redeploying Studio moves every
 * runner and `nb-studio update` to them. `pnpm build` packs both, without Node.js, into `dist/runners/`
 * (`pack-served-packages.ts`, a build hook in `cli/plugins.ts`), which Studio serves from (`servedPackagesDir`): a
 * runner installed from a package can only update from a package, so every build carries them. A Studio without
 * packages of its own (development, a build that has none) names the same versions on npm instead (`agents.dist.npm`).
 *
 * A deployment does not install the runner: `@nocobase/agent-runner` pulls in the coding tools' SDKs, so it stays a
 * development dependency and its version cannot be read from `node_modules` at run time. `pnpm build` records the
 * versions instead (`record-served-versions.ts`, a build hook in `cli/plugins.ts`) in
 * `dist/server/agents/served-versions.json`, read here; in development, where that file does not exist, the installed
 * packages are read directly. Studio installed from npm as source builds on the target machine with its development
 * dependencies present, so it records what it was built with the same way.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

/**
 * Where `pnpm build` packs the runner and `nb-studio`: `dist/runners/`, two directories above this module in a build,
 * laid out as `nocobase cli build --out` writes them (`<channel>/<product>/manifest.json`).
 */
export const BUILT_PACKAGES_DIR: URL = new URL(
  '../../runners/',
  import.meta.url,
);

/** The channel `pnpm build` packs into and Studio serves: the agents plugin's default. */
export const SERVED_CHANNEL = 'stable';

export type ServedVersions = Record<string, DistNpmSource>;

/**
 * The directory Studio serves the runner and `nb-studio` from: `variable` (`NB_STUDIO_RUNNERS_DIST`), else the packages
 * this build carries (`BUILT_PACKAGES_DIR`), each only once it holds the served channel; undefined otherwise, which
 * keeps the agents plugin's `storage/runners/dist`. `agents.dist.dir` in `config.yml` wins over all of them.
 */
export function servedPackagesDir(
  variable: string | undefined,
  built: URL = BUILT_PACKAGES_DIR,
): string | undefined {
  return [variable, path.resolve(fileURLToPath(built))].find(
    (dir): dir is string =>
      dir !== undefined &&
      dir !== '' &&
      existsSync(path.join(dir, SERVED_CHANNEL)),
  );
}

/**
 * What is wrong with the packages in `dir` against the versions recorded beside them: each recorded product must have
 * a manifest on the served channel that lists exactly its recorded version, with the universal package. Empty when
 * they agree.
 */
export function packedVersionProblems(
  dir: string,
  recorded: ServedVersions,
): string[] {
  const problems: string[] = [];
  for (const [product, source] of Object.entries(recorded)) {
    const file = path.join(dir, SERVED_CHANNEL, product, 'manifest.json');
    let manifest: { versions?: Record<string, { targets?: object }> };
    try {
      manifest = JSON.parse(readFileSync(file, 'utf8')) as typeof manifest;
    } catch {
      problems.push(`${product}: ${file} is missing or not JSON.`);
      continue;
    }
    const versions = Object.keys(manifest.versions ?? {});
    if (versions.length !== 1 || versions[0] !== source.version)
      problems.push(
        `${product}: packed ${versions.join(', ') || 'no version'}, but ${source.package}@${source.version} is recorded.`,
      );
    else if (
      !Object.hasOwn(
        manifest.versions?.[source.version]?.targets ?? {},
        'universal',
      )
    )
      problems.push(`${product}: ${source.version} has no universal package.`);
  }
  return problems;
}

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
 * The versions this Studio names on npm: the ones `pnpm build` recorded, else the installed packages' (development),
 * else none. A product whose package the served directory holds is served from there instead.
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
