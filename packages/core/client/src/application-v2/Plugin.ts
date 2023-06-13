import { Application } from './Application';

export class Plugin {
  app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  get router() {
    return this.app.router;
  }

  async load() {}
}
