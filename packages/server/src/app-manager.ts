import Application, { ApplicationOptions } from './application';
import http, { IncomingMessage } from 'http';
import EventEmitter from 'events';
import { applyMixins, AsyncEmitter } from '@nocobase/utils';

type AppSelector = (ctx) => Application | string;

export class AppManager extends EventEmitter {
  public applications: Map<string, Application> = new Map<string, Application>();

  constructor(private app: Application) {
    super();

    app.on('beforeStop', async (mainApp, options) => {
      return await Promise.all(
        [...this.applications.values()].map((application: Application) => application.stop(options)),
      );
    });

    app.on('afterDestroy', async (mainApp, options) => {
      return await Promise.all(
        [...this.applications.values()].map((application: Application) => application.destroy(options)),
      );
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

  async getApplication(appName: string): Promise<null | Application> {
    await this.emitAsync('beforeGetApplication', {
      appManager: this,
      name: appName,
    });

    return this.applications.get(appName);
  }

  callback() {
    return async (req, res) => {
      let handleApp = this.appSelector(req);

      if (typeof handleApp === 'string') {
        handleApp = (await this.getApplication(handleApp)) || this.app;
      }

      handleApp.callback()(req, res);
    };
  }

  emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;
}

applyMixins(AppManager, [AsyncEmitter]);
