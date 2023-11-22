import type { Application } from './Application';

export class Plugin<T = any> {
  constructor(
    protected options: T,
    protected app: Application,
  ) {
    this.options = options;
    this.app = app;
  }

  get pluginManager() {
    return this.app.pluginManager;
  }

  get pm() {
    return this.app.pm;
  }

  get router() {
    return this.app.router;
  }

  get pluginSettingsManager() {
    return this.app.pluginSettingsManager;
  }

  get schemaInitializerManager() {
    return this.app.schemaInitializerManager;
  }

  async afterAdd() {}

  async beforeLoad() {}

  async load() {}
}
