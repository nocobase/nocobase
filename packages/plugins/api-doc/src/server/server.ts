import { Context } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { SwaggerManager } from './swagger';

export default class APIDoc extends Plugin {
  swagger: SwaggerManager;
  constructor(app, options) {
    super(app, options);
    this.swagger = new SwaggerManager(this);
  }
  beforeLoad() {}
  async load() {
    this.app.resource({
      name: 'swagger',
      type: 'single',
      actions: {
        urls: async (ctx: Context) => {
          ctx.body = await this.swagger.getUrls();
        },
        get: async (ctx: Context, next) => {
          ctx.body = 'ok';
          await next();
        },
        configs: async (ctx: Context) => {
          const { type, index } = ctx.action.params;

          ctx.withoutDataWrapping = true;
          if (type === 'nocobase') {
            ctx.body = await this.swagger.getSwagger();
          } else if (type === 'core') {
            ctx.body = await this.swagger.getCoreSwagger();
          } else if (type === 'plugin') {
            ctx.body = await this.swagger.getPluginsSwagger(index);
          }
          return;
        },
      },
      only: ['get', 'urls', 'configs'],
    });
    this.app.acl.allow('swagger', ['get', 'urls', 'configs'], 'public');
    this.app.acl.registerSnippet({
      name: ['pm', this.name, 'documentation'].join('.'),
      actions: ['swagger:*'],
    });
  }
}
