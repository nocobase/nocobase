// Copies skills from an application's direct NocoBase dependencies and registered plugins.
//
// Upstream is the single source of truth: every synchronized directory that
// differs from upstream is replaced wholesale (one that matches is left
// untouched), and a directory whose name does not start with
// `nocobase-` is never touched, so an application can keep local skills
// alongside the synchronized ones. The entire app-side `.agents/` tree is
// ignored generated state, not a version-controlled source of truth.
//
// Where the packages live differs by caller. Inside this repository they sit
// under `packages/`; in a generated application they are installed into
// `node_modules`. Everything except that lookup is shared, so the lookup is a
// parameter rather than a branch.
import {
  createClientPluginsEditor,
  readClientPlugins,
} from './client-plugins.ts';
import {
  createServerPluginsEditor,
  readServerPlugins,
} from './server-plugins.ts';

import { createCliPluginsEditor, readCliPlugins } from './cli-plugins.ts';
import {
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  readlink,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const PACKAGE_SCOPE = '@nocobase/';
const KEBAB_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const PLUGIN_PACKAGE_PREFIX = '@nocobase/app-plugin-';
const OWNERSHIP_FILE = path.join('.agents', '.skills-sync.json');

/** Directory, relative to a package root, that holds its App-facing skills. */
export const PLUGIN_SKILLS_DIRECTORY = 'skills';

/** Directory, relative to an application root, that receives synchronized skills. */
export const APP_SKILLS_DIRECTORY: string = path.join('.agents', 'skills');

/** Every synchronized skill directory starts with this prefix. */
export const SKILL_NAME_PREFIX = 'nocobase-';

/**
 * Directory, relative to an application root, that Claude Code reads skills from.
 *
 * `.agents/skills/` is the agent-neutral location this command owns, and Claude Code does not look there: it discovers
 * skills only under `~/.claude/skills/` and `<project>/.claude/skills/`. An application that synchronized its skills
 * would therefore still show none of them in Claude Code, while the globally installed NocoBase 2 skills its
 * `AGENTS.md` tells agents to ignore stay available — exactly backwards. So every synchronized directory is mirrored
 * here as a symbolic link. Links rather than copies because `.agents/skills/` is replaced wholesale on the next sync,
 * and a copy taken from it silently becomes the stale second version of the same guidance.
 */
export const CLAUDE_SKILLS_DIRECTORY: string = path.join('.claude', 'skills');

export interface PluginLocation {
  readonly packageName: string;
  readonly pluginDirectory: string;
}

export interface PluginSkills extends PluginLocation {
  readonly prefix: string;
  readonly skills: readonly SkillSource[];
  readonly skillsDirectory: string;
}

export interface SkillSource {
  readonly name: string;
  readonly packageName: string;
  readonly sourcePath: string;
}

export interface SkillCopy {
  readonly files: readonly string[];
  readonly packageName: string;
  readonly skillName: string;
  readonly sourcePath: string;
  readonly targetPath: string;
}

export interface SkillRemoval {
  readonly files: readonly string[];
  readonly packageName: string;
  readonly skillName: string;
  readonly targetPath: string;
}

export interface SkillsSyncPlan {
  readonly appPackageName: string;
  readonly appRoot: string;
  readonly copies: readonly SkillCopy[];
  readonly dryRun?: boolean;
  readonly plugins: readonly {
    readonly packageName: string;
    readonly pluginDirectory: string;
    readonly prefix: string;
    readonly skills: readonly string[];
  }[];
  readonly removals: readonly SkillRemoval[];
  readonly skillsRoot: string;
  readonly ownership: Readonly<Record<string, string>>;
}

/**
 * The skill directory prefix a plugin package owns. The prefix is the package
 * name without its scope, so `@nocobase/app-plugin-scheduler` owns
 * `nocobase-app-plugin-scheduler` and `nocobase-app-plugin-scheduler-<suffix>`.
 */
export function pluginSkillPrefix(packageName: string): string {
  if (!packageName.startsWith(PACKAGE_SCOPE)) {
    throw new Error(
      `Plugin package name must start with ${PACKAGE_SCOPE}, found ${packageName}.`,
    );
  }
  const unscopedName = packageName.slice(PACKAGE_SCOPE.length);
  if (!KEBAB_PATTERN.test(unscopedName)) {
    throw new Error(
      `Plugin package name cannot be turned into a skill prefix: ${packageName}.`,
    );
  }
  return `${SKILL_NAME_PREFIX}${unscopedName}`;
}

/** Whether a skill directory name belongs to the plugin owning `prefix`. */
export function isOwnedSkillName(prefix: string, skillName: string): boolean {
  return skillName === prefix || skillName.startsWith(`${prefix}-`);
}

/**
 * The first-level skill directories a NocoBase package ships, with their names validated.
 * A package without `skills/` yields an empty list: most packages ship no
 * skills and must not produce warnings.
 */
export async function collectPluginSkills({
  packageName,
  pluginDirectory,
}: PluginLocation): Promise<PluginSkills> {
  const skillsDirectory = path.join(pluginDirectory, PLUGIN_SKILLS_DIRECTORY);
  const prefix = pluginSkillPrefix(packageName);
  const entries = await readDirectoryEntries(skillsDirectory);

  const skills: SkillSource[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (
      !KEBAB_PATTERN.test(entry.name) ||
      !entry.name.startsWith(SKILL_NAME_PREFIX) ||
      (packageName.startsWith(PLUGIN_PACKAGE_PREFIX)
        ? !isOwnedSkillName(prefix, entry.name)
        : entry.name.startsWith('nocobase-app-plugin-'))
    ) {
      throw new Error(
        `Invalid skill directory ${entry.name} in ${skillsDirectory}: use a nocobase- prefixed kebab-case name; plugin skills must use their package prefix ${prefix}, and nocobase-app-plugin-* names are reserved for their owning plugins.`,
      );
    }
    skills.push({
      name: entry.name,
      packageName,
      sourcePath: path.join(skillsDirectory, entry.name),
    });
  }
  return { packageName, pluginDirectory, prefix, skills, skillsDirectory };
}

/**
 * The full-overwrite plan: which upstream skill directories to copy in, and
 * which tracked directories no longer exist upstream. A full application sync
 * also prunes skills from removed packages; targeted syncs preserve other owners.
 */
export async function planSkillsSync({
  appPackageName,
  appRoot,
  plugins,
  pruneMissingPackages = false,
}: {
  appPackageName: string;
  appRoot: string;
  plugins: readonly PluginLocation[];
  pruneMissingPackages?: boolean;
}): Promise<SkillsSyncPlan> {
  const skillsRoot = path.join(appRoot, APP_SKILLS_DIRECTORY);
  const previousOwnership = await readSkillsOwnership(appRoot);
  const sources: PluginSkills[] = [];
  for (const plugin of plugins) {
    sources.push(await collectPluginSkills(plugin));
  }
  const selectedPackages = new Set(sources.map((source) => source.packageName));

  const owners = new Map<string, string>();
  const copies: SkillCopy[] = [];
  for (const source of sources) {
    for (const skill of source.skills) {
      const previousOwner = owners.get(skill.name);
      if (previousOwner !== undefined) {
        throw new Error(
          `Skill name collision: ${skill.name} is provided by both ${previousOwner} and ${skill.packageName}.`,
        );
      }
      const recordedOwner = previousOwnership[skill.name];
      if (
        recordedOwner !== undefined &&
        recordedOwner !== skill.packageName &&
        !selectedPackages.has(recordedOwner) &&
        !pruneMissingPackages
      ) {
        throw new Error(
          `Skill name collision: ${skill.name} is already synchronized from ${recordedOwner}. Run a full nocobase skills sync to reconcile package ownership.`,
        );
      }
      owners.set(skill.name, skill.packageName);
      copies.push({
        files: await listFiles(skill.sourcePath),
        packageName: skill.packageName,
        skillName: skill.name,
        sourcePath: skill.sourcePath,
        targetPath: path.join(skillsRoot, skill.name),
      });
    }
  }

  const removals: SkillRemoval[] = [];
  for (const entry of await readDirectoryEntries(skillsRoot)) {
    if (!entry.isDirectory() || !entry.name.startsWith(SKILL_NAME_PREFIX)) {
      continue;
    }
    if (owners.has(entry.name)) {
      continue;
    }
    const recordedOwner = previousOwnership[entry.name];
    const owner =
      recordedOwner ?? findOwningPlugin(sources, entry.name)?.packageName;
    if (
      owner === undefined ||
      (!selectedPackages.has(owner) && !pruneMissingPackages)
    ) {
      continue;
    }
    const targetPath = path.join(skillsRoot, entry.name);
    removals.push({
      files: await listFiles(targetPath),
      packageName: owner,
      skillName: entry.name,
      targetPath,
    });
  }

  return {
    appPackageName,
    appRoot,
    copies,
    plugins: sources.map(
      ({ packageName, pluginDirectory, prefix, skills }) => ({
        packageName,
        pluginDirectory,
        prefix,
        skills: skills.map(({ name }) => name),
      }),
    ),
    removals,
    skillsRoot,
    ownership: Object.fromEntries([
      ...Object.entries(previousOwnership).filter(
        ([, owner]) => !pruneMissingPackages && !selectedPackages.has(owner),
      ),
      ...owners,
    ]),
  };
}

/**
 * Executes a plan. Upstream wins: every target directory that differs from its source is replaced wholesale.
 *
 * A target already identical to its source, a link already pointing at it and an unchanged ownership record are left
 * untouched, so a sync with nothing new writes nothing. That keeps `pnpm install` from rewriting `.agents/` on every
 * run, and lets it pass where `.agents/` is read-only but already current, as in a coding tool's sandbox.
 */
export async function applySkillsSync(
  plan: SkillsSyncPlan,
): Promise<SkillsSyncPlan> {
  for (const removal of plan.removals) {
    await rm(removal.targetPath, { force: true, recursive: true });
    await unlinkClaudeSkill(plan.appRoot, removal.skillName);
  }
  for (const copy of plan.copies) {
    if (!(await isSameSkill(copy))) {
      await mkdir(plan.skillsRoot, { recursive: true });
      await rm(copy.targetPath, { force: true, recursive: true });
      await cp(copy.sourcePath, copy.targetPath, { recursive: true });
    }
    await linkClaudeSkill(plan.appRoot, copy.skillName);
  }
  await writeSkillsOwnership(plan.appRoot, plan.ownership);
  return plan;
}

/** Whether a skill's target holds exactly its source's files, byte for byte, and nothing else. */
async function isSameSkill(copy: SkillCopy): Promise<boolean> {
  const targetFiles = await listFiles(copy.targetPath);
  if (
    targetFiles.length !== copy.files.length ||
    targetFiles.some((file, index) => file !== copy.files[index])
  ) {
    return false;
  }
  for (const file of copy.files) {
    const [source, target] = await Promise.all([
      readFile(path.join(copy.sourcePath, file)),
      readFile(path.join(copy.targetPath, file)).catch(() => undefined),
    ]);
    if (target === undefined || !source.equals(target)) return false;
  }
  return true;
}

/** Plans removal from recorded ownership even when the package has already been uninstalled. */
export async function planPackageSkillRemovals(
  appRoot: string,
  packageName: string,
): Promise<string[]> {
  const prefix = pluginSkillPrefix(packageName);
  const ownership = await readSkillsOwnership(appRoot);
  const names = new Set(
    Object.entries(ownership)
      .filter(([, owner]) => owner === packageName)
      .map(([name]) => name),
  );

  // Older CLI versions recorded plugin ownership through the package prefix.
  // A recorded owner takes precedence, including when its prefix is longer.
  if (packageName.startsWith(PLUGIN_PACKAGE_PREFIX)) {
    for (const entry of await readDirectoryEntries(
      path.join(appRoot, APP_SKILLS_DIRECTORY),
    )) {
      if (
        entry.isDirectory() &&
        isOwnedSkillName(prefix, entry.name) &&
        (ownership[entry.name] === undefined ||
          ownership[entry.name] === packageName)
      ) {
        names.add(entry.name);
      }
    }
  }
  return [...names].sort();
}

/** Removes only this package's synchronized skills and drops its ownership records. */
export async function removePackageSkills(
  appRoot: string,
  packageName: string,
): Promise<string[]> {
  const names = await planPackageSkillRemovals(appRoot, packageName);
  for (const name of names) {
    await rm(path.join(appRoot, APP_SKILLS_DIRECTORY, name), {
      force: true,
      recursive: true,
    });
    await unlinkClaudeSkill(appRoot, name);
  }
  const ownership = await readSkillsOwnership(appRoot);
  if (Object.values(ownership).includes(packageName)) {
    await writeSkillsOwnership(
      appRoot,
      Object.fromEntries(
        Object.entries(ownership).filter(([, owner]) => owner !== packageName),
      ),
    );
  }
  return names;
}

/**
 * Locates direct NocoBase dependencies and registered plugins in an application.
 * Optional dependencies may be absent; required dependencies must be installed.
 * The legacy plugin filter and result keys remain compatible with plugin callers.
 */
export async function resolveInstalledPlugins({
  appRoot,
  plugin,
  packageName: selectedPackage,
}: {
  appRoot: string;
  plugin?: string;
  packageName?: string;
}): Promise<{
  appPackageName: string;
  appRoot: string;
  plugins: PluginLocation[];
}> {
  const packageJsonPath = path.join(appRoot, 'package.json');
  const applicationPackage = await readJson(packageJsonPath);
  const appPackageName =
    typeof applicationPackage.name === 'string'
      ? applicationPackage.name
      : appRoot;
  if (plugin !== undefined && selectedPackage !== undefined) {
    throw new Error('Specify either a package or a plugin, not both.');
  }
  const registeredPackages =
    plugin === undefined && selectedPackage === undefined
      ? await resolveRegisteredPluginNames(appRoot)
      : [];
  const dependencies = readDependencyNames(applicationPackage.dependencies);
  const devDependencies = readDependencyNames(
    applicationPackage.devDependencies,
  );
  const optionalDependencies = readDependencyNames(
    applicationPackage.optionalDependencies,
  );
  const packageNames =
    selectedPackage !== undefined
      ? [selectedPackage]
      : plugin !== undefined
        ? [normalizePluginPackageName(plugin)]
        : [
            ...new Set([
              ...dependencies,
              ...devDependencies,
              ...optionalDependencies,
              ...registeredPackages,
            ]),
          ].sort();

  const plugins: PluginLocation[] = [];
  for (const packageName of packageNames) {
    pluginSkillPrefix(packageName);
    const pluginDirectory = path.join(appRoot, 'node_modules', packageName);
    if (await isPackageDirectory(pluginDirectory, packageName)) {
      plugins.push({ packageName, pluginDirectory });
      continue;
    }
    if (
      plugin === undefined &&
      selectedPackage === undefined &&
      optionalDependencies.includes(packageName) &&
      !registeredPackages.includes(packageName)
    ) {
      continue;
    }
    throw new Error(
      `Plugin package ${packageName} is not installed in ${appRoot}. Run the package manager install first.`,
    );
  }
  return { appPackageName, appRoot, plugins };
}

/** Renders a human-readable summary of a plan or result. */
export function formatSkillsSyncSummary(
  plan: SkillsSyncPlan,
  { verbose = false }: { verbose?: boolean } = {},
): string {
  if (plan.copies.length === 0 && plan.removals.length === 0) {
    return `No NocoBase package skills to synchronize for ${plan.appPackageName}.`;
  }

  const lines: string[] = [
    `${plan.dryRun ? 'Would synchronize' : 'Synchronized'} NocoBase package skills for ${plan.appPackageName}`,
  ];
  for (const copy of plan.copies) {
    lines.push(`  copy ${copy.skillName} (${copy.packageName})`);
    if (verbose || plan.dryRun) {
      for (const file of copy.files) {
        lines.push(`    + ${file}`);
      }
    }
  }
  for (const removal of plan.removals) {
    lines.push(
      `  remove ${removal.skillName} (no longer provided by ${removal.packageName})`,
    );
    if (verbose || plan.dryRun) {
      for (const file of removal.files) {
        lines.push(`    - ${file}`);
      }
    }
  }
  return lines.join('\n');
}

function normalizePluginPackageName(name: string): string {
  const trimmed = name.trim();
  return trimmed.startsWith(PACKAGE_SCOPE)
    ? trimmed
    : `${PACKAGE_SCOPE}app-plugin-${trimmed}`;
}

/** Reads an application manifest, failing with the path when the JSON is bad. */
export async function readAppPackage(
  appRoot: string,
): Promise<Record<string, unknown>> {
  return readJson(path.join(appRoot, 'package.json'));
}

/** The plugin packages an application registers, in a stable order. */
export async function resolveRegisteredPluginNames(
  appRoot: string,
): Promise<string[]> {
  const names = new Set<string>();
  const client = await readClientPlugins(appRoot);
  if (client.exists) {
    const editor = await createClientPluginsEditor(appRoot);
    for (const entry of editor.list(client.sourceText))
      names.add(entry.packageName);
  }
  const server = await readServerPlugins(appRoot);
  if (server.exists) {
    const editor = await createServerPluginsEditor(appRoot);
    for (const entry of editor.list(server.sourceText))
      names.add(entry.packageName);
  }
  const cli = await readCliPlugins(appRoot);
  if (cli.exists) {
    const editor = await createCliPluginsEditor(appRoot);
    for (const entry of editor.list(cli.sourceText))
      names.add(entry.packageName);
  }
  return [...names].sort();
}

/**
 * Picks the plugin owning an app-side skill directory. The longest matching
 * prefix wins, so `nocobase-app-plugin-notification-provider` belongs to
 * `app-plugin-notification-provider` rather than reading as a suffixed skill of
 * `app-plugin-notification`.
 */
function findOwningPlugin(
  sources: readonly PluginSkills[],
  skillName: string,
): PluginSkills | undefined {
  let owner: PluginSkills | undefined;
  for (const source of sources) {
    // Only the legacy plugin contract grants ownership by prefix. Other packages
    // own exactly the names recorded when they were synchronized.
    if (!source.packageName.startsWith(PLUGIN_PACKAGE_PREFIX)) {
      continue;
    }
    if (!isOwnedSkillName(source.prefix, skillName)) {
      continue;
    }
    if (owner === undefined || source.prefix.length > owner.prefix.length) {
      owner = source;
    }
  }
  return owner;
}

function readDependencyNames(value: unknown): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }
  return Object.keys(value).filter((name) => name.startsWith(PACKAGE_SCOPE));
}

async function readSkillsOwnership(
  appRoot: string,
): Promise<Record<string, string>> {
  const filePath = path.join(appRoot, OWNERSHIP_FILE);
  let value: Record<string, unknown>;
  try {
    value = await readJson(filePath);
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) return {};
    throw error;
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid skills ownership in ${filePath}.`);
  }
  for (const [name, owner] of Object.entries(value)) {
    if (
      !KEBAB_PATTERN.test(name) ||
      !name.startsWith(SKILL_NAME_PREFIX) ||
      typeof owner !== 'string'
    ) {
      throw new Error(`Invalid skills ownership in ${filePath}.`);
    }
    pluginSkillPrefix(owner);
  }
  return value as Record<string, string>;
}

async function writeSkillsOwnership(
  appRoot: string,
  ownership: Readonly<Record<string, string>>,
): Promise<void> {
  const filePath = path.join(appRoot, OWNERSHIP_FILE);
  const contents = `${JSON.stringify(ownership, null, 2)}\n`;
  const current = await readFile(filePath, 'utf8').catch(() => undefined);
  if (current === contents) return;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
}

/**
 * Mirrors one synchronized skill into `.claude/skills/` as a symbolic link.
 *
 * The link is relative so the application directory stays movable. Only a link is ever replaced: a real directory
 * under a `nocobase-` name is something this command did not write, and removing it to make room would delete work it
 * cannot restore, so it is reported instead.
 */
async function linkClaudeSkill(
  appRoot: string,
  skillName: string,
): Promise<void> {
  const linkPath = path.join(appRoot, CLAUDE_SKILLS_DIRECTORY, skillName);
  const relativeTarget = path.join('..', '..', APP_SKILLS_DIRECTORY, skillName);
  const absoluteTarget = path.join(appRoot, APP_SKILLS_DIRECTORY, skillName);
  const current = await readlink(linkPath).catch(() => undefined);
  // A Windows junction reads back as its absolute target, sometimes with a trailing separator.
  if (
    current !== undefined &&
    (current === relativeTarget ||
      (path.isAbsolute(current) &&
        path.resolve(current) === path.resolve(absoluteTarget)))
  ) {
    return;
  }
  if (!(await removeSymbolicLink(linkPath))) {
    throw new Error(
      `Cannot link ${skillName} into ${CLAUDE_SKILLS_DIRECTORY}: ${linkPath} exists and is not a symbolic link. Remove it and run the sync again.`,
    );
  }
  await mkdir(path.dirname(linkPath), { recursive: true });
  try {
    await symlink(relativeTarget, linkPath, 'dir');
  } catch (error) {
    if (process.platform !== 'win32') {
      throw error;
    }
    // Windows refuses symbolic links without developer mode or elevation. A junction needs neither, but only accepts
    // an absolute target, so on that platform alone the application directory stops being movable.
    await symlink(absoluteTarget, linkPath, 'junction');
  }
}

/** Drops the `.claude/skills/` mirror of a skill that is no longer synchronized. */
async function unlinkClaudeSkill(
  appRoot: string,
  skillName: string,
): Promise<void> {
  await removeSymbolicLink(
    path.join(appRoot, CLAUDE_SKILLS_DIRECTORY, skillName),
  );
}

/**
 * Removes `linkPath` when it is a symbolic link, reporting whether the path is now free.
 *
 * `lstat` rather than `stat` so a link to a missing target still reads as a link, and `unlink` rather than `rm` so a
 * link to a directory is removed without following it.
 */
async function removeSymbolicLink(linkPath: string): Promise<boolean> {
  let entry;
  try {
    entry = await lstat(linkPath);
  } catch (error) {
    if (isNodeError(error, 'ENOENT') || isNodeError(error, 'ENOTDIR')) {
      return true;
    }
    throw error;
  }
  if (!entry.isSymbolicLink()) {
    return false;
  }
  await unlink(linkPath);
  return true;
}

async function isPackageDirectory(
  directory: string,
  packageName: string,
): Promise<boolean> {
  try {
    const manifest = await readJson(path.join(directory, 'package.json'));
    return manifest.name === packageName;
  } catch {
    return false;
  }
}

async function readJson(filePath: string): Promise<Record<string, unknown>> {
  const contents = await readFile(filePath, 'utf8');
  try {
    return JSON.parse(contents) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}.`, { cause: error });
  }
}

async function readDirectoryEntries(
  directory: string,
): Promise<{ name: string; isDirectory: () => boolean }[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return [...entries].sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    );
  } catch (error) {
    if (isNodeError(error, 'ENOENT') || isNodeError(error, 'ENOTDIR')) {
      return [];
    }
    throw error;
  }
}

async function listFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  const walk = async (directory: string, prefix: string): Promise<void> => {
    for (const entry of await readDirectoryEntries(directory)) {
      const relativePath =
        prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) {
        await walk(path.join(directory, entry.name), relativePath);
        continue;
      }
      files.push(relativePath);
    }
  };
  await walk(root, '');
  return files;
}

function isNodeError(error: unknown, code: string): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    (error as { code?: string }).code === code
  );
}
