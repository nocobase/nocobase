import { Application } from './Application';
import { PluginOptions } from './types';

export class Plugin {
  constructor(protected _options: PluginOptions, protected app: Application) {
    this.app = app;
  }

  get options() {
    return this._options;
  }

  get name() {
    return this._options.name;
  }

  get pm() {
    return this.app.pm;
  }

  get router() {
    return this.app.router;
  }

  async beforeLoad() {}

  async load() {}
}
