import { InstallOptions, Plugin } from '@nocobase/server';
import ratelimit from 'koa-ratelimit';

export class CustomPagePlugin extends Plugin {
  beforeLoad() {
    const db = new Map();
    this.app.use(
      ratelimit({
        driver: 'memory',
        db: db,
        duration: 60000,
        errorMessage: 'Sometimes You Just Have to Slow Down.',
        id: (ctx) => ctx.ip,
        headers: {
          remaining: 'Rate-Limit-Remaining',
          reset: 'Rate-Limit-Reset',
          total: 'Rate-Limit-Total',
        },
        max: 200,
        disableHeader: false,
        whitelist: (ctx) => {
          // some logic that returns a boolean
        },
        blacklist: (ctx) => {
          // some logic that returns a boolean
        },
      }),
    );
  }

  async load() {}

  async install(options: InstallOptions) {
    // TODO
  }
}

export default CustomPagePlugin;
