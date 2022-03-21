import Application, { ApplicationOptions } from './application';
import http, { IncomingMessage } from 'http';

type AppSelector = (ctx) => Application | string;

export class MultipleAppManager {
  protected applications: Map<string, Application> = new Map<string, Application>();

  constructor(private app: Application) {}

  appSelector: AppSelector = (req: IncomingMessage) => this.app;

  createApplication(name: string, options: ApplicationOptions): Application {
    const application = new Application(options);
    this.applications.set(name, application);
    return application;
  }

  removeApplication(name: string) {
    const application = this.applications.get(name);
    if (!application) {
      return;
    }

    this.applications.delete(name);
  }

  setAppSelector(selector: AppSelector) {
    this.appSelector = selector;
  }

  listen(...args) {
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }

  callback() {
    return (req, res) => {
      let handleApp = this.appSelector(req);

      if (typeof handleApp === 'string') {
        handleApp = this.applications.get(handleApp) || this.app;
      }

      handleApp.callback()(req, res);
    };
  }
}
