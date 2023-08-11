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
      await app.pm.enable(plugins);
    });

  pm.command('disable')
    .arguments('<plugins...>')
    .action(async (plugins) => {
      await app.pm.disable(plugins);
    });

  pm.command('remove')
    .arguments('<plugins...>')
    .action(async (plugins) => {
      await app.pm.remove(plugins);
    });
};
