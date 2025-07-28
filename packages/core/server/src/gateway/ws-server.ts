/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Gateway, IncomingRequest } from '../gateway';
import WebSocket, { WebSocketServer as WSS } from 'ws';
import { nanoid } from 'nanoid';
import { IncomingMessage } from 'http';
import { AppSupervisor } from '../app-supervisor';
import { applyErrorWithArgs, getErrorWithCode } from './errors';
import lodash from 'lodash';
import { Logger } from '@nocobase/logger';
import EventEmitter from 'events';
import { parse } from 'url';

declare class WebSocketWithId extends WebSocket {
  id: string;
}

interface WebSocketClient {
  ws: WebSocketWithId;
  tags: Set<string>;
  url: string;
  headers: any;
  app?: string;
  id: string;
}

function getPayloadByErrorCode(code, options) {
  const error = getErrorWithCode(code);
  return lodash.omit(applyErrorWithArgs(error, options), ['status', 'maintaining']);
}

export class WSServer extends EventEmitter {
  wss: WebSocket.Server;
  webSocketClients = new Map<string, WebSocketClient>();
  logger: Logger;

  constructor() {
    super();
    this.wss = new WSS({ noServer: true });

    this.wss.on('connection', (ws: WebSocketWithId, request: IncomingMessage) => {
      const client = this.addNewConnection(ws, request);

      console.log(`new client connected ${ws.id}`);

      ws.on('error', () => {
        this.removeConnection(ws.id);
      });

      ws.on('close', () => {
        this.removeConnection(ws.id);
      });

      ws.on('message', (message) => {
        if (message.toString() === 'ping') {
          return;
        }

        this.emit('message', {
          client,
          message,
        });
      });
    });

    Gateway.getInstance().on('appSelectorChanged', () => {
      this.loopThroughConnections(async (client) => {
        const handleAppName = await Gateway.getInstance().getRequestHandleAppName({
          url: client.url,
          headers: client.headers,
        });

        for (const tag of client.tags) {
          if (tag.startsWith('app#')) {
            client.tags.delete(tag);
          }
        }

        client.tags.add(`app#${handleAppName}`);

        AppSupervisor.getInstance().bootStrapApp(handleAppName);
      });
    });

    AppSupervisor.getInstance().on('appError', async ({ appName, error }) => {
      let message = error.message;

      if (error.cause) {
        message = `${message}: ${error.cause.message}`;
      }

      this.sendToConnectionsByTag('app', appName, {
        type: 'notification',
        payload: {
          message,
          type: 'error',
        },
      });
    });

    AppSupervisor.getInstance().on('appMaintainingMessageChanged', async ({ appName, message, command, status }) => {
      const app = await AppSupervisor.getInstance().getApp(appName, {
        withOutBootStrap: true,
      });

      const payload = getPayloadByErrorCode(status, {
        app,
        message,
        command,
      });

      this.sendToConnectionsByTag('app', appName, {
        type: 'maintaining',
        payload,
      });
    });

    AppSupervisor.getInstance().on('appStatusChanged', async ({ appName, status, options }) => {
      const app = await AppSupervisor.getInstance().getApp(appName, {
        withOutBootStrap: true,
      });

      const payload = getPayloadByErrorCode(status, { app, appName });
      this.sendToConnectionsByTag('app', appName, {
        type: 'maintaining',
        payload: {
          ...payload,
          ...options,
        },
      });
    });

    AppSupervisor.getInstance().on('afterAppAdded', (app) => {
      this.bindAppWSEvents(app);
    });

    this.on('message', async ({ client, message }) => {
      const app = await AppSupervisor.getInstance().getApp(client.app);

      if (!app) {
        return;
      }

      const parsedMessage = JSON.parse(message.toString());

      if (!parsedMessage.type) {
        return;
      }

      const eventName = `ws:message:${parsedMessage.type}`;

      app.emit(eventName, {
        clientId: client.id,
        tags: [...client.tags],
        payload: parsedMessage.payload,
      });
    });
  }

  bindAppWSEvents(app) {
    if (app.listenerCount('ws:setTag') > 0) {
      return;
    }

    app.on('ws:setTag', ({ clientId, tagKey, tagValue }) => {
      this.setClientTag(clientId, tagKey, tagValue);
    });

    app.on('ws:removeTag', ({ clientId, tagKey }) => {
      this.removeClientTag(clientId, tagKey);
    });

    app.on('ws:sendToTag', ({ tagKey, tagValue, message }) => {
      this.sendToConnectionsByTags(
        [
          { tagName: tagKey, tagValue },
          { tagName: 'app', tagValue: app.name },
        ],
        message,
      );
    });

    app.on('ws:sendToUser', ({ userId, message }) => {
      this.sendToAppUser(app.name, userId, message);
      app.pubSubManager.publish(
        'ws:sendToUser',
        {
          userId,
          message,
        },
        {
          skipSelf: true,
        },
      );
    });

    app.on('ws:sendToClient', ({ clientId, message }) => {
      this.sendToClient(clientId, message);
    });

    app.on('ws:sendToCurrentApp', ({ message }) => {
      this.sendToConnectionsByTag('app', app.name, message);
    });

    app.on('ws:sendToTags', ({ tags, message }) => {
      this.sendToConnectionsByTags(tags, message);
    });

    app.on('ws:authorized', ({ clientId, userId }) => {
      this.sendToClient(clientId, { type: 'authorized' });
    });

    app.pubSubManager.subscribe('ws:sendToUser', ({ userId, message }) => {
      this.sendToAppUser(app.name, userId, message);
    });
  }

  addNewConnection(ws: WebSocketWithId, request: IncomingMessage) {
    const id = nanoid();
    ws.id = id;

    this.webSocketClients.set(id, {
      ws,
      tags: new Set(),
      url: request.url,
      headers: request.headers,
      id,
    });

    this.setClientApp(this.webSocketClients.get(id));
    return this.webSocketClients.get(id);
  }

  setClientTag(clientId: string, tagKey: string, tagValue: string) {
    const client = this.webSocketClients.get(clientId);
    if (!client) {
      return;
    }
    client.tags.add(`${tagKey}#${tagValue}`);
    console.log(`client tags: ${Array.from(client.tags)}`);
  }

  removeClientTag(clientId: string, tagKey: string) {
    const client = this.webSocketClients.get(clientId);
    // remove all tags with the given tagKey
    client.tags.forEach((tag) => {
      if (tag.startsWith(`${tagKey}#`)) {
        client.tags.delete(tag);
      }
    });
  }

  async setClientApp(client: WebSocketClient) {
    const req: IncomingRequest = {
      url: client.url,
      headers: client.headers,
    };

    const handleAppName = await Gateway.getInstance().getRequestHandleAppName(req);

    client.app = handleAppName;
    console.log(`client tags: app#${handleAppName}`);
    client.tags.add(`app#${handleAppName}`);

    const hasApp = AppSupervisor.getInstance().hasApp(handleAppName);

    if (!hasApp) {
      AppSupervisor.getInstance().bootStrapApp(handleAppName);
    }
  }

  removeConnection(id: string) {
    console.log(`client disconnected ${id}`);
    this.webSocketClients.delete(id);
  }

  sendMessageToConnection(client: WebSocketClient, sendMessage: object) {
    client.ws.send(JSON.stringify(sendMessage));
  }

  sendToConnectionsByTag(tagName: string, tagValue: string, sendMessage: object) {
    this.sendToConnectionsByTags([{ tagName, tagValue }], sendMessage);
  }

  /**
   * Send message to clients that match all the given tag conditions
   * @param tags Array of tag conditions, each condition is an object with tagName and tagValue
   * @param sendMessage Message to be sent
   */
  sendToConnectionsByTags(tags: Array<{ tagName: string; tagValue: string }>, sendMessage: object) {
    this.loopThroughConnections((client: WebSocketClient) => {
      const allTagsMatch = tags.every(({ tagName, tagValue }) => client.tags.has(`${tagName}#${tagValue}`));

      if (allTagsMatch) {
        this.sendMessageToConnection(client, sendMessage);
      }
    });
  }

  sendToClient(clientId: string, sendMessage: object) {
    const client = this.webSocketClients.get(clientId);
    if (client) {
      this.sendMessageToConnection(client, sendMessage);
    }
  }

  sendToAppUser(appName: string, userId: string, message: object) {
    this.sendToConnectionsByTags(
      [
        { tagName: 'userId', tagValue: `${userId}` },
        { tagName: 'app', tagValue: appName },
      ],
      message,
    );
  }

  loopThroughConnections(callback: (client: WebSocketClient) => void) {
    this.webSocketClients.forEach((client) => {
      callback(client);
    });
  }

  close() {
    this.wss.close();
  }
}
