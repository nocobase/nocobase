import Application from '../application';
import { PluginCommandError } from '../errors/plugin-command-error';

export default (app: Application) => {
  const pm = app.command('pm');

  pm.command('create')
    .arguments('plugin')
    .action(async (plugin) => {
      await app.pm.create(plugin);
    });

  pm.command('add')
    .arguments('plugin')
    .action(async (plugin) => {
      await app.pm.add(plugin, {}, true);
    });

  pm.command('enable')
    .arguments('<plugins...>')
    .action(async (plugins) => {
      try {
        await app.pm.enable(plugins);
      } catch (error) {
        throw new PluginCommandError(`Failed to enable plugin: ${error.message}`);
      }
    });

  pm.command('disable')
    .arguments('<plugins...>')
    .action(async (plugins) => {
      try {
        await app.pm.disable(plugins);
      } catch (error) {
        throw new PluginCommandError(`Failed to disable plugin: ${error.message}`);
      }
    });

  pm.command('remove')
    .arguments('<plugins...>')
    .action(async (plugins) => {
      await app.pm.remove(plugins);
    });
};
