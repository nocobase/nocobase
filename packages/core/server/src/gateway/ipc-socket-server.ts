/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { logger } from '@nocobase/logger';
import { randomUUID } from 'crypto';
import fs from 'fs';
import net from 'net';
import path from 'path';
import xpipe from 'xpipe';
import { AppSupervisor } from '../app-supervisor';
import { writeJSON } from './ipc-socket-client';

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
            .then((result) => {
              writeJSON(c, {
                reqId,
                type: result === false ? 'not_found' : 'success',
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
      logger.info(`Gateway IPC Server running at ${socketPath}`);
    });

    return new IPCSocketServer(socketServer);
  }

  static async handleClientMessage({ reqId, type, payload }) {
    if (type === 'appReady') {
      const status = await new Promise<string>((resolve, reject) => {
        let status: string;
        const max = 300;
        let count = 0;
        const timer = setInterval(async () => {
          status = AppSupervisor.getInstance().getAppStatus('main');
          if (status === 'running') {
            clearInterval(timer);
            resolve(status);
          }
          if (count++ > max) {
            reject('error');
          }
        }, 500);
      });
      console.log('status', status);
      return status;
    }
    // console.log(`cli received message ${type}`);

    if (type === 'passCliArgv') {
      const argv = payload.argv;

      const mainApp = await AppSupervisor.getInstance().getApp('main');
      if (!mainApp.cli.hasCommand(argv[2])) {
        await mainApp.pm.loadCommands();
      }
      const cli = mainApp.cli;
      if (
        !cli.parseHandleByIPCServer(argv, {
          from: 'node',
        })
      ) {
        mainApp.log.debug('Not handle by ipc server');
        return false;
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
