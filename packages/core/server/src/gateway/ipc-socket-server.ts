import net from 'net';
import fs from 'fs';
import path from 'path';
import xpipe from 'xpipe';
import { AppSupervisor } from '../app-supervisor';
import { writeJSON } from './ipc-socket-client';
import { randomUUID } from 'crypto';

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

    const dir = path.dirname(socketPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
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

          const reqId = randomUUID();
          const dataObj = JSON.parse(message);

          IPCSocketServer.handleClientMessage({ reqId, ...dataObj })
            .then(() => {
              writeJSON(c, {
                reqId,
                type: 'success',
              });
            })
            .catch((err) => {
              writeJSON(c, {
                reqId,
                type: 'error',
                payload: {
                  message: err.message,
                  stack: err.stack,
                },
              });
            });
        }
      });
    });

    socketServer.listen(xpipe.eq(socketPath), () => {
      console.log(`Gateway IPC Server running at ${socketPath}`);
    });

    return new IPCSocketServer(socketServer);
  }

  static async handleClientMessage({ reqId, type, payload }) {
    console.log(`cli received message ${type}`);

    if (type === 'passCliArgv') {
      const argv = payload.argv;

      const mainApp = await AppSupervisor.getInstance().getApp('main');
      if (!mainApp.cli.hasCommand(argv[2])) {
        console.log('passCliArgv', argv[2]);
        await mainApp.pm.loadCommands();
      }
      const cli = mainApp.cli;
      if (
        !cli.parseHandleByIPCServer(argv, {
          from: 'node',
        })
      ) {
        throw new Error('Not handle by ipc server');
      }

      return mainApp.runAsCLI(argv, {
        reqId,
        from: 'node',
        throwError: true,
      });
    }

    throw new Error(`Unknown message type ${type}`);
  }

  close() {
    this.socketServer.close();
  }
}
