/**
 * An online run's two tools: `skill`, which reads one of the run's skills (its SKILL.md and its file tree), and `bash`,
 * a shell (`just-bash`, in process, no real processes) over a filesystem of the run's skills at `/skills/<slug>/`, the
 * layout runners use. The skills are read-only; `/tmp` takes a little scratch (for a body file to pass to the CLI). The
 * application's CLI is a command there (`cli-command.ts`): the run reaches the application through it, nothing else.
 *
 * Bounded: no network, a deadline per command, the output cut to what the model reads, at most `MOUNT_MAX_BYTES` of
 * skill text mounted per run. Binary files are listed but not readable, and so is text past the mount's cap; a script
 * is read, never run for real.
 */
import {
  Bash,
  getCommandNames,
  InMemoryFs,
  type CustomCommand,
  type IFileSystem,
} from '../vendor/just-bash.js';

import type { SkillSnapshot } from '../core/skills/index.js';
import { clip, type ServerTool } from './tools.js';

/** Skill text mounted in one run's shell. */
export const MOUNT_MAX_BYTES: number = 5 * 1024 * 1024;
/** Scratch space under `/tmp`. */
export const SCRATCH_MAX_BYTES: number = 1024 * 1024;
/** How long one `bash` call may run. */
export const COMMAND_TIMEOUT_MS: number = 10_000;

/** One of the run's skills, as its shell mounts it. */
export interface OnlineSkill extends SkillSnapshot {
  readonly name: string;
  readonly description: string;
}

const MUTATORS = new Set([
  'writeFile',
  'appendFile',
  'mkdir',
  'rm',
  'cp',
  'mv',
  'chmod',
  'symlink',
  'link',
  'utimes',
  'createExclusive',
  'writeFileSync',
  'writeFileLazy',
]);

class FsError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const inScratch = (path: unknown): boolean =>
  typeof path === 'string' && (path === '/tmp' || path.startsWith('/tmp/'));

/**
 * `inner`, writable only under `/tmp` once `lock()` is called; the paths in `unreadable` refuse to be read, with the
 * reason the bash tool reports.
 */
function guardedFs(
  inner: InMemoryFs,
  unreadable: ReadonlyMap<string, string>,
): { fs: IFileSystem; lock: () => void } {
  let locked = false;
  const fs = new Proxy(inner, {
    get(target, property, receiver) {
      const value: unknown = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      const name = String(property);
      if (MUTATORS.has(name))
        return (...args: unknown[]) => {
          // `cp` and `mv` write their second argument.
          const written = name === 'cp' || name === 'mv' ? args[1] : args[0];
          const touched = name === 'mv' ? [args[0], args[1]] : [written];
          if (locked && !touched.every(inScratch))
            throw new FsError(
              'EROFS',
              `EROFS: read-only file system, ${name} '${String(written)}'`,
            );
          return (value as (...a: unknown[]) => unknown).apply(target, args);
        };
      if (
        name === 'readFile' ||
        name === 'readFileBuffer' ||
        name === 'readFileBytes'
      )
        return (path: string, ...rest: unknown[]) => {
          const reason = unreadable.get(path);
          if (reason) throw new FsError('EACCES', reason);
          return (value as (...a: unknown[]) => unknown).apply(target, [
            path,
            ...rest,
          ]);
        };
      return (value as (...a: unknown[]) => unknown).bind(target);
    },
  }) as unknown as IFileSystem;
  return {
    fs,
    lock: () => {
      locked = true;
    },
  };
}

/** The run's shell: its skills mounted at `/skills/<slug>/`, its CLI among the commands. */
export function createSandbox(
  skills: readonly OnlineSkill[],
  commands: readonly CustomCommand[] = [],
): { readonly bash: Bash; readonly unreadable: ReadonlyMap<string, string> } {
  const inner = new InMemoryFs(
    {},
    { maxTotalBytes: MOUNT_MAX_BYTES + SCRATCH_MAX_BYTES + 1024 * 1024 },
  );
  const unreadable = new Map<string, string>();
  let mounted = 0;
  for (const skill of skills) {
    const root = `/skills/${skill.slug}`;
    mounted += Buffer.byteLength(skill.markdown, 'utf8');
    inner.writeFileSync(`${root}/SKILL.md`, skill.markdown);
    for (const file of skill.files) {
      const path = `${root}/${file.path}`;
      const mode = file.executable ? 0o755 : 0o644;
      if (file.text === null) {
        inner.writeFileSync(path, '', undefined, { mode });
        unreadable.set(
          path,
          `${path} is a binary file (${file.size} bytes): it is listed but cannot be read here.`,
        );
        continue;
      }
      if (mounted + file.size > MOUNT_MAX_BYTES) {
        inner.writeFileSync(path, '', undefined, { mode });
        unreadable.set(
          path,
          `${path} is past the ${MOUNT_MAX_BYTES / 1024 / 1024} MB of skill text a run mounts: it cannot be read here.`,
        );
        continue;
      }
      mounted += file.size;
      inner.writeFileSync(path, file.text, undefined, { mode });
    }
  }
  inner.writeFileSync('/tmp/.keep', '');
  const { fs, lock } = guardedFs(inner, unreadable);
  const bash = new Bash({
    fs,
    cwd: '/tmp',
    env: { HOME: '/tmp' },
    executionLimitProfile: 'hardened',
    executionLimits: {
      maxExecutionTimeMs: COMMAND_TIMEOUT_MS,
      maxOutputSize: 1024 * 1024,
    },
    // No SQLite worker in a read-only shell; no network, Python or JavaScript (all off unless asked for).
    commands: getCommandNames().filter((name) => name !== 'sqlite3'),
    customCommands: [...commands],
  });
  lock();
  return { bash, unreadable };
}

function describeTree(skill: OnlineSkill): string {
  const lines = skill.files.map((file) => {
    const notes = [
      `${file.size} bytes`,
      file.text === null ? 'binary, not readable here' : '',
      file.executable || file.path.startsWith('scripts/')
        ? 'script, cannot be run here'
        : '',
    ].filter(Boolean);
    return `- /skills/${skill.slug}/${file.path} (${notes.join(', ')})`;
  });
  return [
    `Files of ${skill.slug} (read them with \`cat\` in the bash tool):`,
    `- /skills/${skill.slug}/SKILL.md`,
    ...lines,
  ].join('\n');
}

/** The `skill` and `bash` tools of an online run. */
export function onlineTools(
  skills: readonly OnlineSkill[],
  commands: readonly CustomCommand[] = [],
): ServerTool[] {
  let sandbox: ReturnType<typeof createSandbox> | undefined;
  const shell = () => (sandbox ??= createSandbox(skills, commands));
  const names = skills.map((skill) => skill.slug);
  const tools: ServerTool[] = [];
  if (skills.length > 0)
    tools.push({
      spec: {
        name: 'skill',
        description:
          'Read one of your skills: its SKILL.md and the list of its files, which you read with the bash tool. Read a skill when its description matches what you are doing, and follow it.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              enum: names,
              description: "The skill's name.",
            },
          },
          required: ['name'],
          additionalProperties: false,
        },
      },
      invoke(args) {
        const name =
          args && typeof args === 'object'
            ? (args as Record<string, unknown>).name
            : undefined;
        const skill = skills.find((item) => item.slug === name);
        if (!skill)
          return Promise.resolve({
            ok: false,
            output: `There is no skill ${String(name)}. Your skills: ${names.join(', ')}.`,
          });
        return Promise.resolve({
          ok: true,
          output: clip(`${skill.markdown}\n\n${describeTree(skill)}`),
        });
      },
    });
  tools.push({
    spec: {
      name: 'bash',
      description: [
        'Run a shell command in your sandbox (bash syntax; ls, cat, grep, find, sed, awk, jq and the like).',
        commands.length > 0
          ? `Reach the application with its command line: \`${commands.map((command) => command.name).join('`, `')} --help\`.`
          : '',
        skills.length > 0
          ? 'Your skills are at /skills/<name>/, read-only.'
          : '',
        `Write scratch files under /tmp only (at most ${SCRATCH_MAX_BYTES / 1024 / 1024} MB). No network; nothing is installed or run for real, so a skill's scripts cannot be executed. Each command stops after ${COMMAND_TIMEOUT_MS / 1000} seconds.`,
      ]
        .filter(Boolean)
        .join(' '),
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The command line.' },
        },
        required: ['command'],
        additionalProperties: false,
      },
    },
    async invoke(args) {
      const command =
        args && typeof args === 'object'
          ? (args as Record<string, unknown>).command
          : undefined;
      if (typeof command !== 'string' || !command.trim())
        return { ok: false, output: 'Give the command to run as `command`.' };
      const { bash, unreadable } = shell();
      let stdout = '';
      let stderr = '';
      let exitCode: number;
      try {
        const result = await bash.exec(command);
        ({ stdout, stderr, exitCode } = result);
      } catch (error) {
        stderr = error instanceof Error ? error.message : String(error);
        exitCode = 1;
      }
      // just-bash reports any unreadable file as missing: say why.
      const notes = [...unreadable]
        .filter(([path]) => {
          const base = path.split('/').pop() ?? path;
          return stderr.includes(base) && !stdout.includes(path);
        })
        .map(([, reason]) => reason);
      const parts = [
        `exit code ${exitCode}`,
        stdout ? stdout.replace(/\n$/u, '') : '',
        stderr ? `[stderr]\n${stderr.replace(/\n$/u, '')}` : '',
        ...notes.map((note) => `[note] ${note}`),
      ].filter(Boolean);
      return { ok: exitCode === 0, output: clip(parts.join('\n')) };
    },
  });
  return tools;
}
