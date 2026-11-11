import {
  AppConfig,
  resolveDefaultAppConfigFile,
} from '@nocobase/app-server/config';
import type { ResolvedAppRuntimeConfigContext } from '@nocobase/app-server/runtime';

export function createAppConfig(
  context: ResolvedAppRuntimeConfigContext,
): AppConfig {
  const config = new AppConfig();
  const configuredPath =
    context.configPath ?? context.environment.APP_CONFIG_FILE;
  // Deployment configuration stays beside the compiled code directory.
  const configPath =
    configuredPath === undefined
      ? resolveDefaultAppConfigFile(context.paths)
      : context.paths.root(configuredPath);

  // Environment variables are declared by the sections they set, in `env` of each `defineAppConfig`, and loaded
  // above this file once the sections are known. `pnpm nocobase config env` lists them.
  config.loadFile(configPath, { optional: configuredPath === undefined });

  return config;
}
