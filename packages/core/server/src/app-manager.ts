import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import EventEmitter from 'events';
import http, { IncomingMessage, ServerResponse } from 'http';
import Application, { ApplicationOptions } from './application';

type AppSelectorReturn = Application | string | undefined | null;

type AppSelector = (req: IncomingMessage) => AppSelectorReturn | Promise<AppSelectorReturn>;

export class AppManager extends EventEmitter {
  public applications: Map<string, Application> = new Map<string, Application>();

  constructor(public app: Application) {
    super();

    const passEventToSubApps = (eventName, method) => {
      app.on(eventName, async (mainApp, options) => {
        console.log(`receive event ${eventName} from ${mainApp.name}`);
        for (const application of this.applications.values()) {
          console.log(`pass ${eventName} to ${application.name} `);
          await application[method](options);
        }
      });
    };

    passEventToSubApps('beforeDestroy', 'destroy');
    passEventToSubApps('beforeStop', 'stop');
    passEventToSubApps('afterUpgrade', 'upgrade');
    passEventToSubApps('afterReload', 'reload');
  }

  appSelector: AppSelector = async (req: IncomingMessage) => this.app;

  createApplication(name: string, options: ApplicationOptions): Application {
    const application = new Application({
      ...options,
      name,
    });

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

  async getApplication(appName: string, options = {}): Promise<null | Application> {
    await this.emitAsync('beforeGetApplication', {
      appManager: this,
      name: appName,
      options,
    });

    return this.applications.get(appName);
  }

  callback() {
    return async (req: IncomingMessage, res: ServerResponse) => {
      const appManager = this.app.appManager;

      let handleApp: any = (await appManager.appSelector(req)) || appManager.app;

      if (typeof handleApp === 'string') {
        handleApp = await appManager.getApplication(handleApp);

        if (!handleApp) {
          res.statusCode = 404;
          return res.end(
            JSON.stringify({
              redirectTo: process.env.APP_NOT_FOUND_REDIRECT_TO,
              errors: [
                {
                  message: 'Application Not Found',
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
