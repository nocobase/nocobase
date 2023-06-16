import Application from './application';
import { AppSelector, Gateway } from './gateway';

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
    Gateway.getInstance().setAppSelector(selector);
  }

  async getApplication(appName: string, options = {}): Promise<null | Application> {
    await this.app.emitAsync('beforeGetApplication', {
      appManager: this,
      name: appName,
      options,
    });

    return this.applications.get(appName);
  }
}
