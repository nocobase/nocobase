import Application from '../application';
import process from 'process';
import net from 'net';
import { Gateway } from '../gateway';

export default (app: Application) => {
  app
    .command('start')
    .option('-s, --silent')
    .option('-p, --port [post]')
    .option('-h, --host [host]')
    .option('--db-sync')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;
      const port = opts.port || process.env.APP_PORT || 13000;
      const host = opts.host || process.env.APP_HOST || '0.0.0.0';

      await app.start({
        dbSync: opts?.dbSync,
        cliArgs,
        listen: {
          port,
          host,
        },
      });

      if (process.env.MAIN_PROCESS_SOCKET_PATH) {
        const client = net.createConnection(
          {
            path: process.env.MAIN_PROCESS_SOCKET_PATH,
          },
          () => {
            client.write(
              JSON.stringify({
                status: 'worker-ready',
              }),
            );
          },
        );

        client.on('data', (data) => {
          const dataAsString = data.toString();
          if (dataAsString == 'start') {
            Gateway.getInstance().start();
          }
        });
      }
    });
};
