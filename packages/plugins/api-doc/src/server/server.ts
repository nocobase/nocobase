import { Plugin } from '@nocobase/server';
import send from 'koa-send';
import { resolve } from 'path';
import { SwaggerManager } from './swagger';

const API_DOC_PATH = '/api/_documentation';

export default class APIDoc extends Plugin {
  swagger: SwaggerManager;
  constructor(app, options) {
    super(app, options);
    this.swagger = new SwaggerManager(this);
  }
  beforeLoad() {}
  async load() {
    this.app.use(async (ctx, next) => {
      console.log(ctx.path);
      if (ctx.path.startsWith(API_DOC_PATH)) {
        const root = resolve(process.cwd(), './node_modules/swagger-ui-dist');
        const filename = ctx.path.replace(API_DOC_PATH, '');
        if (!filename || filename === '/') {
          return send(ctx, 'index.html', { root: __dirname });
        }
        return send(ctx, filename, { root });
      }

      const { path } = ctx;

      if (path.startsWith('/api/swagger/')) {
        ctx.withoutDataWrapping = true;
        const [type, index] = path.split('/').slice(3);
        if (type === 'nocobase.json') {
          ctx.body = await this.swagger.getSwagger();
        } else if (type === 'core' && index === 'swagger.json') {
          ctx.body = await this.swagger.getCoreSwagger();
        } else if (type === 'plugins') {
          ctx.body = await this.swagger.getPluginsSwagger(index);
        }
      }
      await next();
    });
  }
}
