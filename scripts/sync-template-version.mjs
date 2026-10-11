/**
 * Aligns `nocobase.defaultTemplateVersion` with the package's own `version`.
 *
 * Changesets rewrites `version` when it consumes changesets, but it knows nothing about the `nocobase` block, so the
 * two drift apart on every release — the template shipped `0.0.1-beta.2` while still declaring `0.0.1`, and an
 * application generated from it inherited the stale value.
 *
 * The release workflow runs this between `changeset version` and the release commit, so the synchronized value is
 * published and lands back in the repository with the version bump that caused it.
 *
 * Usage:
 *   node ./scripts/sync-template-version.mjs           # rewrite, print what changed
 *   node ./scripts/sync-template-version.mjs --check   # exit 1 if anything is out of sync, change nothing
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

/** Packages carrying a `nocobase.defaultTemplateVersion` that mirrors their own version. */
const TARGETS = [
  'packages/templates/app-template-default',
  'packages/templates/app-template-examples',
];

const checkOnly = process.argv.includes('--check');
const drifted = [];

for (const relative of TARGETS) {
  const manifestPath = path.join(repoRoot, relative, 'package.json');
  const raw = readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  const current = manifest.nocobase?.defaultTemplateVersion;

  if (current === undefined) {
    console.error(
      `${relative}/package.json has no nocobase.defaultTemplateVersion. Remove it from TARGETS, or add the field.`,
    );
    process.exitCode = 1;
    continue;
  }

  if (current === manifest.version) {
    continue;
  }

  drifted.push({ from: current, relative, to: manifest.version });

  if (checkOnly) {
    continue;
  }

  // Rewrite the one value textually so the rest of the file — key order, formatting, trailing newline — is untouched.
  // Serializing the parsed object would reformat a file nobody asked to reformat.
  const pattern = /("defaultTemplateVersion"\s*:\s*)"[^"]*"/u;

  if (!pattern.test(raw)) {
    console.error(
      `${relative}/package.json has a nocobase.defaultTemplateVersion that could not be located textually.`,
    );
    process.exitCode = 1;
    continue;
  }

  writeFileSync(
    manifestPath,
    raw.replace(pattern, `$1"${manifest.version}"`),
    'utf8',
  );
}

if (drifted.length === 0) {
  console.log('defaultTemplateVersion is in sync with version.');
  process.exit(process.exitCode ?? 0);
}

for (const { from, relative, to } of drifted) {
  console.log(
    `${relative}: defaultTemplateVersion ${from} -> ${to}${checkOnly ? ' (out of sync)' : ''}`,
  );
}

if (checkOnly) {
  console.error(
    'Run `node ./scripts/sync-template-version.mjs` to align them, or let the release workflow do it.',
  );
  process.exit(1);
}
