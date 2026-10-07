// The commands this package contributes.
//
// They are found by directory under `commands/` rather than listed, and which of them a run registers depends on where
// it runs: a built `dist/` gets no development commands, and a directory that is not an application gets only the
// commands that take their target from `--dir` or `--workspace-root`.
import path from 'node:path';

import type { AppCliCommand } from '../plugins/types.ts';
import { APP_TOPIC, PLUGIN_TOPIC } from './assemble.ts';
import {
  discoverCommandFiles,
  loadCommandFiles,
  type CommandExtension,
} from './discover.ts';

/** Where a run found itself. */
export type AppLocationKind = 'source' | 'deployment' | 'none';

/**
 * First segments of commands that only make sense in a source checkout. A built `dist/` has no sources to compile, no
 * `package.json` dependencies to edit, and none of the development tooling these commands spawn.
 */
export const DEVELOPMENT_TOPICS: readonly string[] = Object.freeze([
  'build',
  'cli',
  'dev',
  'dist',
  'package',
  PLUGIN_TOPIC,
  'skills',
  'start',
]);

/** First segments of commands that act on the application the run is in, and so need one. */
export const APPLICATION_TOPICS: readonly string[] = Object.freeze([
  'build',
  'cli',
  'collections',
  'config',
  'db',
  'dev',
  'dist',
  'info',
  'locales',
  'secrets',
  'start',
]);

/**
 * Built-in commands that read the whole command tree. The runner assembles the tree for them, as it does for help,
 * instead of dispatching them with nothing else loaded. They are registered wherever the command line runs.
 */
export const TREE_COMMANDS: readonly string[] = Object.freeze(['commands']);

export const builtinTopics: Readonly<Record<string, { description: string }>> =
  Object.freeze({
    cli: {
      description:
        "Package and link this application's own command line (nocobase.cli), and the runner.",
    },
    collections: { description: 'Generate and check Collection metadata.' },
    config: {
      description: "Create, check and edit this application's configuration.",
    },
    db: { description: 'Manage database migrations, seeds and locks.' },
    dist: { description: 'Retarget or check the built dist/.' },
    locales: { description: 'Check application localization.' },
    secrets: {
      description: 'Report and rotate the keys stored secrets are sealed with.',
    },
    package: {
      description: 'Remove direct NocoBase packages and their Skills.',
    },
    [PLUGIN_TOPIC]: {
      description: 'Manage the plugins this application uses.',
    },
    skills: {
      description: 'Synchronize the agent Skills NocoBase packages ship.',
    },
  });

/** Names nothing else may take: the built-in topics, the top-level built-in commands, and the application's topic. */
export const RESERVED_TOPICS: readonly string[] = Object.freeze(
  [
    ...new Set([
      ...Object.keys(builtinTopics),
      ...DEVELOPMENT_TOPICS,
      ...APPLICATION_TOPICS,
      ...TREE_COMMANDS,
      APP_TOPIC,
    ]),
  ].sort(),
);

export interface BuiltinSelection {
  readonly kind: AppLocationKind;
}

const commandsDirectory = path.resolve(import.meta.dirname, '..', 'commands');
const commandExtension: CommandExtension = import.meta.filename.endsWith('.ts')
  ? '.ts'
  : '.js';

/** Whether a built-in command id is registered for a run in this kind of location. */
export function isBuiltinAvailable(
  id: string,
  { kind }: BuiltinSelection,
): boolean {
  const [head = id] = id.split(':');
  if (kind === 'deployment' && DEVELOPMENT_TOPICS.includes(head)) return false;
  if (kind === 'none' && APPLICATION_TOPICS.includes(head)) return false;
  return true;
}

/** The built-in command files this run may register, keyed by command id. Reads the directory, imports nothing. */
export async function builtinCommandFiles(
  selection: BuiltinSelection,
): Promise<Record<string, string>> {
  const files = await discoverCommandFiles(commandsDirectory, commandExtension);
  return Object.fromEntries(
    Object.entries(files).filter(([id]) => isBuiltinAvailable(id, selection)),
  );
}

/** Imports the built-in commands this run may register. */
export async function loadBuiltinCommands(
  selection: BuiltinSelection,
): Promise<Record<string, AppCliCommand>> {
  return loadCommandFiles(await builtinCommandFiles(selection));
}

/** Topics for the built-in commands actually registered, so a topic with none of its commands does not appear. */
export function builtinTopicsFor(
  commandIds: readonly string[],
): Record<string, { description: string }> {
  const present = new Set(commandIds.map((id) => id.split(':')[0]));
  return Object.fromEntries(
    Object.entries(builtinTopics).filter(([topic]) => present.has(topic)),
  );
}
