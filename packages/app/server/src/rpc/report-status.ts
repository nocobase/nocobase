import { Gateway } from '@nocobase/server';
import net from 'net';

export function reportStatus(app) {
  if (process.env.MAIN_PROCESS_SOCKET_PATH) {
    // connect to main process socket server
    const mainProcessRPCClient = net.createConnection({
      path: process.env.MAIN_PROCESS_SOCKET_PATH,
    });

    mainProcessRPCClient.on('data', (data) => {
      const dataAsString = data.toString();
      // start app process server
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

    process.on('exit', (code) => {
      Gateway.getInstance().close();

      mainProcessRPCClient &&
        mainProcessRPCClient.write(
          JSON.stringify({
            status: 'worker-exit',
          }),
        );
    });

    app.on('workingMessageChanged', (newMessage) => {
      mainProcessRPCClient.write(
        JSON.stringify({
          workingMessage: newMessage,
        }) + '\n',
        'utf8',
      );
    });
  }
}
