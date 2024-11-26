/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { AppSupervisor } from '../app-supervisor';
import Application from '../application';
import { PluginCommandError } from '../errors/plugin-command-error';

export default (app: Application) => {
  const pm = app.command('pm');

  pm.command('create')
    .argument('plugin')
    .option('--force-recreate')
    .action(async (plugin, options) => {
      await app.pm.create(plugin, options);
    });

  pm.command('add')
    .ipc()
    .preload()
    .arguments('<packageNames...>')
    .option('--registry [registry]')
    .option('--auth-token [authToken]')
    .option('--version [version]')
    .action(async (packageNames, options, cli) => {
      try {
        let name = packageNames;
        if (Array.isArray(packageNames) && packageNames.length === 1) {
          name = packageNames[0];
        }
        await app.pm.addViaCLI(name, { ...options });
      } catch (error) {
        throw new PluginCommandError(`Failed to add plugin`, { cause: error });
      }
    });

  pm.command('update')
    .argument('<packageNames...>')
    // .option('--path [path]')
    // .option('--url [url]')
    .option('--registry [registry]')
    .option('--auth-token [authToken]')
    .option('--version [version]')
    .action(async (packageNames, options) => {
      try {
        await app.pm.update(packageNames, {
          ...options,
        });
      } catch (error) {
        throw new PluginCommandError(`Failed to update plugin`, { cause: error });
      }
    });

  pm.command('enable-all')
    .ipc()
    .preload()
    .action(async () => {
      try {
        await app.pm.enable('*');
      } catch (error) {
        throw new PluginCommandError(`Failed to enable plugin`, { cause: error });
      }
    });

  pm.command('enable')
    .ipc()
    .preload()
    .arguments('<plugins...>')
    .action(async (plugins) => {
      try {
        await app.pm.enable(plugins);
      } catch (error) {
        await app.tryReloadOrRestart({
          recover: true,
        });
        throw new PluginCommandError(`Failed to enable plugin`, { cause: error });
      }
    });

  pm.command('disable')
    .ipc()
    .preload()
    .arguments('<plugins...>')
    .action(async (plugins) => {
      try {
        await app.pm.disable(plugins);
      } catch (error) {
        throw new PluginCommandError(`Failed to disable plugin`, { cause: error });
      }
    });

  pm.command('remove')
    .auth()
    // .ipc()
    // .preload()
    .arguments('<plugins...>')
    .option('--force')
    .option('--remove-dir')
    .option('--app [app]')
    .action(async (plugins, options) => {
      if (options.app) {
        await app.load();
        const subApp = await AppSupervisor.getInstance().getApp(options.app, { upgrading: true });
        const args = [];
        if (options.force) {
          args.push('--force');
        }
        if (options.removeDir) {
          args.push('--remove-dir');
        }
        await subApp.runCommand('pm', 'remove', ...plugins, ...args);
      } else {
        await app.pm.remove(plugins, options);
      }
    });
};
