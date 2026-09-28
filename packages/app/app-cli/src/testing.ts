// What a command's tests import: a way to run an `AppCommand` against a fixture application without the runner.
import { format } from 'node:util';

import { Config } from '@oclif/core';

import type { CommandJson } from '@nocobase/cli-envelope';
import {
  PINNED_APP_CONTEXT,
  type AppCommand,
  type AppCommandContext,
} from './context.ts';
import {
  createDefaultCommandContext,
  type AppCommandContextOptions,
} from './default-context.ts';

export interface BindAppCommandOptions extends AppCommandContextOptions {
  /**
   * The id the runner would register the command under, colon-separated: `app:orders:export` for an application's
   * `cli/commands/orders/export.ts`, `cli-example:greet` for a plugin's `greet`. The `--json` document names the
   * command by it. Without it, oclif names a command run on its own after its class, lower-cased.
   */
  readonly id?: string;
}

/**
 * A subclass of `command` pinned to the application at `rootDir`, the way the runner would point it at the application
 * it located. Run it with `await Bound.run(argv)`; with `--json`, the returned value is the command's result. Each call
 * returns a fresh class, so two tests never share a context. `loadRuntime` and `createApp` replace the conventional
 * `server/runtime` and `server/app` imports with stubs.
 */
export function bindAppCommand<T extends typeof AppCommand>(
  command: T,
  options: BindAppCommandOptions,
): T {
  const Base = command as typeof AppCommand;
  const bound = class extends Base {};
  // An anonymous subclass would otherwise be named after this variable, and oclif names an id-less command after it.
  Object.defineProperty(bound, 'name', { value: command.name });
  Object.defineProperty(bound, PINNED_APP_CONTEXT, {
    value: createDefaultCommandContext(options) satisfies AppCommandContext,
  });
  if (options.id !== undefined) bound.id = options.id;
  return bound as unknown as T;
}

/** What `runAppCommand()` observed. */
export interface AppCommandRun<TResult = unknown> {
  /** What `run()` returned; `undefined` when it threw. */
  readonly result: TResult | undefined;
  /** What escaped the command: without `--json`, a failure is rethrown for oclif to print. */
  readonly error: unknown;
  /** The exit code the process would end with; `undefined` means 0. */
  readonly exitCode: number | undefined;
  readonly stdout: string;
  readonly stderr: string;
  /** stdout parsed as the one `--json` document; throws when stdout is not exactly one JSON value. */
  readonly json: () => CommandJson<TResult>;
}

/**
 * Runs a bound command the way the runner does — `--json`, failure handling and the envelope all apply — and captures
 * what it printed, restoring the console, the streams and `process.exitCode` afterwards.
 */
export async function runAppCommand<TResult = unknown>(
  command: typeof AppCommand,
  argv: readonly string[],
): Promise<AppCommandRun<TResult>> {
  const pinned = (command as { [PINNED_APP_CONTEXT]?: AppCommandContext })[
    PINNED_APP_CONTEXT
  ];
  const config = await Config.load({
    root: pinned?.rootDir ?? process.cwd(),
    // Synthesized so oclif does not read the fixture's manifest or go looking for plugins of its own.
    pjson: {
      name: 'app-command-test',
      version: '0.0.0',
      oclif: { bin: 'nocobase' },
    },
  });
  let stdout = '';
  let stderr = '';
  // oclif writes through console.log and console.error; what the application logs goes to the streams.
  const restore = [
    replace(console, 'log', (...args: unknown[]): void => {
      stdout += `${format(...args)}\n`;
    }),
    replace(console, 'error', (...args: unknown[]): void => {
      stderr += `${format(...args)}\n`;
    }),
    replace(process.stdout, 'write', (chunk: string | Uint8Array): boolean => {
      stdout += String(chunk);
      return true;
    }),
    replace(process.stderr, 'write', (chunk: string | Uint8Array): boolean => {
      stderr += String(chunk);
      return true;
    }),
  ];
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;
  let result: TResult | undefined;
  let escaped: unknown;
  try {
    result = (await command.run([...argv], config)) as TResult;
  } catch (thrown) {
    escaped = thrown;
  } finally {
    for (const undo of restore) undo();
  }
  const exitCode =
    typeof process.exitCode === 'number' && process.exitCode !== 0
      ? process.exitCode
      : undefined;
  process.exitCode = previousExitCode;
  return {
    result,
    error: escaped,
    exitCode,
    stdout,
    stderr,
    json: () => JSON.parse(stdout) as CommandJson<TResult>,
  };
}

/** Replaces `target[key]`, returning the function that puts back exactly what was there, own property or inherited. */
function replace(target: object, key: string, value: unknown): () => void {
  const own = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, {
    value,
    configurable: true,
    writable: true,
  });
  return () => {
    if (own) Object.defineProperty(target, key, own);
    else Reflect.deleteProperty(target, key);
  };
}
