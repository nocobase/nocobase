import http, { IncomingMessage, OutgoingMessage } from 'http';
import { AppSupervisor } from './app-supervisor';
import Application from './application';

type AppSelectorReturn = Application | string | undefined | null;
export type AppSelector = (req: IncomingMessage) => AppSelectorReturn | Promise<AppSelectorReturn>;

export class Gateway {
  private static instance: Gateway;

  private server: http.Server | null = null;

  private port: number = process.env.APP_PORT ? parseInt(process.env.APP_PORT) : null;

  private host = '0.0.0.0';

  private constructor() {}

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

  setAppSelector(selector: AppSelector) {
    this.appSelector = selector;
  }

  async requestHandler(req: IncomingMessage, res: OutgoingMessage) {
    const handleApp = (await this.appSelector(req)) || 'main';

    const app = typeof handleApp === 'string' ? await AppSupervisor.getInstance().getApp(handleApp) : handleApp;

    if (!app) {
      console.log(`app ${handleApp} not found`);
      return;
    }

    app.callback()(req, res);
  }

  start() {
    if (!this.port) {
      console.log('gateway port is not set, http server will not start');
      return;
    }

    this.server = http.createServer(this.requestHandler.bind(this));
    this.server.listen(this.port, () => {
      console.log(`Gateway Server running at http://${this.host}:${this.port}/`);
    });
  }
}
