import {
  APP_BUILD_HOOK_STAGES,
  APP_DEV_HOOK_STAGES,
  type AppBuildHookStage,
  type AppCliHook,
  type AppCliPlugin,
  type AppCliPluginDefinition,
  type AppCliPlugins,
  type AppDevHookStage,
} from './types.ts';

const PACKAGE_NAME_PATTERN = /^@[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/;
const TOPIC_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const COMMAND_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*(?::[a-z0-9][a-z0-9-]*)*$/;

/**
 * The topic a plugin package mounts under: its name without the scope and the `app-plugin-` prefix, or, for a package
 * that is not an application plugin, without the `-cli` suffix. `@nocobase/app-plugin-workflow` mounts under
 * `workflow` and `@nocobase/hub-cli` under `hub`.
 */
export function pluginTopicFor(packageName: string): string {
  const unscoped = packageName.slice(packageName.indexOf('/') + 1);
  if (unscoped.startsWith('app-plugin-')) {
    return unscoped.slice('app-plugin-'.length);
  }
  return unscoped.endsWith('-cli')
    ? unscoped.slice(0, -'-cli'.length)
    : unscoped;
}

export function defineCliPlugin(
  definition: AppCliPluginDefinition,
): AppCliPlugin {
  const packageName = definition.packageName.trim();
  if (!PACKAGE_NAME_PATTERN.test(packageName)) {
    throw new Error(
      `CLI plugin package name "${definition.packageName}" must be a valid scoped package name.`,
    );
  }

  const topic = pluginTopicFor(packageName);
  if (!TOPIC_PATTERN.test(topic)) {
    throw new Error(
      `CLI plugin ${packageName} has no usable topic: "${topic}" is not lower-case kebab-case.`,
    );
  }
  if (definition.topic !== undefined && definition.topic.trim() !== topic) {
    throw new Error(
      `CLI plugin ${packageName} declares topic "${definition.topic}", but a plugin's topic is its package name ` +
        `without the scope and the "app-plugin-" prefix or "-cli" suffix: "${topic}". Remove the topic or change it ` +
        `to "${topic}".`,
    );
  }

  const buildHooks = normalizeHooks<AppBuildHookStage>(
    packageName,
    'build',
    APP_BUILD_HOOK_STAGES,
    definition.buildHooks,
  );
  const devHooks = normalizeHooks<AppDevHookStage>(
    packageName,
    'dev',
    APP_DEV_HOOK_STAGES,
    definition.devHooks,
  );
  const commands = [
    ...Object.entries(definition.commands ?? {}),
    ...Object.entries(definition.devCommands ?? {}),
  ];
  for (const name of Object.keys(definition.devCommands ?? {})) {
    if (definition.commands?.[name] !== undefined) {
      throw new Error(
        `CLI command "${topic} ${name}" from ${packageName} is declared in both commands and devCommands.`,
      );
    }
  }
  // A warning rather than an error: this catches a plugin registered by mistake, which is a tidiness problem and not
  // a broken one. Erroring would also make the check the thing that decides what a plugin may contribute, and that
  // set grew once already — a plugin contributing only build hooks is legitimate and has no commands to declare.
  if (
    commands.length === 0 &&
    Object.keys(buildHooks).length === 0 &&
    Object.keys(devHooks).length === 0
  ) {
    console.warn(
      `CLI plugin ${packageName} declares neither commands nor hooks; registering it has no effect.`,
    );
  }
  for (const [name, command] of commands) {
    if (!COMMAND_NAME_PATTERN.test(name)) {
      throw new Error(
        `CLI command name "${name}" from ${packageName} must be lower-case kebab-case, optionally nested with ":".`,
      );
    }
    // oclif loads a command by reading its static `run`, so a missing one fails at dispatch time with an error that
    // names oclif internals rather than the plugin. Rejecting it here names the plugin and the command instead.
    if (typeof command?.run !== 'function') {
      throw new Error(
        `CLI command "${topic} ${name}" from ${packageName} is not an oclif Command class.`,
      );
    }
  }

  return Object.freeze({
    packageName,
    topic,
    ...(definition.description === undefined
      ? {}
      : { description: definition.description }),
    commands: Object.freeze({ ...definition.commands }),
    devCommands: Object.freeze({ ...definition.devCommands }),
    buildHooks,
    devHooks,
  });
}

/**
 * Validates the declared hooks for one pipeline and freezes them.
 *
 * An unknown stage throws rather than warning, because the two failures are not comparable. A misspelled stage looks
 * exactly like a correctly registered hook — the plugin loads, the run succeeds, and the step simply never happens.
 * Whatever it was meant to produce is missing, and the first sign of it is a deployment behaving as though the plugin
 * were not installed.
 */
function normalizeHooks<Stage extends string>(
  packageName: string,
  pipeline: 'build' | 'dev',
  validStages: readonly Stage[],
  declared: Readonly<Partial<Record<Stage, readonly AppCliHook[]>>> | undefined,
): Readonly<Partial<Record<Stage, readonly AppCliHook[]>>> {
  if (declared === undefined) {
    return Object.freeze({});
  }

  const normalized: Partial<Record<Stage, readonly AppCliHook[]>> = {};
  const entries: [string, readonly AppCliHook[] | undefined][] =
    Object.entries(declared);
  for (const [stage, hooks] of entries) {
    if (!validStages.includes(stage as Stage)) {
      throw new Error(
        `CLI plugin ${packageName} declares ${pipeline} hooks for unknown stage "${stage}". ` +
          `Valid stages are ${validStages.join(', ')}.`,
      );
    }
    if (hooks === undefined || hooks.length === 0) {
      continue;
    }
    for (const hook of hooks) {
      if (!Array.isArray(hook?.command) || hook.command.length === 0) {
        throw new Error(
          `CLI plugin ${packageName} declares a ${stage} hook without a command. ` +
            `A hook command is a non-empty array of the executable and its arguments.`,
        );
      }
      if (hook.command.some((part) => typeof part !== 'string')) {
        throw new Error(
          `CLI plugin ${packageName} declares a ${stage} hook whose command contains a non-string element.`,
        );
      }
    }
    normalized[stage as Stage] = Object.freeze(
      hooks.map((hook) =>
        Object.freeze({
          command: Object.freeze([...hook.command]),
          ...(hook.label === undefined ? {} : { label: hook.label }),
        }),
      ),
    );
  }

  return Object.freeze(normalized);
}

export function defineCliPlugins(
  plugins: readonly AppCliPlugin[],
): AppCliPlugins {
  const seenPackages = new Set<string>();
  for (const plugin of plugins) {
    if (seenPackages.has(plugin.packageName)) {
      throw new Error(
        `CLI plugin "${plugin.packageName}" is registered more than once.`,
      );
    }
    seenPackages.add(plugin.packageName);
  }

  return Object.freeze({ plugins: Object.freeze([...plugins]) });
}
