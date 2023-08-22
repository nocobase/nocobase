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
      await app.pm.add(plugin);
    });

  pm.command('enable')
    .arguments('<plugins...>')
    .action(async (plugins) => {
      try {
        await app.pm.enable(plugins);
      } catch (error) {
        app.setMaintainingMessage('Failed to enable plugin');
        await app.restart();
      }
    });

  pm.command('disable')
    .arguments('<plugins...>')
    .action(async (plugins) => {
      try {
        await app.pm.disable(plugins);
        app.setMaintainingMessage('Failed to disable plugin');
      } catch (error) {
        await app.restart();
      }
    });

  pm.command('remove')
    .arguments('<plugins...>')
    .action(async (plugins) => {
      await app.pm.remove(plugins);
    });
};
