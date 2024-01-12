import _ from 'lodash';
import Application from '../application';
import { PluginCommandError } from '../errors/plugin-command-error';

export default (app: Application) => {
  const pm = app.command('pm');

  pm.command('create')
    .ipc()
    .arguments('plugin')
    .action(async (plugin) => {
      await app.pm.create(plugin);
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
        throw new PluginCommandError(`Failed to add plugin: ${error.message}`);
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
        throw new PluginCommandError(`Failed to update plugin: ${error.message}`);
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
        throw new PluginCommandError(`Failed to enable plugin: ${error.message}`);
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
        throw new PluginCommandError(`Failed to disable plugin: ${error.message}`);
      }
    });

  pm.command('remove')
    .ipc()
    .preload()
    .arguments('<plugins...>')
    .action(async (plugins) => {
      await app.pm.remove(plugins);
    });
};
