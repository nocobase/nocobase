import Application from '../application';
import process from 'process';
import net from 'net';

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
        // process.on('SIGUSR2', () => {
        //   console.log("Received 'SIGUSR1' signal, start to restart gateway server");
        //
        //   Gateway.getInstance().start();
        // });

        const client = net.connect(process.env.MAIN_PROCESS_SOCKET_PATH, () => {
          console.log(process.env.MAIN_PROCESS_SOCKET_PATH);

          client.write('hello world\r\n');
          client.end();
        });

        await timeout(10000);
        console.log('stop gateway server');
      }
    });
};

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
