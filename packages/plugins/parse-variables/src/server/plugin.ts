import { InstallOptions, Plugin } from '@nocobase/server';
import { getContext } from './context';
import { parseFilter } from './parse';

export class ParseVariablesPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.app.resourcer.use(async (ctx, next) => {
      const filter = ctx.action.params.filter || {};
      parseFilter(filter, getContext(ctx));
      await next();
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ParseVariablesPlugin;
