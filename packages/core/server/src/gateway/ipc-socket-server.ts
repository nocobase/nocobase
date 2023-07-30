import net from 'net';
import fs from 'fs';
import { Gateway } from '@nocobase/server';

export class IPCSocketServer {
  socketServer: net.Server;

  constructor(server: net.Server) {
    this.socketServer = server;
  }

  static buildServer(socketPath: string) {
    // try to unlink the socket from a previous run
    if (fs.existsSync(socketPath)) {
      fs.unlinkSync(socketPath);
    }

    const socketServer = net.createServer((c) => {
      console.log('client connected');

      c.on('end', () => {
        console.log('client disconnected');
      });

      c.on('data', (data) => {
        const dataAsString = data.toString();
        const messages = dataAsString.split('\n');

        for (const message of messages) {
          if (message.length === 0) {
            continue;
          }

          const dataObj = JSON.parse(message);

          IPCSocketServer.handleClientMessage(dataObj);
        }
      });
    });

    socketServer.listen(socketPath, () => {
      console.log(`Gateway IPC Server running at ${socketPath}`);
    });

    return new IPCSocketServer(socketServer);
  }

  static handleClientMessage({ type, payload }) {
    console.log(`cli received message ${type}`);

    if (type === 'callApp') {
      const { appName, method, args } = payload;

      Gateway.getInstance().callApp(appName, method, ...args);
    }
  }
}
