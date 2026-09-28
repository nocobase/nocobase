import type { Command } from '@oclif/core';

/**
 * A command class as oclif consumes it. oclif identifies a command by duck typing — it checks for a static `run` —
 * rather than by `instanceof`, so a plugin compiled against a different copy of `@oclif/core` still loads.
 */
export type AppCliCommand = typeof Command;

/**
 * Commands keyed by the sub-command name they answer to. `greet` becomes `<bin> <topic> greet`; a nested command uses
 * the colon form oclif already understands, so `'artifact:build'` becomes `<bin> <topic> artifact build`.
 */
export type AppCliCommands = Readonly<Record<string, AppCliCommand>>;

/**
 * The points in an application's `pnpm build` a plugin can attach a command to.
 *
 * The names describe the artifact that exists when the hook runs, not the build step that produced it: a hook is
 * attached because it needs `dist/server` to be there, not because it cares that `tsc` is what put it there. That is
 * what makes these four safe to publish while the steps between them stay free to change.
 *
 * `beforeBuild` runs after `dist` is cleared rather than before, so a hook may write into it. Clearing `dist` is the
 * build's first step, and a hook writing to a directory that is about to be deleted fails silently — the files are
 * written, the build succeeds, and the output is simply gone.
 */
export type AppBuildHookStage =
  'beforeBuild' | 'afterClientBuild' | 'afterServerBuild' | 'afterBuild';

export const APP_BUILD_HOOK_STAGES: readonly AppBuildHookStage[] =
  Object.freeze([
    'beforeBuild',
    'afterClientBuild',
    'afterServerBuild',
    'afterBuild',
  ]);

/**
 * The points in an application's `pnpm dev` a plugin can attach a command to.
 *
 * There is only one, and the asymmetry with the build stages is the point: a build is a sequence of steps that finish,
 * while `dev` starts long-running client and server processes that run concurrently and never complete. An
 * `afterClientDev` would name a moment that does not exist.
 */
export type AppDevHookStage = 'beforeDev';

export const APP_DEV_HOOK_STAGES: readonly AppDevHookStage[] = Object.freeze([
  'beforeDev',
]);

/**
 * One command an application's build or dev run executes on a plugin's behalf.
 *
 * The same shape serves both pipelines: what differs between them is when a hook runs, not what a hook is.
 */
export interface AppCliHook {
  /**
   * The command, already split into its executable and arguments. Spelled as an array rather than a string because
   * nothing splits it: the build spawns it directly, so an argument containing a space needs no quoting and behaves
   * the same on every platform. There is no shell, so `&&`, pipes, redirection, and `FOO=1` prefixes do not work —
   * declare several hooks for a sequence, and wrap anything else in a command of your own.
   *
   * The first element is any executable, not necessarily `pnpm`: a hook that runs a script directly says so.
   */
  readonly command: readonly string[];
  /** One short phrase naming the step in the build log. Defaults to the command itself. */
  readonly label?: string;
}

/** Build hooks keyed by the stage they attach to. */
export type AppBuildHooks = Readonly<
  Partial<Record<AppBuildHookStage, readonly AppCliHook[]>>
>;

/** Dev hooks keyed by the stage they attach to. */
export type AppDevHooks = Readonly<
  Partial<Record<AppDevHookStage, readonly AppCliHook[]>>
>;

export interface AppCliPluginDefinition {
  /** The plugin package contributing these commands, used to name it in a topic collision. */
  readonly packageName: string;
  /**
   * The top-level topic the commands mount under. It is the package name without its scope and `app-plugin-` prefix,
   * or without its `-cli` suffix for a package that is not an application plugin, so `@nocobase/app-plugin-workflow`
   * mounts under `workflow` and `@nocobase/hub-cli` under `hub`; declaring it is optional and a different value is
   * rejected. Tying the topic to the package name is what lets the built-in commands grow without ever colliding with a
   * plugin: they avoid every plugin name, and each plugin owns exactly one.
   */
  readonly topic?: string;
  /** One line shown next to the topic in `--help`. */
  readonly description?: string;
  /** Commands that run wherever the application runs, including a built `dist/`. */
  readonly commands?: AppCliCommands;
  /**
   * Commands that only make sense in a source checkout, such as ones that compile or validate sources. They are left
   * out of a built `dist/`, where the sources and the development tooling they need are not installed.
   */
  readonly devCommands?: AppCliCommands;
  /** Commands an application's `pnpm build` runs on this plugin's behalf, keyed by build stage. */
  readonly buildHooks?: AppBuildHooks;
  /**
   * Commands an application's `pnpm dev` runs on this plugin's behalf, keyed by dev stage.
   *
   * Kept separate from `buildHooks` rather than merged into one map of five stages: `pnpm build` and `pnpm dev` are
   * two pipelines, and what a plugin does in each is usually different. A single map would suggest the stages are
   * values of one concept and that any of them could be swapped for another.
   */
  readonly devHooks?: AppDevHooks;
}

export interface AppCliPlugin {
  readonly packageName: string;
  readonly topic: string;
  readonly description?: string;
  readonly commands: AppCliCommands;
  readonly devCommands: AppCliCommands;
  readonly buildHooks: AppBuildHooks;
  readonly devHooks: AppDevHooks;
}

export interface AppCliPlugins {
  readonly plugins: readonly AppCliPlugin[];
}
