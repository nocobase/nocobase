import { EventEmitter } from 'events';
import http, { IncomingMessage, ServerResponse } from 'http';
import { AppSupervisor } from '../app-supervisor';
import Application from '../application';
import { WSServer } from './ws-server';
import { parse } from 'url';
import { resolve } from 'path';
import { IPCSocketServer } from './ipc-socket-server';
import { IPCSocketClient } from './ipc-socket-client';

export interface IncomingRequest {
  url: string;
  headers: any;
}

export type AppSelector = (req: IncomingRequest) => string | Promise<string>;

interface StartHttpServerOptions {
  port: number;
  host: string;
  callback?: () => void;
}

export class Gateway extends EventEmitter {
  private static instance: Gateway;
  /**
   * use main app as default app to handle request
   */
  appSelector: AppSelector;
  public server: http.Server | null = null;
  public ipcSocketServer: IPCSocketServer | null = null;
  private port: number = process.env.APP_PORT ? parseInt(process.env.APP_PORT) : null;
  private host = '0.0.0.0';
  private wsServer: WSServer;
  private socketPath = resolve(process.cwd(), 'storage', 'gateway.sock');

  private constructor() {
    super();
    this.reset();
  }

  public static getInstance(options: any = {}): Gateway {
    if (!Gateway.instance) {
      Gateway.instance = new Gateway();
      if (options.afterCreate) {
        options.afterCreate(Gateway.instance);
      }
    }

    return Gateway.instance;
  }

  destroy() {
    this.reset();
    Gateway.instance = null;
  }

  public reset() {
    this.setAppSelector(() => process.env['STARTUP_SUBAPP'] || 'main');

    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  setAppSelector(selector: AppSelector) {
    this.appSelector = selector;
    this.emit('appSelectorChanged');
  }

  responseError(
    res: ServerResponse,
    error: {
      title: string;
      detail?: string;
      status: number;
    },
  ) {
    res.statusCode = error.status;
    res.end(JSON.stringify([error]));
  }

  async requestHandler(req: IncomingMessage, res: ServerResponse) {
    const handleApp = await this.getRequestHandleAppName(req as IncomingRequest);
    const app: Application = await AppSupervisor.getInstance().getApp(handleApp);

    if (!app) {
      this.responseError(res, {
        title: `app ${handleApp} not found`,
        status: 404,
      });

      return;
    }

    // if app is not ready, return 503
    if (app.ready !== true) {
      let detail = `last working message: ${app.workingMessage}`;
      const errorMessage = AppSupervisor.getInstance().appErrors[handleApp]?.message;

      if (errorMessage) {
        detail += `, last error message: ${errorMessage}`;
      }

      this.responseError(res, {
        title: `app ${handleApp} is not ready yet`,
        detail,
        status: 503,
      });

      return;
    }

    // if request health check, return 200
    if (req.url.endsWith('/__health_check')) {
      res.statusCode = 200;
      res.end('ok');
      return;
    }

    app.callback()(req, res);
  }

  async getRequestHandleAppName(req: IncomingRequest) {
    const defaultAppName = process.env['STARTUP_SUBAPP'] || 'main';
    return (await this.appSelector(req)) || defaultAppName;
  }

  getCallback() {
    return this.requestHandler.bind(this);
  }

  start(options?: StartHttpServerOptions) {
    this.startHttpServer(options);
    this.startIPCSocketServer();
  }

  startIPCSocketServer() {
    this.ipcSocketServer = IPCSocketServer.buildServer(this.socketPath);
  }

  startHttpServer(options: StartHttpServerOptions) {
    if (options?.port) {
      this.port = options.port;
    }

    if (options?.host) {
      this.host = options.host;
    }

    if (!this.port) {
      console.log('gateway port is not set, http server will not start');
      return;
    }

    this.server = http.createServer(this.getCallback());

    this.wsServer = new WSServer();

    this.server.on('upgrade', (request, socket, head) => {
      const { pathname } = parse(request.url);

      if (pathname === '/ws') {
        this.wsServer.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wsServer.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.server.listen(this.port, this.host, () => {
      console.log(`Gateway HTTP Server running at http://${this.host}:${this.port}/`);
      if (options?.callback) {
        options.callback();
      }
    });
  }

  // if socket server is not ready, send request to socket server
  // otherwise, create an application instance to handle request
  async callAppFromCli(appName: string, method: string, ...args: any[]) {
    try {
      const ipcClient = await this.getIPCSocketClient();

      const payload = {
        appName,
        method,
        args,
      };

      console.log(payload);
      ipcClient.write({
        type: 'callApp',
        payload,
      });

      ipcClient.close();
    } catch (e) {
      console.log(e);
      console.log(`socket server is not ready, create app instance to handle request: ${appName}.${method}`);

      await this.callApp(appName, method, ...args);
    }
  }

  async callApp(appName: string, method: string, ...args: any[]) {
    const app = await AppSupervisor.getInstance().getApp(appName);

    if (!app) {
      throw new Error(`app ${appName} not found`);
    }

    await app.handleDynamicCall(method, ...args);
  }

  async getIPCSocketClient() {
    return await IPCSocketClient.getConnection(this.socketPath);
  }

  close() {
    this.server?.close();
    this.wsServer?.close();
  }
}
