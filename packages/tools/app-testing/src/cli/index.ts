// What a command's tests import: `@nocobase/app-cli/testing`, plus a way to run the command on test databases.
import type { AppCommand } from '@nocobase/app-cli';
import {
  bindAppCommand,
  type BindAppCommandOptions,
} from '@nocobase/app-cli/testing';

import type { TestAppConfig } from '../server/app-config.js';

export * from '@nocobase/app-cli/testing';
export {
  createTestAppConfig,
  type CreateTestAppConfigOptions,
  type TestAppConfig,
  type TestAppConfigValues,
} from '../server/app-config.js';

export interface BindTestAppCommandOptions extends Omit<
  BindAppCommandOptions,
  'configPath'
> {
  /** The configuration `createTestAppConfig()` wrote; the command's application loads it instead of its own. */
  readonly config: TestAppConfig;
}

/**
 * `bindAppCommand()` for a command that opens the application: the application it opens runs on the test databases
 * `config` names, so a command such as `db apply` or one of a plugin's runs against a real database of its own.
 */
export function bindTestAppCommand<T extends typeof AppCommand>(
  command: T,
  options: BindTestAppCommandOptions,
): T {
  const { config, ...bindOptions } = options;
  return bindAppCommand(command, { ...bindOptions, configPath: config.path });
}
