import _ from 'lodash';
import Application from '../application';
import { PluginCommandError } from '../errors/plugin-command-error';

export default (app: Application) => {
  const pm = app.command('pm');

  pm.command('create')
    .arguments('plugin')
    .option('--force-recreate')
    .action(async (plugin, options) => {
      await app.pm.create(plugin, options);
    });

  pm.command('add')
    .ipc()
    .preload()
    .argument('<pkg>')
    .option('--registry [registry]')
    .option('--auth-token [authToken]')
    .option('--version [version]')
    .action(async (name, options, cli) => {
      try {
        await app.pm.addViaCLI(name, _.cloneDeep(options));
      } catch (error) {
        throw new PluginCommandError(`Failed to add plugin`, { cause: error });
      }
    });

  pm.command('update')
    .ipc()
    .argument('<packageName>')
    .option('--path [path]')
    .option('--url [url]')
    .option('--registry [registry]')
    .option('--auth-token [authToken]')
    .option('--version [version]')
    .action(async (packageName, options) => {
      try {
        await app.pm.update({
          ...options,
          packageName,
        });
      } catch (error) {
        throw new PluginCommandError(`Failed to update plugin`, { cause: error });
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
    .action(async (plugins, options) => {
      await app.pm.remove(plugins, options);
    });
};
