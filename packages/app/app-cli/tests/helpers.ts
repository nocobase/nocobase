import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config } from '@oclif/core';

import { assembleCli } from '../src/runtime/assemble.ts';
import {
  DEVELOPMENT_TOPICS,
  builtinTopicsFor,
  loadBuiltinCommands,
} from '../src/runtime/builtin.ts';
import { setResolvedCli } from '../src/runtime/command-store.ts';

export const packageRoot: string = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

/**
 * Loads the CLI through the same assembly the runner uses, against the TypeScript sources rather than `dist`. Tests
 * therefore exercise the command tree an application actually gets, with no build step in between.
 */
export async function loadTestConfig(): Promise<Config> {
  // Every built-in command, as a source checkout would register them.
  const builtinCommands = await loadBuiltinCommands({ kind: 'source' });
  const assembled = assembleCli({
    builtinCommands,
    builtinTopics: builtinTopicsFor(Object.keys(builtinCommands)),
    developmentTopics: DEVELOPMENT_TOPICS,
  });
  setResolvedCli(assembled);

  return Config.load({
    pjson: {
      name: '@nocobase/app-cli',
      version: '0.0.0',
      oclif: {
        bin: 'nocobase',
        dirname: 'nocobase',
        topicSeparator: ' ',
        helpClass: './src/help/runtime-help.ts',
        topics: assembled.topics,
        commands: {
          strategy: 'explicit',
          identifier: 'default',
          target: './src/runtime/registry.ts',
        },
      },
    },
    root: packageRoot,
  });
}

export interface RunResult {
  stdout: string;
  lines: string[];
}

/**
 * Runs a command in-process and captures what it printed. Commands report through `this.log`, which oclif routes to
 * `ux.stdout` and from there to `console.log` — patching `process.stdout.write` would not see it, because the test
 * runner has already replaced the console by the time the command runs.
 */
export async function runCommand(
  config: Config,
  id: string,
  argv: string[] = [],
): Promise<RunResult> {
  const lines: string[] = [];
  const originalLog = console.log;

  console.log = (...args: unknown[]): void => {
    lines.push(args.map((arg) => String(arg)).join(' '));
  };

  try {
    await config.runCommand(id, argv);
  } finally {
    console.log = originalLog;
  }

  return { stdout: lines.join('\n'), lines };
}
