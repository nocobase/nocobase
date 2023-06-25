import { Gateway } from '@nocobase/server';
import net from 'net';

export function reportStatus(app) {
  if (process.env.MAIN_PROCESS_SOCKET_PATH) {
    const mainProcessRPCClient = net.createConnection({
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
      mainProcessRPCClient.write(
        JSON.stringify({
          workingMessage: newMessage,
        }) + '\n',
        'utf8',
      );
    });
  }
}
