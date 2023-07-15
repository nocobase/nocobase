import { Gateway } from '@nocobase/server';
import net from 'net';

const writeJSON = (socket, data) => {
  socket.write(JSON.stringify(data) + '\n', 'utf8');
};

export function reportStatus(app) {
  if (process.env.MAIN_PROCESS_SOCKET_PATH) {
    console.log(`current pid is ${process.pid}`);
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
      writeJSON(mainProcessRPCClient, {
        status: 'worker-ready',
      });
    });

    // report uncaught errors
    process.on('uncaughtException', (err) => {
      console.error(err.stack);

      writeJSON(mainProcessRPCClient, {
        status: 'worker-error',
        errorMessage: err.message,
      });

      process.exit(1);
    });

    process.on('exit', (code) => {
      Gateway.getInstance().close();

      if (code == 100) {
        writeJSON(mainProcessRPCClient, {
          status: 'worker-restart',
        });
      } else {
        writeJSON(mainProcessRPCClient, {
          status: 'worker-exit',
        });
      }
    });

    app.on('workingMessageChanged', (newMessage) => {
      writeJSON(mainProcessRPCClient, {
        workingMessage: newMessage,
      });
    });
  }
}
