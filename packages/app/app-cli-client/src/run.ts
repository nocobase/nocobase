// Loads and runs the CLI. The oclif configuration is synthesized here rather than read from package.json, so the same
// code runs from `src/` (Node strips the types) and from the compiled `dist/`.
import { Config, Errors, flush, run, type Command } from '@oclif/core';
import type { Interfaces } from '@oclif/core';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { defineCommands, STATIC_TOPICS } from './commands.ts';
import { configureAppCli, type AppCliConfig } from './config.ts';
import { setOriginalArgv } from './dynamic/index.ts';
import { failureEnvelope } from './lib/envelope.ts';
import {
  extractGlobalFlags,
  globalFlags,
  setGlobalFlags,
} from './lib/globals.ts';
import { UsageError } from './lib/command.ts';

/** A line whose global flags cannot be read: answered as any invalid usage is. */
async function refuseLine(
  config: AppCliConfig,
  argv: readonly string[],
  error: unknown,
): Promise<void> {
  const failure = new UsageError(
    error instanceof Error ? error.message : String(error),
  );
  if (argv.includes('--json'))
    process.stdout.write(
      `${JSON.stringify(failureEnvelope(argv.filter((word) => !word.startsWith('-')).join(' '), failure, [], config.bin), null, 2)}\n`,
    );
  else process.stderr.write(` ›   Error: ${failure.message}\n`);
  process.exitCode = failure.exit;
}

// src/run.ts and dist/run.js both sit one level below the package root.
const PACKAGE_ROOT = path.resolve(import.meta.dirname, '..');

export interface RunAppCliOptions {
  /** Static commands the application adds, by oclif id (`topic:name`). */
  readonly commands?: Readonly<Record<string, Command.Class>>;
  readonly topics?: Readonly<Record<string, { description: string }>>;
  /**
   * The first words of lines whose commands read every flag themselves, such as `runner`: the global flags stay on
   * those lines, so `runner uninstall --dry-run` reaches its own `--dry-run`.
   */
  readonly ownFlags?: readonly string[];
}

function pjson(
  config: AppCliConfig,
  fromSource: boolean,
  topics: Readonly<Record<string, { description: string }>>,
): Interfaces.PJSON {
  const manifest = JSON.parse(
    readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'),
  ) as { version: string; description?: string };
  const extension = fromSource ? 'ts' : 'js';
  const root = fromSource ? './src' : './dist';
  const description = config.description ?? manifest.description;
  return {
    // oclif's name heads `--version` (`acme/1.2.3 darwin-arm64 node-v24…`): the branded command, not this package.
    name: config.bin,
    version: config.version ?? manifest.version,
    ...(description === undefined ? {} : { description }),
    oclif: {
      bin: config.bin,
      dirname: config.bin,
      topicSeparator: ' ',
      additionalHelpFlags: ['-h'],
      topics: { ...STATIC_TOPICS, ...topics },
      commands: {
        strategy: 'explicit',
        target: `${root}/commands.${extension}`,
        identifier: 'COMMANDS',
      },
      hooks: {
        command_not_found: `${root}/hooks/command-not-found.${extension}`,
      },
      helpClass: `${root}/dynamic/help.${extension}`,
    },
  };
}

/** Runs the CLI `config` describes with `argv`, and exits the way oclif does. */
export async function runAppCli(
  config: AppCliConfig,
  argv: string[] = process.argv.slice(2),
  options: RunAppCliOptions = {},
): Promise<void> {
  const fromSource = import.meta.filename.endsWith('.ts');
  configureAppCli(config);
  let line: string[];
  try {
    const own =
      options.ownFlags?.includes(argv[0] ?? '') ||
      (argv[0] === 'help' && options.ownFlags?.includes(argv[1] ?? ''));
    const extracted = own
      ? { argv: [...argv], flags: extractGlobalFlags([]).flags }
      : extractGlobalFlags(argv);
    line = extracted.argv;
    setGlobalFlags(extracted.flags);
  } catch (error) {
    await refuseLine(config, argv, error);
    return;
  }
  if (globalFlags().noColor || process.env.NO_COLOR) {
    process.env.NO_COLOR = '1';
    process.env.FORCE_COLOR = '0';
  }
  defineCommands(config, options.commands);
  setOriginalArgv(line);
  argv = line;
  try {
    const loaded = await Config.load({
      root: PACKAGE_ROOT,
      pjson: pjson(config, fromSource, options.topics ?? {}),
    });
    await run(argv, loaded);
    await flush();
  } catch (error) {
    await Errors.handle(error as Error);
  }
}
