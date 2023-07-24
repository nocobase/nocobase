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
        getUrls: async (ctx: Context) => {
          ctx.body = await this.swagger.getUrls();
        },
        get: async (ctx: Context) => {
          ctx.withoutDataWrapping = true;

          const { ns } = ctx.action.params;
          if (!ns) {
            ctx.body = await this.swagger.getSwagger();
            return;
          }

          const [type, index] = ns.split('/');
          if (type === 'core') {
            ctx.body = await this.swagger.getCoreSwagger();
          } else if (type === 'plugins') {
            ctx.body = await this.swagger.getPluginsSwagger(index);
          }
        },
      },
      only: ['get', 'getUrls'],
    });
    this.app.acl.allow('swagger', ['get', 'getUrls'], 'loggedIn');
    this.app.acl.registerSnippet({
      name: ['pm', this.name, 'documentation'].join('.'),
      actions: ['swagger:*'],
    });
  }
}
