import {
  Bash,
  getCommandNames,
  type Command,
  type CommandName,
} from 'just-bash';
import type { SkillService } from '../../core/skills/skill.service.js';
import type {
  OnlineAgentSandboxProvider,
  OnlineAgentSandboxInput,
  OnlineAgentSandbox,
  OnlineAgentSandboxPreparation,
  CommandSurface,
  OnlineAgentSandboxSkillCatalog,
} from './types.js';
import { createSandboxFilesystem } from './filesystem.js';
import { loadSkills, sandboxInstructions } from './skills.js';
import { cliCommand } from './cli-command.js';
import { sandboxLimits, clip } from './limits.js';

export function createSandboxProvider(deps: {
  skills: SkillService;
  builtinSkills?: OnlineAgentSandboxSkillCatalog;
  bin?: () => string | undefined;
  commandsOf?: (
    input: OnlineAgentSandboxInput,
  ) => Promise<CommandSurface | undefined>;
}): OnlineAgentSandboxProvider {
  const prepare = async (
    input: OnlineAgentSandboxInput,
  ): Promise<OnlineAgentSandboxPreparation> => {
    input.context.signal.throwIfAborted();
    const loaded = await loadSkills(
      deps.skills,
      input.skill,
      deps.builtinSkills,
    );
    let released = false;
    const readSkill = (name: string) => {
      if (released) return Promise.reject(new Error('Execution is closed.'));
      input.context.signal.throwIfAborted();
      const skill = loaded.skills.get(name);
      return Promise.resolve({
        ok: !!skill,
        output: skill
          ? clip(
              [skill.markdown, 'Support files:', ...skill.listing].join('\n'),
            )
          : 'Unknown selected skill.',
      });
    };
    return {
      instructions: sandboxInstructions(loaded, deps.bin?.()),
      readSkill,
      dispose() {
        released = true;
        loaded.skills.clear();
        for (const path of Object.keys(loaded.files)) delete loaded.files[path];
      },
      async create(): Promise<OnlineAgentSandbox> {
        if (released) throw new Error('Execution is closed.');
        input.context.signal.throwIfAborted();
        const filesystem = createSandboxFilesystem(
          loaded.files,
          undefined,
          loaded.unreadable,
        );
        // InMemoryFs owns the mounted storage; do not retain a second file map after disposal.
        for (const path of Object.keys(loaded.files)) delete loaded.files[path];
        const work = new Set<Promise<unknown>>();
        const track = (task: Promise<unknown>) => {
          work.add(task);
          void task.finally(() => work.delete(task)).catch(() => {});
        };
        try {
          const surface = await deps.commandsOf?.(input);
          if (surface && !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/u.test(surface.bin))
            throw new Error('Invalid application CLI brand.');
          const cli = surface
            ? cliCommand(surface, input.context.signal)
            : undefined;
          const customCommands: Command[] = cli
            ? [
                {
                  ...cli,
                  execute(args, ctx) {
                    // Own real application work even when Bash detaches a cancelled command.
                    const task = cli.execute(args, ctx);
                    track(task);
                    return task;
                  },
                },
              ]
            : [];
          const abort = new AbortController();
          let closed = false;
          let queue: Promise<unknown> = Promise.resolve();
          let cleanup: Promise<void> | undefined;
          const bash = new Bash({
            fs: filesystem.fs,
            cwd: '/tmp',
            env: { HOME: '/tmp' },
            executionLimitProfile: 'hardened',
            commands: getCommandNames().filter(
              (name): name is CommandName => name !== 'sqlite3',
            ),
            python: false,
            javascript: false,
            customCommands,
            executionLimits: {
              maxOutputSize: sandboxLimits.shellOutput,
              maxExecutionTimeMs: sandboxLimits.durationMs,
            },
          });
          filesystem.lock();
          return {
            instructions: sandboxInstructions(loaded, surface?.bin),
            exec(command, options) {
              if (closed)
                return Promise.reject(new Error('Sandbox is closed.'));
              const deadline = AbortSignal.timeout(sandboxLimits.durationMs);
              const signal = AbortSignal.any([
                input.context.signal,
                abort.signal,
                deadline,
                ...(options.abortSignal ? [options.abortSignal] : []),
              ]);
              const task = queue
                .catch(() => {})
                .then(async () => {
                  signal.throwIfAborted();
                  try {
                    const result = await bash.exec(command, { signal });
                    return {
                      ok: result.exitCode === 0,
                      output: clip(
                        [
                          'exit code ' + result.exitCode,
                          result.stdout
                            ? result.stdout.replace(/\n$/u, '')
                            : '',
                          result.stderr
                            ? '[stderr]\n' + result.stderr.replace(/\n$/u, '')
                            : '',
                        ]
                          .filter(Boolean)
                          .join('\n'),
                      ),
                      exitCode: result.exitCode,
                    };
                  } catch (error) {
                    signal.throwIfAborted();
                    return {
                      ok: false,
                      output: clip(
                        error instanceof Error
                          ? error.message
                          : 'Virtual shell failed.',
                      ),
                      exitCode: 1,
                    };
                  } finally {
                    // Cancellation of the shell must not detach the actual in-process application work.
                    await Promise.allSettled([...work]);
                    signal.throwIfAborted();
                  }
                });
              queue = task;
              return task;
            },
            readSkill(name) {
              if (closed)
                return Promise.reject(new Error('Sandbox is closed.'));
              return readSkill(name);
            },
            dispose() {
              if (cleanup) return cleanup;
              closed = true;
              released = true;
              abort.abort();
              cleanup = (async () => {
                await queue.catch(() => {});
                await Promise.allSettled([...work]);
                await filesystem.dispose();
                loaded.skills.clear();
                for (const path of Object.keys(loaded.files))
                  delete loaded.files[path];
              })().catch((error: unknown) => {
                cleanup = undefined;
                throw error;
              });
              return cleanup;
            },
          };
        } catch (error) {
          await Promise.allSettled([...work]);
          await filesystem.dispose();
          throw error;
        }
      },
    };
  };
  return {
    prepare,
    async create(input) {
      const prepared = await prepare(input);
      try {
        return await prepared.create();
      } catch (error) {
        prepared.dispose();
        throw error;
      }
    },
  };
}
