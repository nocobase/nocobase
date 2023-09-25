import Application from '../application';

export default (app: Application) => {
  app
    .command('install')
    .ipc()
    .option('-f, --force')
    .option('-c, --clean')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;
      await app.install({
        cliArgs,
        clean: opts.clean,
        sync: {
          force: opts.force,
        },
      });
    });
};
