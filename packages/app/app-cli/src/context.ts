// `AppCommand`: the base class of every command that acts on an application — this package's own, an application's,
// and a plugin's.
//
// It gives a command three things and keeps the rest to itself. `rootDir` is the application the runner located.
// `withApp()` hands over a created application and always puts it away again. And the output contract: a command
// returns its result or throws `CommandError`, and `--json` turns either into the one document
// `@nocobase/cli-envelope` defines. Loading a runtime by hand is deliberately not on the class, so there is nothing to
// forget to close.
import path from 'node:path';
import { format } from 'node:util';

import type { Application } from '@nocobase/app-server';
import type { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import { Command, ux } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

import {
  commandFailureJson,
  commandSuccessJson,
  isCommandEnvelope,
  type CommandFailureJson,
  type CommandSuccessJson,
  type CommandSuccessStatus,
} from '@nocobase/cli-envelope';
import {
  debugEnabled,
  describeForDebugging,
  markDiagnosed,
} from './command/diagnostics.ts';
import {
  CommandError,
  describeCommandError,
  isCommandError,
} from './command/errors.ts';
import { declaredFlags, isAppPathFlag } from './command/flags.ts';
import { nocobaseCommand } from './command/invocation.ts';
import { withAppInstance } from './command/lifecycle.ts';
import {
  INVALID_USAGE,
  describeUsageError,
  usageContextFor,
} from './command/usage.ts';
import { createDefaultCommandContext } from './default-context.ts';
import { applicationState } from './runtime/command-store.ts';

// oclif constrains `parse()` with this record type but does not export it; repeating it keeps the override below
// identical to the method it replaces.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParserRecord = { [name: string]: any };

export type AppCommandRuntime = Awaited<
  ReturnType<typeof resolveStandaloneAppRuntime>
>;

/** How a command reaches its application. Internal: commands use `rootDir` and `withApp()`. */
export interface AppCommandContext {
  readonly createApp: (
    runtime: AppCommandRuntime,
  ) => Application | Promise<Application>;
  readonly rootDir: string;
  readonly loadRuntime: () => Promise<AppCommandRuntime>;
}

/** The environment the application resolved: `process.env` with `.env` files applied. */
export type AppCommandEnv = AppCommandRuntime['env'];

/** What `withApp()` hands its callback. */
export interface AppCommandApp {
  readonly app: Application;
  readonly env: AppCommandEnv;
}

/** The static slot `bindAppCommand()` pins a context into. */
export const PINNED_APP_CONTEXT: unique symbol = Symbol.for(
  '@nocobase/app-cli.pinnedAppContext',
);

interface PinnableCommand {
  [PINNED_APP_CONTEXT]?: AppCommandContext;
}

/**
 * The context an `AppCommand` acts on: the one a test pinned, otherwise the application the runner located.
 * Internal to this package; built-in commands that need a runtime without an application use it.
 */
export function appContextOf(command: AppCommand): AppCommandContext {
  const pinned = (command.constructor as PinnableCommand)[PINNED_APP_CONTEXT];
  if (pinned) return pinned;
  let location;
  try {
    ({ location } = applicationState());
  } catch {
    throw new Error(
      'AppCommand needs the application the runner located. In a test, bind it with bindAppCommand() from @nocobase/app-cli/testing.',
    );
  }
  if (location.kind === 'none') {
    throw new Error(
      `${location.root} is not a NocoBase application: no package.json above it declares nocobase.templateKind or nocobase.buildTarget. Run the command inside the application, or set NOCOBASE_APP_ROOT to its directory.`,
    );
  }
  return createDefaultCommandContext({ rootDir: location.root });
}

/**
 * A command that acts on the application the CLI runs in.
 *
 * `run()` returns the command's result and throws `CommandError` on failure. Under `--json` the result or the error
 * becomes the one document on stdout; otherwise the command prints for people with `this.log`, and a failure is
 * printed with its suggestions. Do not call `exit()`, `logJson()` or `console.log`: each would put something on stdout
 * that the document does not account for.
 */
export class AppCommand extends Command {
  static override enableJsonFlag: boolean = true;

  #status: CommandSuccessStatus = 'success';
  readonly #warnings: string[] = [];
  #printed = false;

  override async run(): Promise<unknown> {
    throw new Error('No application command implementation was selected.');
  }

  /** The application root the runner located. Synchronous and free: nothing is loaded. */
  protected get rootDir(): string {
    return appContextOf(this).rootDir;
  }

  /**
   * Creates the application, runs `fn`, then shuts the application down and destroys its runtime — whether `fn`
   * returns or throws. The application is created, not started: call `app.registerProviders()` to resolve services, or
   * `app.start()` only when the command needs the full lifecycle. `app` is valid only inside `fn`; return what the
   * command needs from it. A failure to put the application away is a warning: it never turns work that succeeded into
   * a failure, or replaces the failure the work ended in.
   */
  protected withApp<T>(fn: (context: AppCommandApp) => Promise<T>): Promise<T> {
    return withAppInstance(
      appContextOf(this),
      (app, runtime) => fn({ app, env: runtime.env }),
      { onCleanupFailure: (error) => this.warn(error.message) },
    );
  }

  /**
   * The command line that runs this CLI with `args`, the way it runs where this command runs: `pnpm nocobase` in a
   * source checkout, and `node <dist>/cli/index.js` in a built `dist/`, which has no pnpm. Use it for a suggestion's
   * `run`, such as `{ message: 'Rebuild it:', run: this.cliCommand(['app', 'reindex']) }`.
   */
  protected cliCommand(args: readonly string[]): {
    command: string;
    args: string[];
  } {
    return nocobaseCommand(args);
  }

  /** Marks a successful run as having changed nothing, or only part of what it set out to. */
  protected setStatus(status: CommandSuccessStatus): void {
    this.#status = status;
  }

  /** The command's id as typed, such as `db apply`. */
  protected get commandName(): string {
    return (this.id ?? '').split(':').join(' ');
  }

  protected override async parse<
    F extends ParserRecord,
    B extends ParserRecord,
    A extends ParserRecord,
  >(
    options?: Interfaces.Input<F, B, A>,
    argv?: string[],
  ): Promise<Interfaces.ParserOutput<F, B, A>> {
    const output = await super.parse(options, argv);
    // Base flags included: a shared base class is where a path flag common to several commands is declared.
    const definitions = declaredFlags(options ?? this.ctor);
    const flags = output.flags as Record<string, unknown>;
    for (const [name, definition] of Object.entries(definitions)) {
      if (!isAppPathFlag(definition)) continue;
      const value = flags[name];
      // A value the user typed was resolved from the current directory while parsing; a default names a path inside
      // the application.
      if (
        typeof value === 'string' &&
        output.metadata.flags[name]?.setFromDefault === true
      ) {
        flags[name] = path.resolve(this.rootDir, value);
      }
    }
    return output;
  }

  public override warn(input: Error | string): Error | string {
    if (this.jsonEnabled()) {
      this.#warnings.push(typeof input === 'string' ? input : input.message);
      return input;
    }
    return super.warn(input);
  }

  /**
   * Progress and other notes for whoever is watching. Unlike oclif's, this is not silenced by `--json`: stderr never
   * carries the document, and a long command should not go quiet for the agent that asked for JSON.
   */
  public override logToStderr(message: string = '', ...args: unknown[]): void {
    ux.stderr(format(message, ...args));
  }

  public override exit(_code?: number): never {
    throw new Error(
      'Return the result from run() or throw CommandError instead of calling exit().',
    );
  }

  protected override logJson(json: unknown): void {
    if (!isCommandEnvelope(json)) {
      throw new Error(
        'Return the result from run() instead of calling logJson(); AppCommand prints the --json document.',
      );
    }
    this.#printed = true;
    super.logJson(json);
  }

  protected override toSuccessJson(result: unknown): CommandSuccessJson {
    return commandSuccessJson(
      this.commandName,
      this.#status,
      result,
      this.#warnings,
    );
  }

  protected override toErrorJson(error: unknown): CommandFailureJson {
    return commandFailureJson(
      this.commandName,
      describeCommandError(error).json,
      this.#warnings,
    );
  }

  protected override async catch(
    error: Error & { exitCode?: number },
  ): Promise<unknown> {
    const reported = this.#withUsageSuggestions(error);
    process.exitCode = describeCommandError(reported).exit;
    const debug = debugEnabled();
    if (debug) this.logToStderr(await describeForDebugging(error));
    if (this.jsonEnabled()) {
      this.logJson(this.toErrorJson(reported));
      return undefined;
    }
    const thrown = this.#forPeople(reported);
    // The runner sees this error next and would print the same diagnostics again.
    if (debug) markDiagnosed(thrown);
    throw thrown;
  }

  /**
   * The error oclif prints without `--json`. A failure wrapped together with a cleanup failure is printed as the
   * failure itself, so its suggestions show and the run exits with its code, as `describeCommandError` reports it
   * under `--json`; the wrapper's message, which names the cleanup failure too, goes first as a warning.
   */
  #forPeople(error: Error): Error {
    if (error instanceof AggregateError && isCommandError(error.cause)) {
      super.warn(error.message);
      return error.cause;
    }
    return error;
  }

  /**
   * An error oclif raised while parsing, as a `CommandError` that says what to do next: the flag that was probably
   * meant, and where the command's flags are listed. Any other error is returned as it is.
   */
  #withUsageSuggestions(error: Error): Error {
    const usage = describeUsageError(
      error,
      usageContextFor(this.ctor, this.commandName.split(' ').filter(Boolean)),
    );
    if (usage === undefined) return error;
    return new CommandError(usage.message, {
      code: INVALID_USAGE,
      exit: usage.exit,
      suggestions: usage.suggestions,
      cause: error,
    });
  }

  protected override async _run<T>(): Promise<T> {
    const result = await super._run<T>();
    // oclif prints only a truthy result; a command that returns nothing still answers with one document.
    if (this.jsonEnabled() && !this.#printed) {
      this.logJson(this.toSuccessJson(result));
    }
    return result;
  }
}
