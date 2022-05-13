import Application from '../application';

export default (app: Application) => {
  app
    .command('start')
    .option('-s, --silent')
    .option('-p, --port')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;
      const port = opts.port || process.env.SERVER_PORT || 13000;
      const host = opts.host || process.env.SERVER_HOST || '0.0.0.0';

      await app.start({
        cliArgs,
        listen: {
          port,
          host,
        },
      });

      if (!opts.silent) {
        console.log(`🚀 NocoBase server running at: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/`);
      }
    });
};
