import http, { IncomingMessage, OutgoingMessage } from 'http';
import * as process from 'process';
import Application from './application';
import { AppSupervisor } from './app-supervisor';

type AppSelectorReturn = Application | string | undefined | null;
type AppSelector = (req: IncomingMessage) => AppSelectorReturn | Promise<AppSelectorReturn>;

export class Gateway {
  private static instance: Gateway;

  private server: http.Server | null = null;

  private port: number = process.env.PORT ? parseInt(process.env.PORT) : null;

  private host: string;

  private constructor() {
    this.start();
  }

  public static getInstance(): Gateway {
    if (!Gateway.instance) {
      Gateway.instance = new Gateway();
    }
    return Gateway.instance;
  }

  /**
   * use main app as default app to handle request
   */
  appSelector: AppSelector = () => 'main';

  async requestHandler(req: IncomingMessage, res: OutgoingMessage) {
    const handleApp = await this.appSelector(req);
    const app = typeof handleApp === 'string' ? AppSupervisor.getInstance().getApp(handleApp) : handleApp;

    if (!app) {
    }

    app.callback()(req, res);
  }

  start() {
    if (!this.port) {
      console.log('gateway port is not set, http server will not start');
      return;
    }

    this.server = http.createServer(this.requestHandler);
    this.server.listen(this.port, () => {
      console.log(`Server running at http://${this.host}:${this.port}/`);
    });
  }
}
