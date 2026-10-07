// The run's skills (`RunPayload.skills`), in the open Agent Skills format: a directory per skill with its `SKILL.md`.
//
// Each bundle is fetched once per content hash from the application (`RUNNER_ROUTES.skill`, with the runner's key) into
// `~/.nocobase-runner/skills/<app>/<slug>/<hash>/`, then copied, every run afresh, into a folder the runner owns inside the
// subject's work directory:
//
//   <workDir>/.nocobase-runner/plugin/
//     .claude-plugin/plugin.json      the folder is also a Claude Code plugin (`nocobase-runner`)
//     skills/<slug>/SKILL.md ...      the skills
//
// Beside them go the skills the run's CLI ships in its own package (`cliSkills`: `skills/<slug>/SKILL.md` beside the
// package.json that declares the command), such as `acme-cli` in `acme`'s, unless the run brings a skill of that slug
// itself. Nothing is written into a repository or into the person's own configuration. Each adapter registers the
// folder the way its tool finds skills (`AdapterSession.skills`): Claude Code loads it as a local plugin, Codex as an extra skills
// root, OpenCode as its config directory, Pi with one `--skill` per skill. The system prompt names the folder too, so an
// agent can read a skill even where registration fails.
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { cp, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { ApiClient } from '../lib/http.ts';
import { safeName, writeJsonAtomic, type RunnerPaths } from '../lib/home.ts';
import {
  SkillBundleSchema,
  type RunSkill,
  type SkillBundle,
} from '../protocol/index.ts';
import type { SkillsPlacement } from './adapters/types.ts';
import { RUNNER_DIR } from '../core/checkout.ts';
import { isInside } from '../core/command-policy.ts';

export class SkillsError extends Error {
  override name = 'SkillsError';
}

/** The plugin name Claude Code sees; skills are invoked as `/nocobase-runner:<slug>`. */
export const SKILLS_PLUGIN_NAME = 'nocobase-runner';

const COMPLETE = '.complete';

export function skillCacheDir(
  paths: RunnerPaths,
  appKey: string,
  skill: Pick<RunSkill, 'slug' | 'hash'>,
): string {
  return path.join(
    paths.skillsDir,
    safeName(appKey),
    safeName(skill.slug),
    safeName(skill.hash),
  );
}

/** Writes a bundle's files under `dir`, refusing any path that would leave it; binary ones decoded, scripts executable. */
async function writeBundle(dir: string, bundle: SkillBundle): Promise<void> {
  for (const file of bundle.files) {
    const target = path.resolve(dir, file.path);
    if (target === dir || !isInside(dir, target))
      throw new SkillsError(
        `Skill ${bundle.slug} has a file outside its directory: ${file.path}`,
      );
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(
      target,
      file.encoding === 'base64'
        ? Buffer.from(file.content, 'base64')
        : file.content,
      { mode: file.executable ? 0o700 : 0o600 },
    );
  }
}

/** The cached copy of `skill`, fetched when the cache lacks it. */
async function ensureCached(options: {
  paths: RunnerPaths;
  appKey: string;
  skill: RunSkill;
  client: ApiClient;
  log?: (message: string) => void;
}): Promise<{ dir: string; fetched: boolean }> {
  const { skill, client } = options;
  const dir = skillCacheDir(options.paths, options.appKey, skill);
  if (existsSync(path.join(dir, COMPLETE))) return { dir, fetched: false };
  if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(skill.bundleUrl)) {
    // The runner key goes only to the application it belongs to.
    if (new URL(skill.bundleUrl).origin !== new URL(client.server).origin)
      throw new SkillsError(
        `Skill ${skill.slug} is served from another origin: ${skill.bundleUrl}`,
      );
  }
  options.log?.(`skills: fetching ${skill.slug} ${skill.version}`);
  const bundle = await client.get(skill.bundleUrl, SkillBundleSchema);
  if (bundle.slug !== skill.slug)
    throw new SkillsError(
      `Asked for skill ${skill.slug}, received ${bundle.slug}.`,
    );
  if (!bundle.files.some((file) => file.path === 'SKILL.md'))
    throw new SkillsError(`Skill ${skill.slug} has no SKILL.md.`);
  const temporary = `${dir}.${process.pid}.${Date.now()}.tmp`;
  await rm(temporary, { recursive: true, force: true });
  await mkdir(temporary, { recursive: true, mode: 0o700 });
  try {
    await writeBundle(temporary, bundle);
    await writeFile(path.join(temporary, COMPLETE), '');
    await rm(dir, { recursive: true, force: true });
    await mkdir(path.dirname(dir), { recursive: true, mode: 0o700 });
    await rename(temporary, dir);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
  return { dir, fetched: true };
}

export interface PlaceSkillsOptions {
  paths: RunnerPaths;
  appKey: string;
  workDir: string;
  skills: readonly RunSkill[];
  client: ApiClient;
  log?: (message: string) => void;
  /** Skills the run's CLI ships (`cliSkills`), placed beside the run's own unless one of those has the same slug. */
  builtIn?: readonly BuiltInSkill[];
}

/** A skill directory a CLI package ships (`skills/<slug>/SKILL.md`). */
export interface BuiltInSkill {
  readonly slug: string;
  readonly dir: string;
}

/** Whether the package.json in `dir` declares the command `name`. */
function declaresCommand(dir: string, name: string): boolean {
  try {
    const manifest = JSON.parse(
      readFileSync(path.join(dir, 'package.json'), 'utf8'),
    ) as { name?: unknown; bin?: unknown };
    const { bin } = manifest;
    if (typeof bin === 'string')
      return (
        typeof manifest.name === 'string' &&
        manifest.name.replace(/^@[^/]+\//u, '') === name
      );
    return typeof bin === 'object' && bin !== null && name in bin;
  } catch {
    return false;
  }
}

/**
 * The root of the package that provides the CLI at `entry` (its executable or JavaScript entry, links followed): the
 * nearest directory above it with a package.json, when that package.json declares the command `name`.
 */
export function cliPackageRoot(
  entry: string,
  name: string,
): string | undefined {
  let dir: string;
  try {
    dir = path.dirname(realpathSync(entry));
  } catch {
    return undefined;
  }
  for (;;) {
    if (existsSync(path.join(dir, 'package.json')))
      return declaresCommand(dir, name) ? dir : undefined;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/**
 * The skills the CLI at `entry` ships in its package (`skills/<slug>/SKILL.md`), such as `acme-cli` (how to find and
 * call `acme`'s commands, and what only the web page does) in `acme`'s; none when its package cannot be found.
 */
export function cliSkills(entry: string, name: string): BuiltInSkill[] {
  const root = cliPackageRoot(entry, name);
  if (root === undefined) return [];
  const skillsDir = path.join(root, 'skills');
  let entries: string[];
  try {
    entries = readdirSync(skillsDir).sort();
  } catch {
    return [];
  }
  return entries
    .filter(
      (slug) =>
        /^[a-z0-9][a-z0-9._-]*$/iu.test(slug) &&
        existsSync(path.join(skillsDir, slug, 'SKILL.md')),
    )
    .map((slug) => ({ slug, dir: path.join(skillsDir, slug) }));
}

export interface PlacedSkills {
  placement: SkillsPlacement | undefined;
  /** The slugs fetched from the application this time (the others came from the cache). */
  fetched: string[];
}

/** Rebuilds the run's skills folder; no folder when the run has no skills. */
export async function placeSkills(
  options: PlaceSkillsOptions,
): Promise<PlacedSkills> {
  const root = path.join(options.workDir, RUNNER_DIR, 'plugin');
  await rm(root, { recursive: true, force: true });
  const own = new Set(options.skills.map((skill) => skill.slug));
  const builtIn = (options.builtIn ?? []).filter(
    (skill) => !own.has(skill.slug),
  );
  if (options.skills.length === 0 && builtIn.length === 0)
    return { placement: undefined, fetched: [] };
  const dir = path.join(root, 'skills');
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const fetched: string[] = [];
  const slugs: string[] = [];
  for (const skill of options.skills) {
    if (slugs.includes(skill.slug)) continue;
    const cached = await ensureCached({ ...options, skill });
    if (cached.fetched) fetched.push(skill.slug);
    const target = path.join(dir, skill.slug);
    await cp(cached.dir, target, {
      recursive: true,
      filter: (source) => path.basename(source) !== COMPLETE,
    });
    slugs.push(skill.slug);
  }
  for (const skill of builtIn) {
    await cp(skill.dir, path.join(dir, skill.slug), { recursive: true });
    slugs.push(skill.slug);
  }
  await writeJsonAtomic(
    path.join(root, '.claude-plugin', 'plugin.json'),
    {
      name: SKILLS_PLUGIN_NAME,
      version: '1.0.0',
      description: 'The skills this run was given.',
    },
    0o600,
  );
  return { placement: { root, dir, slugs }, fetched };
}
