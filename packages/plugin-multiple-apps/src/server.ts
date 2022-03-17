import { Application, ApplicationOptions, Plugin } from '@nocobase/server';

type AppSelector = (ctx) => Application;

export class PluginMultipleApps extends Plugin {
  protected applications: Map<string, Application> = new Map<string, Application>();

  appSelector: AppSelector = (ctx) => ctx.app;

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

  beforeLoad() {
    this.app.middleware.unshift(this.middleware());
  }

  middleware() {
    const pluginMultipleApp = this;

    return async function (ctx, next) {
      let handleApp = pluginMultipleApp.appSelector(ctx);

      if (typeof handleApp === 'string') {
        handleApp = pluginMultipleApp.applications.get(handleApp) || ctx.app;
      }

      if (handleApp !== ctx.app) {
        const handle = handleApp.callback();
        await handle(ctx.req, ctx.res);
      }

      await next();
    };
  }
}
