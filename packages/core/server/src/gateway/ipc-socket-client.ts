/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Logger, createConsoleLogger } from '@nocobase/logger';
import * as events from 'events';
import net from 'net';
import xpipe from 'xpipe';

export const writeJSON = (socket: net.Socket, data: object) => {
  socket.write(JSON.stringify(data) + '\n', 'utf8');
};

export class IPCSocketClient extends events.EventEmitter {
  client: net.Socket;
  logger: Logger;

  constructor(client: net.Socket) {
    super();
    this.logger = createConsoleLogger();

    this.client = client;

    this.client.on('data', (data) => {
      const dataAsString = data.toString();
      const messages = dataAsString.split('\n');

      for (const message of messages) {
        if (message.length === 0) {
          continue;
        }

        const dataObj = JSON.parse(message);

        this.handleServerMessage(dataObj);
      }
    });
  }

  static async getConnection(serverPath: string) {
    return new Promise<IPCSocketClient>((resolve, reject) => {
      const client = net.createConnection({ path: xpipe.eq(serverPath) }, () => {
        // 'connect' listener.
        resolve(new IPCSocketClient(client));
      });
      client.on('error', (err) => {
        reject(err);
      });
    });
  }

  async handleServerMessage({ reqId, type, payload }) {
    switch (type) {
      case 'not_found':
        break;
      case 'error':
        this.logger.error({ reqId, message: `${payload.message}|${payload.stack}` });
        break;
      case 'success':
        this.logger.info({ reqId, message: 'success' });
        break;
      default:
        this.logger.info({ reqId, message: JSON.stringify({ type, payload }) });
        break;
    }

    this.emit('response', { reqId, type, payload });
  }

  close() {
    this.client.end();
  }

  write(data: any) {
    writeJSON(this.client, data);

    return new Promise((resolve) => this.once('response', resolve));
  }
}
