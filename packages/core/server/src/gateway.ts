import http, { IncomingMessage, OutgoingMessage } from 'http';
import * as process from 'process';
import Application from './application';

type AppSelectorReturn = Application | string | undefined | null;
type AppSelector = (req: IncomingMessage) => AppSelectorReturn | Promise<AppSelectorReturn>;

const getHandleApp = () => {};
const RequestHandler = (req: IncomingMessage, res: OutgoingMessage) => {};

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

  start() {
    if (!this.port) {
      console.log('gateway port is not set, http server will not start');
      return;
    }

    this.server = http.createServer(RequestHandler);
    this.server.listen(this.port, () => {
      console.log(`Server running at http://${this.host}:${this.port}/`);
    });
  }
}
