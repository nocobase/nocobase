import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml';

/** One `allowBuilds` decision: whether pnpm may run this package's install script. */
export interface AllowBuildsEntry {
  readonly name: string;
  readonly allowed: boolean;
}

/**
 * Install scripts the generated project decides about up front.
 *
 * pnpm 11 refuses to run a dependency's install script unless the package appears under `allowBuilds`, and it reads
 * that list from `pnpm-workspace.yaml` alone — the `pnpm` field in `package.json` was removed in that major, and
 * `.npmrc` never carried build settings. A package left undecided is worse than either answer: pnpm stops with
 * `ERR_PNPM_IGNORED_BUILDS`, tells the user to run `pnpm approve-builds`, and appends a placeholder entry to their
 * `pnpm-workspace.yaml` — a red error on a project's first install, before anyone has written a line of code.
 *
 * `true` allows the script; `false` records that it is deliberately skipped, which silences the same prompt without
 * running anything. Both are decisions and both belong here.
 *
 * `better-sqlite3`, `esbuild`, and `oracledb` compile native code. Database drivers are written whichever database
 * was chosen: listing them costs nothing and means switching an app's database later just works, instead of failing
 * at runtime because a native addon was not built. `tesseract.js` arrives through `officeparser` in the AI runtime
 * and its `postinstall` only prints an OpenCollective donation notice, so it is skipped. The list mirrors the
 * repository's own `pnpm-workspace.yaml`, so an application and the monorepo decide the same packages the same way.
 */
export const ALLOWED_BUILDS: readonly AllowBuildsEntry[] = [
  { name: 'better-sqlite3', allowed: true },
  { name: 'esbuild', allowed: true },
  { name: 'oracledb', allowed: true },
  { name: 'tesseract.js', allowed: false },
];

/** YAML needs quotes around a scoped name, whose leading `@` would otherwise start a reserved indicator. */
function formatEntry(entry: AllowBuildsEntry): string {
  const key = entry.name.startsWith('@') ? `'${entry.name}'` : entry.name;

  return `  ${key}: ${entry.allowed}`;
}

export function buildAllowBuildsYaml(
  entries: readonly AllowBuildsEntry[] = ALLOWED_BUILDS,
): string {
  if (entries.length === 0) {
    return '';
  }

  return [
    '# Which dependencies may run install scripts: true compiles a native addon, false skips a script',
    '# the project does not need. A package left out here stops the install with ERR_PNPM_IGNORED_BUILDS.',
    '# pnpm 11 reads this from pnpm-workspace.yaml only; see https://pnpm.io/settings/build.',
    'allowBuilds:',
    ...entries.map(formatEntry),
    '',
  ].join('\n');
}

/**
 * Settings written alongside `allowBuilds`, keyed by the comment that explains each one.
 *
 * `trustLockfile` turns off the pass that re-applies `minimumReleaseAge` and `trustPolicy` to every entry already in
 * the lockfile. That check queries registry metadata for each package and holds it in memory for the whole install —
 * on a dependency tree this size it costs tens of seconds every time, and it re-verifies versions that were already
 * verified when they were first resolved and written to the lockfile.
 *
 * Anything newly resolved is still checked: the setting only skips re-auditing what the lockfile already pins. pnpm
 * documents the tradeoff as a lockfile that arrives from an untrusted contributor could carry entries that would not
 * pass today's policy, so a project taking lockfile changes from outside collaborators should set this back to false.
 */
export const WORKSPACE_SETTINGS: readonly {
  comment: readonly string[];
  key: string;
  value: string;
}[] = [
  {
    comment: [
      '# Use msgpackr without its optional native accelerator or platform binary packages.',
    ],
    key: 'ignoredOptionalDependencies',
    value: '[msgpackr-extract]',
  },
  {
    comment: [
      '# Install dependencies explicitly instead of during dev/build/start.',
      '# create-app installs them initially; run pnpm install after changing dependencies.',
    ],
    key: 'verifyDepsBeforeRun',
    value: 'false',
  },
  {
    comment: [
      '# Skips re-auditing lockfile entries against the supply-chain policy on every install.',
      '# The check costs tens of seconds here and re-verifies versions the lockfile already pins;',
      '# newly resolved packages are still checked. Set to false if outside contributors edit the',
      '# lockfile. See https://pnpm.io/settings/dependency-resolution#trustlockfile.',
    ],
    key: 'trustLockfile',
    value: 'true',
  },
  {
    comment: [
      '# Reports a dependency whose install script was skipped as a warning instead of failing the',
      '# install. allowBuilds above decides the packages known today; this keeps a new transitive',
      '# dependency from stopping the install with a red error before anything is even running.',
      '# See https://pnpm.io/settings/build#strictdepbuilds.',
    ],
    key: 'strictDepBuilds',
    value: 'false',
  },
];

/** The complete `pnpm-workspace.yaml` a generated application starts with. */
export function buildWorkspaceYaml(
  entries: readonly AllowBuildsEntry[] = ALLOWED_BUILDS,
): string {
  const settings = WORKSPACE_SETTINGS.flatMap((setting) => [
    ...setting.comment,
    `${setting.key}: ${setting.value}`,
    '',
  ]);

  return [buildAllowBuildsYaml(entries), ...settings].join('\n');
}

/**
 * Writes the `allowBuilds` list into the generated project, merging into whatever the template already shipped.
 *
 * A template may carry its own `pnpm-workspace.yaml`; clobbering it would drop settings it deliberately set, so an
 * existing `allowBuilds` block is added to rather than replaced, and entries already present are left alone. Parsing
 * YAML properly would mean taking on a dependency for one shallow map, so the merge is textual and only handles the
 * shape this file is ever written in.
 */
export async function ensureAllowBuilds(
  directory: string,
  entries: readonly AllowBuildsEntry[] = ALLOWED_BUILDS,
): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  const target = path.join(directory, PNPM_WORKSPACE_FILE);
  let existing = '';

  try {
    existing = await readFile(target, 'utf8');
  } catch {
    // No file yet; the generated block below stands on its own.
  }

  if (existing.trim() === '') {
    await writeFile(target, buildWorkspaceYaml(entries), 'utf8');
    return;
  }

  const missing = entries.filter(
    (entry) => !hasAllowBuildsEntry(existing, entry.name),
  );
  let merged = existing;

  if (missing.length > 0) {
    merged = merged.includes('allowBuilds:')
      ? insertIntoAllowBuilds(merged, missing)
      : `${merged.trimEnd()}\n\n${buildAllowBuildsYaml(missing)}`;
  }

  // A template that already set one of these made a deliberate choice, so only the absent ones are appended.
  const absent = WORKSPACE_SETTINGS.filter(
    (setting) => !hasTopLevelKey(merged, setting.key),
  );

  if (absent.length > 0) {
    const block = absent.flatMap((setting) => [
      ...setting.comment,
      `${setting.key}: ${setting.value}`,
      '',
    ]);
    merged = `${merged.trimEnd()}\n\n${block.join('\n')}`;
  }

  if (merged === existing) {
    return;
  }

  await writeFile(target, merged, 'utf8');
}

/** A top-level key sits at column zero, so an `allowBuilds` entry of the same name cannot be mistaken for one. */
function hasTopLevelKey(contents: string, key: string): boolean {
  return new RegExp(`^${key}\\s*:`, 'mu').test(contents);
}

/** Matches an entry written either bare or quoted, since a scoped name needs quotes and an unscoped one does not. */
function hasAllowBuildsEntry(contents: string, name: string): boolean {
  const escaped = name.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&');

  return new RegExp(`^\\s+['"]?${escaped}['"]?\\s*:`, 'mu').test(contents);
}

function insertIntoAllowBuilds(
  contents: string,
  entries: readonly AllowBuildsEntry[],
): string {
  const lines = contents.split(/\r?\n/u);
  const index = lines.findIndex((line) => /^allowBuilds\s*:/u.test(line));

  if (index === -1) {
    return `${contents.trimEnd()}\n\n${buildAllowBuildsYaml(entries)}`;
  }

  lines.splice(index + 1, 0, ...entries.map(formatEntry));

  return `${lines.join('\n').trimEnd()}\n`;
}
