// Local installation of the one Studio Skill shipped by a branded CLI. No session, credential, or network is read.
import { createHash } from 'node:crypto';
import { constants, existsSync } from 'node:fs';
import {
  access,
  lstat,
  stat as followStat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Flags, type Command } from '@oclif/core';
import { EXIT_CODES } from '@nocobase/agent-protocol';

import { appCliHome, type AppCliConfig } from './config.ts';
import { AppCommand } from './lib/command.ts';
import { findRunCredentials } from './lib/credentials.ts';
import { CliCommandError } from './lib/envelope.ts';
import { withSkillLock } from './skills-lock.ts';

const SKILL = 'nb-studio-cli';
const TOOLS = ['claude', 'codex'] as const;
type Tool = (typeof TOOLS)[number];

export interface SkillsEnvironment {
  readonly packageRoot: string;
  readonly cliVersion: string;
  readonly bin: string;
  readonly stateHome: string;
  readonly home?: string;
  readonly env?: NodeJS.ProcessEnv;
}

interface Target {
  tool: Tool;
  path: string;
}

interface InstalledTarget extends Target {
  cliVersion: string;
  hash: string;
}

interface Registry {
  skill: typeof SKILL;
  targets: InstalledTarget[];
}

export interface SkillStatus extends Target {
  readonly legacy: boolean;
  readonly registered: boolean;
  readonly present: boolean;
  readonly upToDate: boolean;
  readonly installedCliVersion?: string;
  readonly error?: string;
}

export interface SkillsResult {
  readonly skill: string;
  readonly cliVersion: string;
  readonly hash: string;
  readonly targets: readonly SkillStatus[];
}

export interface SkillInstall extends SkillStatus {
  readonly action: 'install' | 'update' | 'unchanged';
}

export interface SkillsInstallResult extends SkillsResult {
  readonly dryRun: boolean;
  readonly targets: readonly SkillInstall[];
}

export interface SkillsSyncResult {
  readonly targets: readonly (Target & {
    action: 'updated' | 'unchanged' | 'failed';
    error?: string;
  })[];
  readonly warnings: readonly string[];
}

function sourceOf(environment: SkillsEnvironment): string {
  return path.resolve(environment.packageRoot, 'skills', SKILL);
}

/** Only packages shipping this Skill expose the two commands. */
export function hasStudioSkill(config: AppCliConfig): boolean {
  return (
    config.selfUpdate !== undefined &&
    existsSync(
      path.join(config.selfUpdate.packageRoot, 'skills', SKILL, 'SKILL.md'),
    )
  );
}

export function skillsEnvironment(config: AppCliConfig): SkillsEnvironment {
  if (config.selfUpdate === undefined)
    throw new Error('This CLI has no packaged Skill.');
  return {
    packageRoot: config.selfUpdate.packageRoot,
    cliVersion: config.version ?? 'unknown',
    bin: config.bin,
    stateHome: appCliHome(config),
  };
}

function locations(environment: SkillsEnvironment): {
  defaults: Target[];
  legacy: Target;
  configs: Record<Tool, string>;
} {
  const home = environment.home ?? os.homedir();
  const env = environment.env ?? process.env;
  const configs = {
    claude: path.resolve(env.CLAUDE_CONFIG_DIR || path.join(home, '.claude')),
    codex: path.resolve(env.CODEX_HOME || path.join(home, '.codex')),
  };
  return {
    configs,
    defaults: [
      { tool: 'claude', path: path.join(configs.claude, 'skills', SKILL) },
      { tool: 'codex', path: path.resolve(home, '.agents', 'skills', SKILL) },
    ],
    legacy: { tool: 'codex', path: path.join(configs.codex, 'skills', SKILL) },
  };
}

async function detected(
  tool: Tool,
  environment: SkillsEnvironment,
): Promise<boolean> {
  const env = environment.env ?? process.env;
  if (env[tool === 'claude' ? 'CLAUDE_CONFIG_DIR' : 'CODEX_HOME']) return true;
  if ((await stat(locations(environment).configs[tool]))?.isDirectory())
    return true;
  const names =
    process.platform === 'win32' ? ['', '.exe', '.cmd', '.bat'] : [''];
  for (const dir of (env.PATH ?? '').split(path.delimiter).filter(Boolean)) {
    for (const suffix of names) {
      const executable = path.join(dir, `${tool}${suffix}`);
      try {
        if (!(await followStat(executable)).isFile()) continue;
        await access(executable, constants.X_OK);
        return true;
      } catch {
        /* An inaccessible executable is not evidence of a usable tool. */
      }
    }
  }
  return false;
}

function selection(tools: readonly string[]): Tool[] {
  if (tools.some((tool) => ![...TOOLS, 'all'].includes(tool)))
    throw new CliCommandError(
      'SKILLS_INVALID_TOOL',
      'Choose --tool claude, codex, or all.',
      { exit: EXIT_CODES.validation },
    );
  return tools.includes('all')
    ? [...TOOLS]
    : TOOLS.filter((tool) => tools.includes(tool));
}

async function stat(
  file: string,
): Promise<Awaited<ReturnType<typeof lstat>> | undefined> {
  try {
    return await lstat(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

// Reject links at every writable component, including a dangling link. We never follow a link to replace its target.
async function safePath(file: string, directory = true): Promise<void> {
  const absolute = path.resolve(file);
  let current = path.parse(absolute).root;
  for (const part of absolute
    .slice(current.length)
    .split(path.sep)
    .filter(Boolean)) {
    current = path.join(current, part);
    const info = await stat(current);
    if (info === undefined) continue;
    if (
      info.isSymbolicLink() ||
      (directory || current !== absolute ? !info.isDirectory() : !info.isFile())
    )
      throw new CliCommandError(
        'SKILLS_UNSAFE_PATH',
        `Refusing a symbolic link or unexpected file type: ${current}`,
        { exit: EXIT_CODES.validation },
      );
  }
}

interface Entry {
  name: string;
  bytes?: Buffer;
}
interface Snapshot {
  entries: Entry[];
  hash: string;
}

async function snapshot(root: string): Promise<Snapshot> {
  await safePath(root);
  const entries: Entry[] = [];
  async function visit(dir: string, relative: string): Promise<void> {
    for (const name of (await readdir(dir)).sort()) {
      const child = path.join(dir, name);
      const rel = relative ? `${relative}/${name}` : name;
      const info = await lstat(child);
      if (info.isDirectory()) {
        entries.push({ name: rel });
        await visit(child, rel);
      } else if (info.isFile()) {
        // O_NOFOLLOW also closes the file-link race between lstat and open on supported platforms.
        const handle = await open(
          child,
          constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
        );
        try {
          entries.push({ name: rel, bytes: await handle.readFile() });
        } finally {
          await handle.close();
        }
      } else
        throw new CliCommandError(
          'SKILLS_UNSAFE_PATH',
          `Refusing a symbolic link or special file inside the Skill: ${child}`,
          { exit: EXIT_CODES.validation },
        );
    }
  }
  await visit(root, '');
  const hash = createHash('sha256')
    .update(
      JSON.stringify(
        entries.map((entry) => [
          entry.name,
          entry.bytes === undefined
            ? 'directory'
            : createHash('sha256').update(entry.bytes).digest('hex'),
        ]),
      ),
    )
    .digest('hex');
  return { entries, hash };
}

async function bundled(environment: SkillsEnvironment): Promise<Snapshot> {
  const result = await snapshot(sourceOf(environment));
  if (
    !result.entries.some(
      (entry) => entry.name === 'SKILL.md' && entry.bytes !== undefined,
    )
  )
    throw new Error('The packaged nb-studio-cli Skill has no SKILL.md.');
  return result;
}

function registryFile(environment: SkillsEnvironment): string {
  return path.resolve(environment.stateHome, 'skills.json');
}

async function readRegistry(environment: SkillsEnvironment): Promise<Registry> {
  const file = registryFile(environment);
  await safePath(file, false);
  if ((await stat(file)) === undefined) return { skill: SKILL, targets: [] };
  const data = JSON.parse(await readFile(file, 'utf8')) as Registry;
  if (
    data === null ||
    typeof data !== 'object' ||
    data.skill !== SKILL ||
    !Array.isArray(data.targets) ||
    data.targets.some(
      (target) =>
        !target ||
        !TOOLS.includes(target.tool) ||
        typeof target.path !== 'string' ||
        !path.isAbsolute(target.path) ||
        path.basename(target.path) !== SKILL ||
        path.basename(path.dirname(target.path)) !== 'skills' ||
        typeof target.cliVersion !== 'string' ||
        typeof target.hash !== 'string',
    )
  )
    throw new CliCommandError(
      'SKILLS_INVALID_REGISTRY',
      `Invalid Skill installation record: ${file}`,
      { exit: EXIT_CODES.validation },
    );
  return data;
}

async function writeRegistry(
  environment: SkillsEnvironment,
  registry: Registry,
): Promise<void> {
  const file = registryFile(environment);
  await safePath(file, false);
  const temporary = await mkdtemp(
    path.join(environment.stateHome, '.skills-record-'),
  );
  try {
    const staged = path.join(temporary, 'skills.json');
    await writeFile(staged, `${JSON.stringify(registry, null, 2)}\n`, {
      mode: 0o600,
    });
    await rename(staged, file);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

async function lock<T>(file: string, work: () => Promise<T>): Promise<T> {
  await safePath(path.dirname(file));
  return withSkillLock(file, work);
}

async function statusOf(
  target: Target,
  environment: SkillsEnvironment,
  source: Snapshot,
  registry: Registry,
): Promise<SkillStatus> {
  const record = registry.targets.find(
    (record) => path.resolve(record.path) === path.resolve(target.path),
  );
  const base = {
    ...target,
    legacy:
      target.tool === 'codex' &&
      target.path !== locations(environment).defaults[1].path,
    registered: record !== undefined,
    ...(record ? { installedCliVersion: record.cliVersion } : {}),
  };
  try {
    await safePath(target.path);
    const present = (await stat(target.path)) !== undefined;
    return {
      ...base,
      present,
      upToDate: present && (await snapshot(target.path)).hash === source.hash,
    };
  } catch (error) {
    return {
      ...base,
      present: (await stat(target.path).catch(() => undefined)) !== undefined,
      upToDate: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function unique(targets: readonly Target[]): Target[] {
  return [
    ...new Map(
      targets.map((target) => {
        const normalized = path.resolve(target.path);
        return [normalized, { ...target, path: normalized }] as const;
      }),
    ).values(),
  ];
}

/** Includes manual and legacy copies, and previously registered paths after environment variables change. */
export async function skillsStatus(
  environment: SkillsEnvironment,
  tools: readonly string[] = [],
): Promise<SkillsResult> {
  const selected = selection(tools);
  const source = await bundled(environment);
  const registry = await readRegistry(environment);
  const { defaults, legacy } = locations(environment);
  const targets = unique([...defaults, legacy, ...registry.targets]).filter(
    (target) => selected.length === 0 || selected.includes(target.tool),
  );
  return {
    skill: SKILL,
    cliVersion: environment.cliVersion,
    hash: source.hash,
    targets: await Promise.all(
      targets.map((target) => statusOf(target, environment, source, registry)),
    ),
  };
}

function overlaps(first: string, second: string): boolean {
  const contains = (a: string, b: string): boolean =>
    b === a || b.startsWith(`${a}${path.sep}`);
  return (
    contains(path.resolve(first), path.resolve(second)) ||
    contains(path.resolve(second), path.resolve(first))
  );
}

// Check the complete plan before replacing any directory: replacing a parent would delete a child Skill.
function targetConflicts(
  targets: readonly Target[],
): Map<string, CliCommandError> {
  const destinations = unique(targets);
  const conflicts = new Map<string, CliCommandError>();
  for (let index = 0; index < destinations.length; index++) {
    const first = destinations[index];
    for (const second of destinations.slice(index + 1)) {
      if (!overlaps(first.path, second.path)) continue;
      const error = new CliCommandError(
        'SKILLS_TARGET_OVERLAP',
        `Skill destinations contain one another: ${first.path} and ${second.path}. Choose separate tool configuration directories before installing.`,
        {
          exit: EXIT_CODES.validation,
          details: { paths: [first.path, second.path] },
        },
      );
      conflicts.set(first.path, error);
      conflicts.set(second.path, error);
    }
  }
  return conflicts;
}

async function replace(
  target: Target,
  environment: SkillsEnvironment,
  source: Snapshot,
  registry: Registry,
): Promise<SkillInstall> {
  if (
    overlaps(target.path, environment.packageRoot) ||
    overlaps(target.path, environment.stateHome)
  )
    throw new CliCommandError(
      'SKILLS_UNSAFE_PATH',
      `The Skill destination overlaps its package or CLI state: ${target.path}`,
      { exit: EXIT_CODES.validation },
    );
  await safePath(target.path);
  const ready = await reusable(target, environment, source, registry);
  if (ready !== undefined) return ready;
  return lock(
    path.join(path.dirname(target.path), '.nb-studio-cli.lock'),
    async () => {
      await safePath(target.path);
      const ready = await reusable(target, environment, source, registry);
      if (ready !== undefined) return ready;
      const before = await statusOf(target, environment, source, registry);
      if (before.error)
        throw new CliCommandError('SKILLS_UNSAFE_PATH', before.error, {
          exit: EXIT_CODES.validation,
        });
      const action = before.upToDate
        ? 'unchanged'
        : before.present
          ? 'update'
          : 'install';
      const record = {
        ...target,
        cliVersion: environment.cliVersion,
        hash: source.hash,
      };
      const next: Registry = {
        skill: SKILL,
        targets: [
          ...registry.targets.filter(
            (item) => path.resolve(item.path) !== path.resolve(target.path),
          ),
          record,
        ],
      };
      if (action === 'unchanged') await writeRegistry(environment, next);
      else {
        const temporary = await mkdtemp(
          path.join(path.dirname(target.path), '.nb-studio-cli-stage-'),
        );
        const staged = path.join(temporary, SKILL);
        const backup = path.join(temporary, 'previous');
        let moved = false;
        let activated = false;
        let committed = false;
        try {
          await mkdir(staged);
          for (const entry of source.entries) {
            const file = path.join(staged, ...entry.name.split('/'));
            if (entry.bytes === undefined) await mkdir(file);
            else await writeFile(file, entry.bytes);
          }
          await safePath(target.path);
          if (before.present) {
            await rename(target.path, backup);
            moved = true;
          }
          await rename(staged, target.path);
          activated = true;
          await writeRegistry(environment, next);
          committed = true;
        } catch (error) {
          try {
            if (activated)
              await rm(target.path, { recursive: true, force: true });
            if (moved) {
              await rename(backup, target.path);
              moved = false;
            }
          } catch (recovery) {
            throw new CliCommandError(
              'SKILLS_RECOVERY_FAILED',
              `Skill replacement failed and recovery needs help. The previous copy is at ${backup}: ${recovery instanceof Error ? recovery.message : String(recovery)}`,
              {
                details: {
                  cause: error instanceof Error ? error.message : String(error),
                  backup,
                },
              },
            );
          }
          throw error;
        } finally {
          // If rollback itself fails, keep the backup for recovery rather than deleting the old copy.
          if (committed || !moved)
            await rm(temporary, { recursive: true, force: true }).catch(
              () => undefined,
            );
        }
      }
      registry.targets = next.targets;
      return {
        ...before,
        action,
        present: true,
        upToDate: true,
        registered: true,
        installedCliVersion: environment.cliVersion,
      };
    },
  );
}

async function reusable(
  target: Target,
  environment: SkillsEnvironment,
  source: Snapshot,
  registry: Registry,
): Promise<SkillInstall | undefined> {
  const record = registry.targets.find(
    (record) => path.resolve(record.path) === path.resolve(target.path),
  );
  if (
    record?.tool !== target.tool ||
    record.hash !== source.hash ||
    record.cliVersion !== environment.cliVersion
  )
    return undefined;
  const status = await statusOf(target, environment, source, registry);
  if (!status.upToDate || status.error) return undefined;
  return { ...status, action: 'unchanged' };
}

/** Replaces only nb-studio-cli and registers successful installations for self-update. */
export async function installSkills(
  environment: SkillsEnvironment,
  tools: readonly string[] = [],
  dryRun = false,
): Promise<SkillsInstallResult> {
  const source = await bundled(environment);
  let selected = selection(tools);
  if (selected.length === 0)
    selected = (
      await Promise.all(
        TOOLS.map(async (tool) =>
          (await detected(tool, environment)) ? tool : undefined,
        ),
      )
    ).filter((tool): tool is Tool => tool !== undefined);
  if (selected.length === 0)
    throw new CliCommandError(
      'SKILLS_NO_TOOL',
      'No Claude Code or Codex installation was detected. Choose a tool explicitly.',
      {
        exit: EXIT_CODES.validation,
        suggestions: TOOLS.map((tool) => ({
          message: `Install for ${tool}.`,
          run: {
            command: environment.bin,
            args: ['skills', 'install', '--tool', tool],
          },
        })),
      },
    );
  const targets = unique(
    locations(environment).defaults.filter((target) =>
      selected.includes(target.tool),
    ),
  );
  const result = (targets: SkillInstall[]): SkillsInstallResult => ({
    skill: SKILL,
    cliVersion: environment.cliVersion,
    hash: source.hash,
    dryRun,
    targets,
  });
  const perform = async (): Promise<SkillsInstallResult> => {
    const registry = await readRegistry(environment);
    const conflict = targetConflicts([...targets, ...registry.targets])
      .values()
      .next().value;
    if (conflict !== undefined) throw conflict;
    const results: SkillInstall[] = [];
    for (const target of targets) {
      if (
        overlaps(target.path, environment.packageRoot) ||
        overlaps(target.path, environment.stateHome)
      )
        throw new CliCommandError(
          'SKILLS_UNSAFE_PATH',
          `The Skill destination overlaps its package or CLI state: ${target.path}`,
          { exit: EXIT_CODES.validation },
        );
      if (dryRun) {
        const status = await statusOf(target, environment, source, registry);
        if (status.error)
          throw new CliCommandError('SKILLS_UNSAFE_PATH', status.error, {
            exit: EXIT_CODES.validation,
          });
        results.push({
          ...status,
          action: status.upToDate
            ? 'unchanged'
            : status.present
              ? 'update'
              : 'install',
        });
      } else results.push(await replace(target, environment, source, registry));
    }
    return result(results);
  };
  if (!dryRun) {
    const registry = await readRegistry(environment);
    const conflict = targetConflicts([...targets, ...registry.targets])
      .values()
      .next().value;
    if (conflict !== undefined) throw conflict;
    const ready = await Promise.all(
      targets.map(async (target) => {
        if (
          overlaps(target.path, environment.packageRoot) ||
          overlaps(target.path, environment.stateHome)
        )
          return undefined;
        return reusable(target, environment, source, registry);
      }),
    );
    if (ready.every((target) => target !== undefined)) return result(ready);
  }
  return dryRun
    ? perform()
    : lock(path.join(environment.stateHome, '.skills.lock'), perform);
}

/** Preserve native Skill installation for the tools with a managed destination. */
export async function prepareSessionSkill(
  environment: SkillsEnvironment,
  agentId: string,
): Promise<void> {
  if (TOOLS.some((tool) => tool === agentId))
    await installSkills(environment, [agentId]);
}

/** ACP text is the common fallback; it needs no agent-specific install directory. */
export async function sessionSkillInstructions(
  environment: SkillsEnvironment,
  agentId: string,
): Promise<string | undefined> {
  if (TOOLS.some((tool) => tool === agentId)) return undefined;
  try {
    const source = await bundled(environment);
    const skill = source.entries.find((entry) => entry.name === 'SKILL.md')!;
    const text = skill.bytes!.toString('utf8');
    if (!text.trim()) throw new Error('The packaged Skill is empty.');
    return [
      '# Studio session instructions',
      'The shared nb-studio-cli Skill is supplied below for this session. Follow it directly; no Skill installation is needed.',
      `Resolve any relative Skill references from ${sourceOf(environment)}.`,
      'Keep the bridge-selected profile and agent session environment. Do not switch identity or remove session context to bypass a refusal.',
      text,
      '# Current message',
    ].join('\n\n');
  } catch (cause) {
    throw new Error(
      `Could not load the packaged nb-studio-cli instructions. Update or reinstall ${environment.bin}, then restart the bridge and resend the message.`,
      { cause },
    );
  }
}

/** Called after CLI activation, reading the new package. Failures are warnings, never CLI update failures. */
export async function syncInstalledSkills(
  environment: SkillsEnvironment,
): Promise<SkillsSyncResult> {
  const warnings: string[] = [];
  const targets: (Target & {
    action: 'updated' | 'unchanged' | 'failed';
    error?: string;
  })[] = [];
  const advise = (message: string): void => {
    warnings.push(
      `${message} Run \`${environment.bin} skills install\` (use --tool claude or --tool codex to select explicitly).`,
    );
  };
  try {
    // Do not create state or tool directories on machines that never installed this Skill.
    const registry = await readRegistry(environment);
    const { defaults, legacy } = locations(environment);
    for (const target of unique([...defaults, legacy])) {
      try {
        if (
          (await stat(target.path)) !== undefined &&
          !registry.targets.some(
            (record) => path.resolve(record.path) === path.resolve(target.path),
          )
        )
          advise(
            `An unregistered nb-studio-cli copy at ${target.path} was left unchanged.`,
          );
      } catch (error) {
        advise(
          `Could not inspect the Skill location ${target.path}: ${error instanceof Error ? error.message : String(error)}.`,
        );
      }
    }
    if (registry.targets.length > 0)
      await lock(path.join(environment.stateHome, '.skills.lock'), async () => {
        const current = await readRegistry(environment);
        const destinations = unique(current.targets);
        const conflicts = targetConflicts(destinations);
        // Read the new source inside each attempt so every registered target has a failure result if it is missing.
        for (const target of destinations) {
          try {
            const conflict = conflicts.get(target.path);
            if (conflict !== undefined) throw conflict;
            const result = await replace(
              target,
              environment,
              await bundled(environment),
              current,
            );
            targets.push({
              tool: target.tool,
              path: target.path,
              action: result.action === 'unchanged' ? 'unchanged' : 'updated',
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            targets.push({
              tool: target.tool,
              path: target.path,
              action: 'failed',
              error: message,
            });
            advise(
              `Could not update nb-studio-cli at ${target.path}: ${message}.`,
            );
          }
        }
      });
  } catch (error) {
    advise(
      `Could not synchronize installed Skills: ${error instanceof Error ? error.message : String(error)}.`,
    );
  }
  return { targets, warnings };
}

export function skillsCommands(
  app: AppCliConfig,
): Record<string, Command.Class> {
  const flags = {
    tool: Flags.string({
      description:
        'Choose claude, codex, or all; repeat to choose multiple tools.',
      options: ['claude', 'codex', 'all'],
      multiple: true,
    }),
  };
  class Install extends AppCommand {
    protected override toSuccessJson(result: unknown): unknown {
      return super.toSuccessJson({ data: result });
    }
    static override summary =
      'Install the packaged nb-studio-cli Skill in local agent tools.';
    static override supportsDryRun = true;
    static override flags = flags;
    async run(): Promise<SkillsInstallResult> {
      const { flags } = await this.parse(Install);
      if (findRunCredentials(process.cwd(), app) !== undefined)
        throw new CliCommandError(
          'SKILLS_RUN_FORBIDDEN',
          'The runner already supplies this Skill. Install it outside an agent run.',
          { exit: EXIT_CODES.auth },
        );
      const result = await installSkills(
        skillsEnvironment(app),
        flags.tool,
        this.dryRun,
      );
      for (const target of result.targets)
        this.log(
          `${this.dryRun ? 'Would ' : ''}${target.action}: ${target.tool} ${target.path}`,
        );
      return result;
    }
  }
  class Status extends AppCommand {
    protected override toSuccessJson(result: unknown): unknown {
      return super.toSuccessJson({ data: result });
    }
    static override summary =
      'Compare local nb-studio-cli copies with the packaged Skill.';
    static override flags = flags;
    async run(): Promise<SkillsResult> {
      const { flags } = await this.parse(Status);
      const result = await skillsStatus(skillsEnvironment(app), flags.tool);
      for (const target of result.targets)
        this.log(
          `${target.tool} ${target.path}: ${target.error ?? (target.present ? (target.upToDate ? 'up to date' : 'outdated') : 'not installed')}${target.legacy ? ' (legacy)' : ''}${target.registered ? ' (registered)' : ''}`,
        );
      return result;
    }
  }
  return { 'skills:install': Install, 'skills:status': Status };
}
