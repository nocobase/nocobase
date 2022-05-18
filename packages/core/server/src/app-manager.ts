import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import EventEmitter from 'events';
import http, { IncomingMessage, ServerResponse } from 'http';
import Application, { ApplicationOptions } from './application';

type AppSelector = (req: IncomingMessage) => Application | string | undefined | null;

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
    return async (req: IncomingMessage, res: ServerResponse) => {
      let handleApp: any = this.appSelector(req) || this.app;

      if (typeof handleApp === 'string') {
        handleApp = await this.getApplication(handleApp);
        if (!handleApp) {
          res.statusCode = 404;
          return res.end(
            JSON.stringify({
              redirectTo: process.env.APP_NOT_FOUND_REDIRECT_TO,
              errors: [
                {
                  message: 'Not Found',
                },
              ],
            }),
          );
        }
      }

      handleApp.callback()(req, res);
    };
  }

  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;
}

applyMixins(AppManager, [AsyncEmitter]);
