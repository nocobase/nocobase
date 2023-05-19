import http, { IncomingMessage, ServerResponse } from 'http';
import Application from './application';

type AppSelectorReturn = Application | string | undefined | null;

type AppSelector = (req: IncomingMessage) => AppSelectorReturn | Promise<AppSelectorReturn>;

export class AppManager {
  public applications: Map<string, Application> = new Map<string, Application>();
  public app: Application;
  public runningMode: 'single' | 'multiple' = 'multiple';
  public singleAppName: string | null = null;

  constructor(app: Application) {
    this.bindMainApplication(app);

    // if STARTUP_SUBAPP is set, run in single mode
    if (process.env.STARTUP_SUBAPP) {
      this.singleAppName = process.env.STARTUP_SUBAPP;
      this.runningMode = 'single';
    }
  }

  bindMainApplication(mainApp: Application) {
    this.app = mainApp;
    const passEventToSubApps = (eventName, method) => {
      mainApp.on(eventName, async (mainApp, options) => {
        console.log(`receive event ${eventName} from ${mainApp.name}`);
        for (const application of this.applications.values()) {
          console.log(`pass ${eventName} to ${application.name} `);
          await application[method](options);
        }
      });
    };

    passEventToSubApps('beforeDestroy', 'destroy');
    passEventToSubApps('beforeStop', 'stop');
  }

  appSelector: AppSelector = async (req: IncomingMessage) => this.app;

  addSubApp(application): Application {
    this.applications.set(application.name, application);
    this.app.emit('afterSubAppAdded', application);
    return application;
  }

  async removeApplication(name: string) {
    const application = this.applications.get(name);
    if (!application) {
      return;
    }

    await application.destroy();

    console.log(`remove application ${name}`);
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
    await this.app.emitAsync('beforeGetApplication', {
      appManager: this,
      name: appName,
      options,
    });

    return this.applications.get(appName);
  }

  callback() {
    return async (req: IncomingMessage, res: ServerResponse) => {
      const appManager = this.app.appManager;

      let handleApp;
      if (this.runningMode === 'single') {
        handleApp = this.singleAppName;
      } else {
        handleApp = (await appManager.appSelector(req)) || appManager.app;
      }

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

        if (handleApp.stopped) await handleApp.start();
      }

      handleApp.callback()(req, res);
    };
  }
}
