import Application from '../application';

export default (app: Application) => {
  app
    .command('stop')
    .handleByIPCServer()
    .action(async (...cliArgs) => {
      await app.stop({
        cliArgs,
      });
    });
};
