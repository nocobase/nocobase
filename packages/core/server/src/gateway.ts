import http, { IncomingMessage, ServerResponse } from 'http';
import { AppSupervisor } from './app-supervisor';
import Application from './application';

type AppSelectorReturn = Application | string | undefined | null;
export type AppSelector = (req: IncomingMessage) => AppSelectorReturn | Promise<AppSelectorReturn>;

export class Gateway {
  private static instance: Gateway;
  /**
   * use main app as default app to handle request
   */
  appSelector;
  private server: http.Server | null = null;
  private port: number = process.env.APP_PORT ? parseInt(process.env.APP_PORT) : null;
  private host = '0.0.0.0';

  private constructor() {
    this.reset();
  }

  public static getInstance(): Gateway {
    if (!Gateway.instance) {
      Gateway.instance = new Gateway();
    }

    return Gateway.instance;
  }

  destroy() {
    this.reset();
    Gateway.instance = null;
  }

  public reset() {
    this.appSelector = () => 'main';
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  setAppSelector(selector: AppSelector) {
    this.appSelector = selector;
  }

  async requestHandler(req: IncomingMessage, res: ServerResponse) {
    const handleApp = (await this.appSelector(req)) || 'main';

    const app = typeof handleApp === 'string' ? await AppSupervisor.getInstance().getApp(handleApp) : handleApp;

    if (!app) {
      console.log(`app ${handleApp} not found`);
      res.statusCode = 404;
      res.end(`app ${handleApp} not found`);
      return;
    }

    app.callback()(req, res);
  }

  getCallback() {
    return this.requestHandler.bind(this);
  }

  start(options?: { port: number }) {
    if (options?.port) {
      this.port = options.port;
    }

    if (!this.port) {
      console.log('gateway port is not set, http server will not start');
      return;
    }

    this.server = http.createServer(this.getCallback());

    this.server.listen(this.port, () => {
      console.log(`Gateway Server running at http://${this.host}:${this.port}/`);
    });
  }
}
