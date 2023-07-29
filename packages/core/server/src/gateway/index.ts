import { EventEmitter } from 'events';
import http, { IncomingMessage, ServerResponse } from 'http';
import { AppSupervisor } from '../app-supervisor';
import Application from '../application';
import { WSServer } from './ws-server';
import { parse } from 'url';

export interface IncomingRequest {
  url: string;
  headers: any;
}

export type AppSelector = (req: IncomingRequest) => string | Promise<string>;

export class Gateway extends EventEmitter {
  private static instance: Gateway;
  /**
   * use main app as default app to handle request
   */
  appSelector: AppSelector;
  public server: http.Server | null = null;
  private port: number = process.env.APP_PORT ? parseInt(process.env.APP_PORT) : null;
  private host = '0.0.0.0';
  private wsServer: WSServer;

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

  async requestHandler(req: IncomingMessage, res: ServerResponse) {
    const handleApp = await this.getRequestHandleAppName(req as IncomingRequest);
    const app: Application = await AppSupervisor.getInstance().getApp(handleApp);

    if (!app) {
      console.log(`app ${handleApp} not found`);
      res.statusCode = 404;
      res.end(`app ${handleApp} not found`);
      return;
    }

    // if app is not ready, return 503
    if (app.workingMessage !== 'started') {
      res.statusCode = 503;
      res.end(`app ${handleApp} is not ready yet`);
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

  start(options?: { port: number; host: string; callback?: () => void }) {
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
      console.log(`Gateway Server running at http://${this.host}:${this.port}/`);
      if (options?.callback) {
        options.callback();
      }
    });
  }

  close() {
    this.server?.close();
    this.wsServer?.close();
  }
}
