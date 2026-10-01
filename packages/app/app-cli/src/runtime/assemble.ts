// Merges built-in, app, and plugin commands into one oclif command map.
//
// Topics are a single flat namespace: `plugin` and `app` are taken by the built-in and app-owned commands, and every
// plugin claims one more. A collision is rejected here rather than resolved, because both plausible resolutions are
// worse than failing — overwriting silently loses a command, and renaming produces an id that no documentation can
// name.
import type {
  AppCliCommand,
  AppCliPlugin,
  AppCliPlugins,
} from '../plugins/types.ts';

export const APP_TOPIC = 'app';
export const PLUGIN_TOPIC = 'plugin';

/** Who contributed a command or topic to the assembled tree. */
export type CommandSource = 'builtin' | 'app' | 'plugin';

/** Where a topic in the assembled tree came from. */
export interface TopicOrigin {
  readonly source: CommandSource;
  /** The plugin package that contributed it, for `source: 'plugin'`. */
  readonly package?: string;
}

/** Where a command in the assembled tree came from, and whether a deployment has it. */
export interface CommandOrigin extends TopicOrigin {
  /** Registered only in a source checkout: a development built-in, or an entry of a plugin's `devCommands`. */
  readonly developmentOnly: boolean;
}

export interface AssembledCli {
  readonly commands: Record<string, AppCliCommand>;
  readonly topics: Record<string, { description: string }>;
  /**
   * Where each command came from, keyed like `commands`. Kept beside the classes rather than on them: a plugin may
   * register one class under several names, and the class is the plugin's, not this package's to mark.
   */
  readonly commandOrigins: Record<string, CommandOrigin>;
  /** Where each topic came from, keyed like `topics`. */
  readonly topicOrigins: Record<string, TopicOrigin>;
}

export interface AssembleCliOptions {
  /** Commands the app itself contributes, keyed by name; they mount under the `app` topic. */
  readonly commands?: Readonly<Record<string, AppCliCommand>>;
  readonly plugins?: AppCliPlugins;
  /** Built-in commands, already fully qualified. Defaults to this package's plugin management commands. */
  readonly builtinCommands: Readonly<Record<string, AppCliCommand>>;
  readonly builtinTopics: Readonly<Record<string, { description: string }>>;
  /** Assembling for a built `dist/`: plugins' `devCommands` are left out. */
  readonly deployment?: boolean;
  /**
   * Names no plugin may take even when no built-in command under them is registered in this run, so that whether a
   * plugin loads never depends on where the CLI happens to run.
   */
  readonly reservedTopics?: readonly string[];
  /** First segments of built-in commands a deployment does not register, which marks them development-only. */
  readonly developmentTopics?: readonly string[];
  /**
   * Topics of CLI packages the application depends on but this run did not import, each keyed to the package that
   * owns it. They are claimed as a loaded plugin's topic is, so a collision does not depend on which command was run.
   */
  readonly claimedTopics?: Readonly<Record<string, string>>;
}

export function assembleCli({
  builtinCommands,
  builtinTopics,
  commands = {},
  plugins,
  deployment = false,
  reservedTopics = [],
  developmentTopics = [],
  claimedTopics = {},
}: AssembleCliOptions): AssembledCli {
  const assembled: Record<string, AppCliCommand> = { ...builtinCommands };
  const topics: Record<string, { description: string }> = {
    ...builtinTopics,
  };
  const commandOrigins: Record<string, CommandOrigin> = {};
  for (const id of Object.keys(builtinCommands)) {
    const [head = id] = id.split(':');
    commandOrigins[id] = {
      source: 'builtin',
      developmentOnly: developmentTopics.includes(head),
    };
  }
  const topicOrigins: Record<string, TopicOrigin> = Object.fromEntries(
    Object.keys(builtinTopics).map((topic) => [topic, { source: 'builtin' }]),
  );
  // What claimed each topic, so a collision message can name both sides rather than only the loser.
  const topicOwners = new Map<string, string>(
    Object.keys(builtinTopics).map((topic) => [topic, 'the built-in commands']),
  );
  for (const topic of reservedTopics) {
    topicOwners.set(topic, 'the built-in commands');
  }
  // A top-level built-in command such as `build` occupies its name as surely as a topic does.
  for (const id of Object.keys(builtinCommands)) {
    const [head = id] = id.split(':');
    if (!topicOwners.has(head)) topicOwners.set(head, 'the built-in commands');
  }

  for (const [name, command] of Object.entries(commands)) {
    assembled[`${APP_TOPIC}:${name}`] = command;
    commandOrigins[`${APP_TOPIC}:${name}`] = {
      source: 'app',
      developmentOnly: false,
    };
  }
  if (Object.keys(commands).length > 0) {
    topicOwners.set(APP_TOPIC, 'this app');
    topics[APP_TOPIC] ??= { description: "This app's own commands." };
    topicOrigins[APP_TOPIC] = { source: 'app' };
  }

  for (const plugin of plugins?.plugins ?? []) {
    assertTopicAvailable(plugin, topicOwners);
    topicOwners.set(plugin.topic, plugin.packageName);
    const contributed = deployment
      ? plugin.commands
      : { ...plugin.commands, ...plugin.devCommands };
    // A plugin whose commands are all development-only contributes nothing to a deployment, so its topic would list
    // no commands at all.
    if (Object.keys(contributed).length === 0) {
      continue;
    }
    topics[plugin.topic] = {
      description:
        plugin.description ?? `Commands contributed by ${plugin.packageName}.`,
    };
    topicOrigins[plugin.topic] = {
      source: 'plugin',
      package: plugin.packageName,
    };
    // A nested topic is described only when a command under it is contributed here, so a deployment that leaves out
    // development commands does not list an empty topic.
    for (const [name, description] of Object.entries(plugin.topics ?? {})) {
      if (!Object.keys(contributed).some((id) => id.startsWith(`${name}:`)))
        continue;
      topics[`${plugin.topic}:${name}`] = { description };
      topicOrigins[`${plugin.topic}:${name}`] = {
        source: 'plugin',
        package: plugin.packageName,
      };
    }
    for (const [name, command] of Object.entries(contributed)) {
      assembled[`${plugin.topic}:${name}`] = command;
      commandOrigins[`${plugin.topic}:${name}`] = {
        source: 'plugin',
        package: plugin.packageName,
        // A name in both maps runs the development command here and the runtime one in a deployment, so a deployment
        // still has it.
        developmentOnly:
          !deployment &&
          Object.hasOwn(plugin.devCommands, name) &&
          !Object.hasOwn(plugin.commands, name),
      };
    }
  }

  for (const [topic, packageName] of Object.entries(claimedTopics)) {
    assertTopicAvailable({ topic, packageName }, topicOwners);
    topicOwners.set(topic, packageName);
  }

  return { commands: assembled, topics, commandOrigins, topicOrigins };
}

function assertTopicAvailable(
  plugin: Pick<AppCliPlugin, 'packageName' | 'topic'>,
  topicOwners: ReadonlyMap<string, string>,
): void {
  const owner = topicOwners.get(plugin.topic);
  if (owner === undefined) {
    return;
  }
  throw new Error(
    `CLI topic "${plugin.topic}" is claimed by both ${owner} and ${plugin.packageName}. ` +
      `A plugin's topic is its package name, and a topic is a single flat namespace that cannot be shared.`,
  );
}
