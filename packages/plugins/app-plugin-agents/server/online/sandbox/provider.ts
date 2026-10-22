import { randomUUID } from 'node:crypto';
import { HEADERS } from '@nocobase/agent-protocol';
import type { OnlineAgentCredentials } from '../../cli/online-credential.js';
import { callerIdentityOf } from '../../cli/run-credential.js';
import {
  Bash,
  getCommandNames,
  type Command,
  type CommandName,
  type ExecResult,
} from '../../vendor/just-bash.js';
import type { SkillService } from '../../core/skills/skill.service.js';
import type {
  OnlineAgentSandboxProvider,
  OnlineAgentSandboxInput,
  OnlineAgentSandbox,
  OnlineAgentSandboxPreparation,
  CommandSurface,
  OnlineAgentSandboxOptions,
} from './types.js';
import { createSandboxFilesystem } from './filesystem.js';
import { loadSkills } from './skills.js';
import { cliCommand } from './cli-command.js';
import { sandboxLimits, clip } from './limits.js';

type SandboxDependencies = OnlineAgentSandboxOptions & { skills: SkillService };
type SkillResources = Awaited<ReturnType<typeof loadSkills>>;
type SandboxFilesystem = ReturnType<typeof createSandboxFilesystem>;
type CredentialLease = ReturnType<OnlineAgentCredentials['issue']>;
type ShellResult = Awaited<ReturnType<OnlineAgentSandbox['exec']>>;

/** Prepare Skills without credentials; own the CLI lease only while a Sandbox exists. */
export function createSandboxProvider(
  deps: SandboxDependencies,
): OnlineAgentSandboxProvider {
  return {
    prepare: (input) => prepareSandbox(deps, input),
  };
}

async function prepareSandbox(
  deps: SandboxDependencies,
  input: OnlineAgentSandboxInput,
): Promise<OnlineAgentSandboxPreparation> {
  input.context.signal.throwIfAborted();
  const loaded = await loadSkills(deps.skills, input.skill, deps.builtinSkills);
  return new PreparedSandbox(deps, input, loaded);
}

/** The selected Skill snapshot exists before any filesystem, CLI or credential is allocated. */
class PreparedSandbox implements OnlineAgentSandboxPreparation {
  readonly instructions: string;
  private released = false;

  constructor(
    private readonly deps: SandboxDependencies,
    private readonly input: OnlineAgentSandboxInput,
    private readonly loaded: SkillResources,
  ) {
    this.instructions = this.sandboxInstructions(deps.bin?.());
  }

  sandboxInstructions(bin?: string): string {
    return [
      'Virtual shell: /tmp is the only writable directory; /skills is read-only. No host files, environment, network or external runtimes.',
      bin
        ? 'Application CLI: ' +
          bin +
          '. Use --help to discover current commands. Authorization and business rules apply; never retry an uncertain write without checking its result.'
        : 'No application CLI is configured.',
      'Selected skills (read with skill or cat only when needed):',
      ...[...this.loaded.skills].map(
        ([slug, skill]) =>
          slug + ': ' + skill.description + ' (/skills/' + slug + '/SKILL.md)',
      ),
    ].join('\n');
  }

  readSkill(name: string): Promise<{ ok: boolean; output: string }> {
    if (this.released) return Promise.reject(new Error('Execution is closed.'));
    this.input.context.signal.throwIfAborted();
    const skill = this.loaded.skills.get(name);
    return Promise.resolve({
      ok: !!skill,
      output: skill
        ? clip([skill.markdown, 'Support files:', ...skill.listing].join('\n'))
        : 'Unknown selected skill.',
    });
  }

  async create(): Promise<OnlineAgentSandbox> {
    if (this.released) throw new Error('Execution is closed.');
    this.input.context.signal.throwIfAborted();
    const filesystem = createSandboxFilesystem(
      this.loaded.files,
      undefined,
      this.loaded.unreadable,
    );
    // InMemoryFs owns the mounted storage; do not retain a second file map.
    this.clearFiles();
    return createSandbox(this, this.deps, this.input, filesystem);
  }

  close(): void {
    this.released = true;
  }

  dispose(): void {
    this.close();
    this.loaded.skills.clear();
    this.clearFiles();
  }

  private clearFiles(): void {
    for (const path of Object.keys(this.loaded.files))
      delete this.loaded.files[path];
  }
}

/** Creation owns partial-resource cleanup, including failures before a shell is returned. */
async function createSandbox(
  preparation: PreparedSandbox,
  deps: SandboxDependencies,
  input: OnlineAgentSandboxInput,
  filesystem: SandboxFilesystem,
): Promise<OnlineAgentSandbox> {
  let lease: CredentialLease | undefined;
  try {
    const application = deps.cli?.();
    let surface: CommandSurface | undefined;
    if (application) {
      lease = application.credentials.issue(
        input.context.user.id,
        input.executionId ?? randomUUID(),
      );
      surface = await loadCommandSurface(application, lease.token);
    }
    return new SandboxExecution(preparation, input, filesystem, surface, lease);
  } catch (error) {
    try {
      await filesystem.dispose();
    } finally {
      lease?.release();
    }
    throw error;
  }
}

async function loadCommandSurface(
  application: ReturnType<NonNullable<OnlineAgentSandboxOptions['cli']>>,
  token: string,
): Promise<CommandSurface | undefined> {
  const session = await application.auth.getSession(
    new Headers({ [HEADERS.runToken]: token }),
  );
  const identity = callerIdentityOf(session ?? undefined);
  if (!identity) throw new Error('OnlineAgent caller is unavailable.');
  const surface = await application.commandsOf(identity, token);
  if (surface && !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/u.test(surface.bin))
    throw new Error('Invalid application CLI brand.');
  return surface;
}

function createBash(filesystem: SandboxFilesystem, command?: Command): Bash {
  return new Bash({
    fs: filesystem.fs,
    cwd: '/tmp',
    env: { HOME: '/tmp' },
    executionLimitProfile: 'hardened',
    commands: getCommandNames().filter(
      (name): name is CommandName => name !== 'sqlite3',
    ),
    python: false,
    javascript: false,
    customCommands: command ? [command] : [],
    executionLimits: {
      maxOutputSize: sandboxLimits.shellOutput,
      maxExecutionTimeMs: sandboxLimits.durationMs,
    },
  });
}

function shellResult(result: ExecResult): ShellResult {
  return {
    ok: result.exitCode === 0,
    output: clip(
      [
        'exit code ' + result.exitCode,
        result.stdout ? result.stdout.replace(/\n$/u, '') : '',
        result.stderr ? '[stderr]\n' + result.stderr.replace(/\n$/u, '') : '',
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    exitCode: result.exitCode,
  };
}

/** Own serialized shell calls, real CLI work and retryable cleanup for one execution. */
class SandboxExecution implements OnlineAgentSandbox {
  readonly instructions: string;
  private readonly bash: Bash;
  private readonly abort = new AbortController();
  private readonly work = new Set<Promise<unknown>>();
  private queue: Promise<unknown> = Promise.resolve();
  private cleanup: Promise<void> | undefined;
  private closed = false;

  constructor(
    private readonly preparation: PreparedSandbox,
    private readonly input: OnlineAgentSandboxInput,
    private readonly filesystem: SandboxFilesystem,
    surface?: CommandSurface,
    private readonly lease?: CredentialLease,
  ) {
    const cli = surface ? cliCommand(surface, input.context.signal) : undefined;
    this.bash = createBash(
      filesystem,
      cli ? this.trackCommand(cli) : undefined,
    );
    filesystem.lock();
    this.instructions = preparation.sandboxInstructions(surface?.bin);
  }

  private trackCommand(command: Command): Command {
    return {
      ...command,
      execute: (args, ctx) => {
        // Bash can detach a cancelled command; keep owning its actual application work.
        const task = command.execute(args, ctx);
        this.work.add(task);
        void task.finally(() => this.work.delete(task)).catch(() => {});
        return task;
      },
    };
  }

  exec(
    command: string,
    options: Parameters<OnlineAgentSandbox['exec']>[1],
  ): Promise<ShellResult> {
    if (this.closed) return Promise.reject(new Error('Sandbox is closed.'));
    // The deadline includes time spent waiting in the queue.
    const deadline = AbortSignal.timeout(sandboxLimits.durationMs);
    const signal = AbortSignal.any([
      this.input.context.signal,
      this.abort.signal,
      deadline,
      ...(options.abortSignal ? [options.abortSignal] : []),
    ]);
    const task = this.queue
      .catch(() => {})
      .then(() => this.run(command, signal));
    this.queue = task;
    return task;
  }

  private async run(
    command: string,
    signal: AbortSignal,
  ): Promise<ShellResult> {
    signal.throwIfAborted();
    try {
      return shellResult(await this.bash.exec(command, { signal }));
    } catch (error) {
      signal.throwIfAborted();
      return {
        ok: false,
        output: clip(
          error instanceof Error ? error.message : 'Virtual shell failed.',
        ),
        exitCode: 1,
      };
    } finally {
      // Cancellation must not release the execution gate before real CLI work exits.
      await Promise.allSettled([...this.work]);
      signal.throwIfAborted();
    }
  }

  readSkill(name: string): Promise<{ ok: boolean; output: string }> {
    if (this.closed) return Promise.reject(new Error('Sandbox is closed.'));
    return this.preparation.readSkill(name);
  }

  dispose(): Promise<void> {
    if (this.cleanup) return this.cleanup;
    this.closed = true;
    this.preparation.close();
    this.abort.abort();
    this.cleanup = this.releaseResources().catch((error: unknown) => {
      // A failed cleanup is retryable, but never reopens this execution.
      this.cleanup = undefined;
      throw error;
    });
    return this.cleanup;
  }

  private async releaseResources(): Promise<void> {
    await this.queue.catch(() => {});
    await Promise.allSettled([...this.work]);
    await this.filesystem.dispose();
    this.preparation.dispose();
    this.lease?.release();
  }
}
