import { Gateway, IncomingRequest } from '../gateway';
import WebSocket from 'ws';
import { nanoid } from 'nanoid';
import { IncomingMessage } from 'http';
import { AppSupervisor } from '../app-supervisor';
import { applyErrorWithArgs, getErrorWithCode } from './errors';
import lodash from 'lodash';

declare class WebSocketWithId extends WebSocket {
  id: string;
}

interface WebSocketClient {
  ws: WebSocketWithId;
  tags: string[];
  url: string;
  headers: any;
  app?: string;
}

function getPayloadByErrorCode(code, options) {
  const error = getErrorWithCode(code);
  return lodash.omit(applyErrorWithArgs(error, options), ['status', 'maintaining']);
}

export class WSServer {
  wss: WebSocket.Server;
  webSocketClients = new Map<string, WebSocketClient>();

  constructor() {
    this.wss = new WebSocket.Server({ noServer: true });

    this.wss.on('connection', (ws: WebSocketWithId, request: IncomingMessage) => {
      const client = this.addNewConnection(ws, request);

      console.log(`new client connected ${ws.id}`);

      ws.on('error', () => {
        this.removeConnection(ws.id);
      });

      ws.on('close', () => {
        this.removeConnection(ws.id);
      });
    });

    Gateway.getInstance().on('appSelectorChanged', () => {
      // reset connection app tags
      this.loopThroughConnections(async (client) => {
        const handleAppName = await Gateway.getInstance().getRequestHandleAppName({
          url: client.url,
          headers: client.headers,
        });

        client.tags = client.tags.filter((tag) => !tag.startsWith('app#'));
        client.tags.push(`app#${handleAppName}`);

        AppSupervisor.getInstance().bootStrapApp(handleAppName);
      });
    });

    AppSupervisor.getInstance().on('appError', async ({ appName, error }) => {
      this.sendToConnectionsByTag('app', appName, {
        type: 'notification',
        payload: {
          message: error.message,
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
  }

  addNewConnection(ws: WebSocketWithId, request: IncomingMessage) {
    const id = nanoid();

    ws.id = id;

    this.webSocketClients.set(id, {
      ws,
      tags: [],
      url: request.url,
      headers: request.headers,
    });

    this.setClientApp(this.webSocketClients.get(id));

    return this.webSocketClients.get(id);
  }

  async setClientApp(client: WebSocketClient) {
    const req: IncomingRequest = {
      url: client.url,
      headers: client.headers,
    };

    const handleAppName = await Gateway.getInstance().getRequestHandleAppName(req);

    client.app = handleAppName;
    console.log(`client tags: app#${handleAppName}`);
    client.tags.push(`app#${handleAppName}`);

    const hasApp = AppSupervisor.getInstance().hasApp(handleAppName);

    if (!hasApp) {
      AppSupervisor.getInstance().bootStrapApp(handleAppName);
    }

    const appStatus = AppSupervisor.getInstance().getAppStatus(handleAppName, 'initializing');

    if (appStatus === 'not_found') {
      this.sendMessageToConnection(client, {
        type: 'maintaining',
        payload: getPayloadByErrorCode('APP_NOT_FOUND', { appName: handleAppName }),
      });
      return;
    }

    if (appStatus === 'initializing') {
      this.sendMessageToConnection(client, {
        type: 'maintaining',
        payload: getPayloadByErrorCode('APP_INITIALIZING', { appName: handleAppName }),
      });

      return;
    }

    const app = await AppSupervisor.getInstance().getApp(handleAppName);

    this.sendMessageToConnection(client, {
      type: 'maintaining',
      payload: getPayloadByErrorCode(appStatus, { app }),
    });
  }

  removeConnection(id: string) {
    console.log(`client disconnected ${id}`);
    this.webSocketClients.delete(id);
  }

  sendMessageToConnection(client: WebSocketClient, sendMessage: object) {
    client.ws.send(JSON.stringify(sendMessage));
  }

  sendToConnectionsByTag(tagName: string, tagValue: string, sendMessage: object) {
    this.loopThroughConnections((client: WebSocketClient) => {
      if (client.tags.includes(`${tagName}#${tagValue}`)) {
        this.sendMessageToConnection(client, sendMessage);
      }
    });
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
