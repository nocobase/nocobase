// Link every Skill committed under `skills/` into `.agents/skills/` and `.claude/skills/`, so the agents working in
// this repository see them.
//
// `skills/` is the one committed source. It is also where `npx skills add` reads from the repository's v3 branch, so a Skill
// written there reaches a user's global installation and this checkout alike. Agents do not look there on their own:
// most read `.agents/skills/`, and Claude Code discovers Skills only under `~/.claude/skills/` and
// `<project>/.claude/skills/`. Without these links a contributor working in this repository gets none of its Skills,
// while the globally installed NocoBase 2 Skills that the root `AGENTS.md` tells agents to ignore stay available —
// exactly backwards.
//
// This is the same arrangement `nocobase skills sync` sets up inside a generated application: both directories are
// generated and ignored. The difference is where the Skills come from — an application's are copied from its installed
// packages, while this repository's are written by hand under `skills/`.
//
// Links rather than copies, so editing a Skill through any path edits the one committed file. Relative links, so the
// checkout stays movable.
import { lstat, mkdir, readdir, symlink, unlink } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/** Directory, relative to the repository root, that holds the committed Skills. */
export const SKILLS_DIRECTORY = 'skills';

/** Directories, relative to the repository root, that agents read Skills from. */
export const AGENT_SKILLS_DIRECTORIES = [
  path.join('.agents', 'skills'),
  path.join('.claude', 'skills'),
];

/**
 * Brings every directory in `AGENT_SKILLS_DIRECTORIES` in line with `skills/`, returning what changed in each.
 *
 * A path that is not a symbolic link is never replaced: it is something this script did not write, and removing it to
 * make room would delete work it cannot restore. It is reported and skipped instead.
 */
export async function syncSkills(root) {
  const names = await readDirectoryNames(path.join(root, SKILLS_DIRECTORY));
  const results = {};
  for (const directory of AGENT_SKILLS_DIRECTORIES) {
    results[directory] = await linkInto(root, directory, names);
  }
  return results;
}

async function linkInto(root, directory, names) {
  const target = path.join(root, directory);
  const linked = [];
  const removed = [];
  const skipped = [];

  for (const name of await readDirectoryNames(target, { links: true })) {
    if (names.includes(name)) continue;
    if (await removeSymbolicLink(path.join(target, name))) removed.push(name);
  }

  if (names.length > 0) await mkdir(target, { recursive: true });
  for (const name of names) {
    const linkPath = path.join(target, name);
    if (!(await removeSymbolicLink(linkPath))) {
      skipped.push(name);
      continue;
    }
    await createLink(root, directory, name, linkPath);
    linked.push(name);
  }

  return { linked, removed, skipped };
}

async function createLink(root, directory, name, linkPath) {
  const relativeTarget = path.relative(
    path.join(root, directory),
    path.join(root, SKILLS_DIRECTORY, name),
  );
  try {
    await symlink(relativeTarget, linkPath, 'dir');
  } catch (error) {
    if (process.platform !== 'win32') throw error;
    // Windows refuses symbolic links without developer mode or elevation. A junction needs neither, but only accepts
    // an absolute target, so on that platform alone the checkout stops being movable.
    await symlink(
      path.join(root, SKILLS_DIRECTORY, name),
      linkPath,
      'junction',
    );
  }
}

// `withFileTypes` reports a symbolic link as a link rather than as the directory it points at. `skills/` holds real
// directories only. The agent directories accept links outright: their entries are the links this script writes, and
// a link whose target is already gone still has to be found in order to be pruned.
async function readDirectoryNames(directory, { links = false } = {}) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter(
        (entry) => entry.isDirectory() || (links && entry.isSymbolicLink()),
      )
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (isNodeError(error, 'ENOENT') || isNodeError(error, 'ENOTDIR'))
      return [];
    throw error;
  }
}

/**
 * Removes `linkPath` when it is a symbolic link, reporting whether the path is now free.
 *
 * `lstat` rather than `stat` so a link to a missing target still reads as a link, and `unlink` rather than `rm` so a
 * link to a directory is removed without following it.
 */
async function removeSymbolicLink(linkPath) {
  let entry;
  try {
    entry = await lstat(linkPath);
  } catch (error) {
    if (isNodeError(error, 'ENOENT') || isNodeError(error, 'ENOTDIR'))
      return true;
    throw error;
  }
  if (!entry.isSymbolicLink()) return false;
  await unlink(linkPath);
  return true;
}

function isNodeError(error, code) {
  return error !== null && typeof error === 'object' && error.code === code;
}

/** Runs the sync without ever failing the install that invoked it. */
export async function main(root = path.resolve(import.meta.dirname, '..')) {
  try {
    const results = await syncSkills(root);
    for (const [directory, { linked, removed, skipped }] of Object.entries(
      results,
    )) {
      if (skipped.length > 0) {
        console.warn(
          `[nocobase3] Left ${skipped.join(', ')} in ${directory}: not a symbolic link. Remove it to have it linked to ${SKILLS_DIRECTORY}.`,
        );
      }
      if (linked.length > 0 || removed.length > 0) {
        console.log(
          `Linked ${linked.length} skill(s) into ${directory}${removed.length > 0 ? `, removed ${removed.length} stale link(s)` : ''}.`,
        );
      }
    }
  } catch (error) {
    // An unwritable or unusual working tree must not break `pnpm install`; the Skills are still readable where they
    // are committed.
    console.warn(
      `[nocobase3] Could not link ${SKILLS_DIRECTORY} into ${AGENT_SKILLS_DIRECTORIES.join(' and ')}: ${error.message}`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
