// Versions the first stable release, the run that leaves prerelease mode, so that each package's new stable CHANGELOG
// section lists only what is new since the last beta.
//
// In prerelease mode `changeset version` moves every changeset it consumed into `.changeset/pre/` and leaves them out of
// later beta sections. In mode `exit` (written by `changeset pre exit`) it reads `.changeset/pre/` again, so that every
// package still at `X.Y.Z-<tag>.N` is released as `X.Y.Z` with the bump all its prerelease changesets add up to, and it
// also hands those changesets to the changelog generator: the new `## X.Y.Z` section would repeat every entry already
// listed under the `## X.Y.Z-<tag>.N` sections below it, together with one `Updated dependencies [<commit>]` line per
// prerelease changeset of every dependency. Then it deletes `pre.json` and `.changeset/pre/`.
//
// This script runs that same `changeset version`, with the versions and the release plan untouched, but with the
// configured changelog generator wrapped by this module's default export for the one run:
//
//   - an entry of a changeset whose id starts with `pre/`, the rule changesets itself uses to tell prerelease changesets
//     apart, is left out; entries of the changesets in `.changeset/` go through the configured generator unchanged;
//   - the dependency lines name only those changesets. The versions the dependencies were updated to stay listed, under
//     one `Updated dependencies` line when every changeset behind them is a prerelease one: they are stable versions no
//     beta section names.
//
// Afterwards every package that went from a prerelease version to a stable one gets one sentence under its new heading,
// which stays exactly `## <version>`, saying that the prerelease changes are listed under the prerelease versions below.
// `.changeset/config.json` is restored byte for byte, so the run changes nothing `changeset version` would not change
// apart from the CHANGELOG sections, and running it again from the same commit gives the same tree.
//
// Usage:
//   node scripts/version-first-stable.mjs [--root <dir>]
//
// It refuses to run unless `<root>/.changeset/pre.json` has mode `exit`, which is when scripts/release-channel.mjs
// prints `exiting=true`; every other release runs `pnpm changeset version` directly. V3 Release and V3 Release Pro run it
// for the open-source packages and, from `vendor/nocobase3`, for Pro's.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { readReleaseChannel } from './release-channel.mjs';

export const FIRST_STABLE_NOTE =
  'First stable release. Changes made during the prerelease are listed under the prerelease versions below.';

const DEFAULT_CHANGELOG = '@changesets/cli/changelog';
const PRERELEASE = /^\d+\.\d+\.\d+-/u;

// What `changeset version` passes the dependency line when no changeset of the release's own is left: changelog
// generators print one line per changeset above the updated versions, and this one has no commit to name.
const DEPENDENCIES_ONLY = Object.freeze({
  id: 'first-stable-release',
  summary: '',
  releases: [],
});

/** Whether changesets read `changeset` from `.changeset/pre/`, that is, a beta already released it. */
export function isPrereleaseChangeset(changeset) {
  return changeset.id.startsWith('pre/');
}

const generators = new Map();

// Loads the generator the wrapper delegates to the way changesets loads one: the module's default export, or that
// export's own `default`.
async function loadGenerator(url) {
  if (!generators.has(url)) {
    generators.set(
      url,
      import(url).then((module) => {
        let generator = module.default ?? module;
        if (generator.default) generator = generator.default;
        if (
          typeof generator.getReleaseLine !== 'function' ||
          typeof generator.getDependencyReleaseLine !== 'function'
        )
          throw new Error(
            `${url} does not export changelog generation functions`,
          );
        return generator;
      }),
    );
  }
  return generators.get(url);
}

/**
 * The changelog generator `changeset version` loads for this run, configured as `[<this file>, { generator, options }]`:
 * `generator` is the URL of the configured generator and `options` its own options.
 */
export const firstStableChangelog = {
  async getReleaseLine(changeset, type, { generator, options }) {
    if (isPrereleaseChangeset(changeset)) return '';
    return (await loadGenerator(generator)).getReleaseLine(
      changeset,
      type,
      options,
    );
  },
  async getDependencyReleaseLine(
    changesets,
    dependenciesUpdated,
    { generator, options },
  ) {
    if (dependenciesUpdated.length === 0) return '';
    const current = changesets.filter(
      (changeset) => !isPrereleaseChangeset(changeset),
    );
    return (await loadGenerator(generator)).getDependencyReleaseLine(
      current.length > 0 ? current : [DEPENDENCIES_ONLY],
      dependenciesUpdated,
      options,
    );
  },
};

export default firstStableChangelog;

/**
 * Adds the first stable note to `changelog`, under the section `changeset version` just wrote for `version`, which must
 * be the first version heading of the file. A changelog that already carries the note is returned unchanged.
 * @param {string} changelog
 * @param {string} version
 */
export function addFirstStableNote(changelog, version) {
  const heading = /^## .*$/mu.exec(changelog);
  if (!heading || heading[0] !== `## ${version}`)
    throw new Error(
      `expected the first version heading to be "## ${version}", found ${heading ? JSON.stringify(heading[0]) : 'none'}`,
    );
  const end = heading.index + heading[0].length;
  const rest = changelog.slice(end);
  if (rest.startsWith(`\n\n${FIRST_STABLE_NOTE}\n`)) return changelog;
  const following = rest.replace(/^\n+/u, '');
  return `${changelog.slice(0, end)}\n\n${FIRST_STABLE_NOTE}\n${following ? `\n${following}` : ''}`;
}

// Every tracked package.json and its version. A file outside the workspace never changes version, so only the packages
// `changeset version` released are compared afterwards.
function readVersions(root) {
  const result = spawnSync(
    'git',
    ['ls-files', '-z', '--', 'package.json', '**/package.json'],
    { cwd: root, encoding: 'utf8' },
  );
  if (result.status !== 0)
    throw new Error(`git ls-files failed in ${root}: ${result.stderr}`);
  const versions = new Map();
  for (const file of result.stdout.split('\0').filter(Boolean)) {
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(path.join(root, file), 'utf8'));
    } catch {
      continue;
    }
    if (typeof manifest.version === 'string')
      versions.set(file, manifest.version);
  }
  return versions;
}

function countPrereleaseChangesets(root) {
  try {
    return readdirSync(path.join(root, '.changeset', 'pre')).filter((file) =>
      file.endsWith('.md'),
    ).length;
  } catch (error) {
    if (error.code === 'ENOENT') return 0;
    throw error;
  }
}

/**
 * Runs `changeset version` in `root`, which must be leaving prerelease mode, and returns the changelogs it gave the
 * first stable note.
 * @param {string} root
 * @param {{ log?: (message: string) => void }} [options]
 */
export function versionFirstStable(root, { log = console.log } = {}) {
  root = path.resolve(root);
  const { exiting } = readReleaseChannel(root);
  if (!exiting)
    throw new Error(
      `${path.join(root, '.changeset', 'pre.json')} does not have mode "exit"; only the release that leaves prerelease mode is versioned by this script, every other one by \`pnpm changeset version\`.`,
    );

  const configFile = path.join(root, '.changeset', 'config.json');
  const configSource = readFileSync(configFile, 'utf8');
  const config = JSON.parse(configSource);
  const changelog = config.changelog ?? DEFAULT_CHANGELOG;
  const fromChangesetDirectory = createRequire(configFile);
  const changesets = createRequire(path.join(root, 'package.json')).resolve(
    '@changesets/cli/bin.js',
  );

  let wrapped = null;
  if (changelog !== false) {
    const [specifier, options = null] =
      typeof changelog === 'string' ? [changelog, null] : changelog;
    wrapped = {
      ...config,
      changelog: [
        import.meta.url,
        {
          generator: pathToFileURL(fromChangesetDirectory.resolve(specifier))
            .href,
          options,
        },
      ],
    };
  }

  const prerelease = countPrereleaseChangesets(root);
  const before = readVersions(root);
  if (wrapped)
    writeFileSync(configFile, `${JSON.stringify(wrapped, null, 2)}\n`);
  try {
    const result = spawnSync(process.execPath, [changesets, 'version'], {
      cwd: root,
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(`changeset version exited with ${result.status}`);
  } finally {
    writeFileSync(configFile, configSource);
  }
  if (!wrapped) return [];

  const noted = [];
  for (const [file, version] of readVersions(root)) {
    const previous = before.get(file);
    if (
      previous === undefined ||
      previous === version ||
      !PRERELEASE.test(previous) ||
      PRERELEASE.test(version)
    )
      continue;
    const changelogFile = path.join(path.dirname(file), 'CHANGELOG.md');
    const absolute = path.join(root, changelogFile);
    let text;
    try {
      text = readFileSync(absolute, 'utf8');
    } catch (error) {
      throw new Error(
        `${file} went from ${previous} to ${version}, but ${changelogFile} cannot be read: ${error.message}`,
        { cause: error },
      );
    }
    try {
      writeFileSync(absolute, addFirstStableNote(text, version));
    } catch (error) {
      throw new Error(`${changelogFile}: ${error.message}`, { cause: error });
    }
    noted.push(changelogFile);
  }
  log(
    `First stable release: left the entries of ${prerelease} prerelease changesets out of the new CHANGELOG sections and noted ${noted.length} changelogs.`,
  );
  return noted;
}

function main(argv) {
  const { values } = parseArgs({
    args: argv,
    options: { root: { type: 'string', default: '.' } },
    strict: true,
  });
  versionFirstStable(values.root);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  }
}
