import net from 'net';
import process from 'process';
import Application from '../application';
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

      let mainProcessRPCClient = null;

      if (process.env.MAIN_PROCESS_SOCKET_PATH) {
        mainProcessRPCClient = net.createConnection({
          path: process.env.MAIN_PROCESS_SOCKET_PATH,
        });

        mainProcessRPCClient.on('data', (data) => {
          const dataAsString = data.toString();
          if (dataAsString == 'start') {
            Gateway.getInstance().start();
          }
        });

        app.on('afterStart', () => {
          mainProcessRPCClient.write(
            JSON.stringify({
              status: 'worker-ready',
            }),
          );
        });

        app.on('workingMessageChanged', (newMessage) => {
          console.log({ newMessage });
        });
      }

      await app.start({
        dbSync: opts?.dbSync,
        cliArgs,
        listen: {
          port,
          host,
        },
      });
    });
};
