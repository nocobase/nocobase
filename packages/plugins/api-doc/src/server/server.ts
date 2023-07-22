import { Plugin } from '@nocobase/server';
import { readFileSync } from 'fs';
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
          ctx.withoutDataWrapping = true;
          await send(ctx, 'index.html', { root: __dirname });
          ctx.body = readFileSync(resolve(__dirname, 'index.html'), 'utf-8').replace(
            '__NOCOBASE_SWAGGER_URLS__',
            JSON.stringify(await this.swagger.getUrls()),
          );
          return next();
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
          console.log(type, index);
          ctx.body = await this.swagger.getCoreSwagger();
        } else if (type === 'plugins') {
          ctx.body = await this.swagger.getPluginsSwagger(index === 'swagger.json' ? undefined : index);
        }
      }
      await next();
    });
  }
}
