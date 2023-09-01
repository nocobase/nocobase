import Application from '../application';

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
        app.log.debug(`Failed to enable plugin: ${error.message}`);
        app.setMaintainingMessage(`Failed to enable plugin: ${error.message}`);
        await new Promise((resolve) => {
          setTimeout(() => resolve(null), 10000);
        });
      }
    });

  pm.command('disable')
    .arguments('<plugins...>')
    .action(async (plugins) => {
      try {
        await app.pm.disable(plugins);
      } catch (error) {
        app.log.debug(`Failed to disable plugin: ${error.message}`);
        app.setMaintainingMessage(`Failed to disable plugin: ${error.message}`);
        await new Promise((resolve) => {
          setTimeout(() => resolve(null), 10000);
        });
      }
    });

  pm.command('remove')
    .arguments('<plugins...>')
    .action(async (plugins) => {
      await app.pm.remove(plugins);
    });
};
