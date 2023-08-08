import { Gateway, IncomingRequest } from '../gateway';
import WebSocket from 'ws';
import { nanoid } from 'nanoid';
import { IncomingMessage } from 'http';
import { AppSupervisor } from '../app-supervisor';
import { errors, getErrorWithCode } from './errors';
import { lodash } from '../../../utils/src';

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

function getPayloadByErrorCode(code, ...args) {
  const error = getErrorWithCode(code);
  return lodash.omit(
    {
      ...error,
      message: error.message(...args),
    },
    ['status', 'maintaining'],
  );
}

export class WSServer {
  wss: WebSocket.Server;
  webSocketClients = new Map<string, WebSocketClient>();

  constructor() {
    this.wss = new WebSocket.Server({ noServer: true });

    this.wss.on('connection', (ws: WebSocketWithId, request: IncomingMessage) => {
      this.addNewConnection(ws, request);

      console.log(`new client connected ${ws.id}`);

      ws.on('error', () => {
        this.removeConnection(ws.id);
      });

      ws.on('close', () => {
        this.removeConnection(ws.id);
      });
    });

    AppSupervisor.getInstance().on('statusChanged', ({ app }) => {
      const appName = app.name;

      this.sendToConnectionsByTag('app', appName, {
        type: 'maintaining',
        payload: getPayloadByErrorCode(`APP_${app.getFsmState()}`, app),
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
  }

  async setClientApp(client: WebSocketClient) {
    const req: IncomingRequest = {
      url: client.url,
      headers: client.headers,
    };

    const appSupervisor = AppSupervisor.getInstance();

    const handleAppName = await Gateway.getInstance().getRequestHandleAppName(req);

    client.app = handleAppName;
    client.tags.push(`app#${handleAppName}`);

    if (appSupervisor.hasApp(handleAppName)) {
      const app = await appSupervisor.getApp(handleAppName, { withOutBootStrap: false });

      this.sendMessageToConnection(client, {
        type: 'maintaining',
        payload: getPayloadByErrorCode(`APP_${app.getFsmState()}`, app),
      });
    } else {
      this.sendMessageToConnection(client, {
        type: 'maintaining',
        payload: getPayloadByErrorCode('APP_NOT_FOUND', handleAppName),
      });

      appSupervisor.bootStrapApp(handleAppName);
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
