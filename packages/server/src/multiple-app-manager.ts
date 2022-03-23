import Application, { ApplicationOptions } from './application';
import http, { IncomingMessage } from 'http';

type AppSelector = (ctx) => Application | string;

export class MultipleAppManager {
  public applications: Map<string, Application> = new Map<string, Application>();

  constructor(private app: Application) {
    app.on('beforeStop', async (mainApp, options) => {
      for (const [appName, application] of this.applications) {
        await application.stop(options);
      }
    });

    app.on('beforeStart', async (mainApp, options) => {
      for (const [appName, application] of this.applications) {
        await application.start(options);
      }
    });

    app.on('afterDestroy', async (mainApp, options) => {
      for (const [appName, application] of this.applications) {
        await application.destroy(options);
      }
    });
  }

  appSelector: AppSelector = (req: IncomingMessage) => this.app;

  createApplication(name: string, options: ApplicationOptions): Application {
    const application = new Application(options);
    this.applications.set(name, application);
    return application;
  }

  async removeApplication(name: string) {
    const application = this.applications.get(name);
    if (!application) {
      return;
    }

    await application.destroy();

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
