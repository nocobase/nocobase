import { Gateway, IncomingRequest, reportAppError } from '../gateway';
import WebSocket from 'ws';
import { nanoid } from 'nanoid';
import { IncomingMessage } from 'http';
import { AppSupervisor } from '../app-supervisor';

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

    AppSupervisor.getInstance().on('workingMessageChanged', ({ appName, message, ready }) => {
      this.sendToConnectionsByTag('app', appName, {
        type: 'appWorkingMessageChanged',
        payload: {
          message,
        },
      });
    });

    AppSupervisor.getInstance().on('statusChanged', ({ appName, status, error }) => {
      const payload = {
        status,
      };

      if (error) {
        payload['errors'] = [reportAppError(appName, error.message)];
      }

      this.sendToConnectionsByTag('app', appName, {
        type: 'appStatusChanged',
        payload,
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
      const payload = {
        status: app.getFsmState(),
      };

      if (payload.status === 'error') {
        payload['errors'] = [reportAppError(handleAppName, app.getFsmError())];
      }

      this.sendMessageToConnection(client, {
        type: 'appStatusChanged',
        payload,
      });
    } else {
      this.sendMessageToConnection(client, {
        type: 'appStatusChanged',
        payload: {
          message: 'app not ready, try booting app',
        },
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
