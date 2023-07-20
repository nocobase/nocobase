import { AppSupervisor, Gateway } from '@nocobase/server';
import net from 'net';

const writeJSON = (socket, data) => {
  socket.write(JSON.stringify(data) + '\n', 'utf8');
};

export function reportStatus() {
  if (process.env.MAIN_PROCESS_SOCKET_PATH) {
    const appSupervisor = AppSupervisor.getInstance();

    const mainProcessRPCClient = net.createConnection({
      path: process.env.MAIN_PROCESS_SOCKET_PATH,
    });

    appSupervisor.on('workingMessageChanged', ({ appName, message }) => {
      writeJSON(mainProcessRPCClient, {
        type: 'appStatusChanged',
        payload: {
          appName,
          workingMessage: message,
        },
      });
    });

    // mainProcessRPCClient.on('data', (data) => {
    //   const dataAsString = data.toString();
    //   // start app process server
    //   if (dataAsString == 'start') {
    //     Gateway.getInstance().start();
    //   }
    // });

    //
    // app.on('afterStart', () => {
    //   writeJSON(mainProcessRPCClient, {
    //     status: 'worker-ready',
    //   });
    // });

    // report uncaught errors
    process.on('uncaughtException', (err) => {
      console.error(err);

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
          type: 'worker-restart',
        });
      } else {
        writeJSON(mainProcessRPCClient, {
          type: 'worker-exit',
        });
      }
    });
  }
}
