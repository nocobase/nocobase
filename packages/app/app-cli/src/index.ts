// The authoring entry: what an application's `cli/` and a plugin's `cli/` import to write commands.
//
// Kept light on purpose. A plugin's `cli/index.ts` is imported whenever the command tree is assembled — for `--help`
// too — so nothing reachable from here imports a command file, the runner, the server runtime or an optional peer.
export { AppCommand } from './context.ts';
export type { AppCommandApp, AppCommandEnv } from './context.ts';
export { CommandError } from './command/errors.ts';
export type { CommandErrorOptions } from './command/errors.ts';
// The `--json` envelope is `@nocobase/cli-envelope`'s, re-exported so a command author needs only this package.
export { COMMAND_JSON_SCHEMA_VERSION } from '@nocobase/cli-envelope';
export type {
  CommandErrorJson,
  CommandFailureJson,
  CommandJson,
  CommandSuccessJson,
  CommandSuccessStatus,
  CommandSuggestion,
} from '@nocobase/cli-envelope';
export { appPath } from './command/flags.ts';
export type { AppPathFlagOptions } from './command/flags.ts';
export {
  APP_BUILD_HOOK_STAGES,
  APP_DEV_HOOK_STAGES,
  defineCliPlugin,
  defineCliPlugins,
  pluginTopicFor,
} from './plugins/index.ts';
export type {
  AppBuildHooks,
  AppBuildHookStage,
  AppCliCommand,
  AppCliCommands,
  AppCliHook,
  AppCliPlugin,
  AppCliPluginDefinition,
  AppCliPlugins,
  AppDevHooks,
  AppDevHookStage,
} from './plugins/index.ts';
