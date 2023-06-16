import { Application } from './Application';

export class Plugin<T = any> {
  constructor(protected _options: T, protected app: Application) {
    this._options = _options;
    this.app = app;
  }

  get pm() {
    return this.app.pm;
  }

  get router() {
    return this.app.router;
  }

  async afterAdd() {}

  async beforeLoad() {}

  async load() {}
}
