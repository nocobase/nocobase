import { Plugin } from '@nocobase/server';
import send from 'koa-send';
import path from 'path';

export class PluginFieldMarkdownVditorServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    if (process.env.NODE_ENV !== 'production') {
      const vditorDependencePrefix = '/api/vditor/dist';
      this.app.use(
        async (ctx, next) => {
          if (ctx.path.startsWith(vditorDependencePrefix)) {
            ctx.withoutDataWrapping = true;
            await send(ctx, ctx.path.substring(vditorDependencePrefix.length), {
              root: path.resolve(process.cwd(), 'node_modules/vditor/dist'),
            });
            return;
          }
          await next();
        },
        {
          before: 'bodyParser',
        },
      );
    }
  }

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFieldMarkdownVditorServer;
