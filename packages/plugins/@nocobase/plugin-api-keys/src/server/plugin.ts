import { Plugin } from '@nocobase/server';
import { create, destroy } from './actions/api-keys';

export class PluginAPIKeysServer extends Plugin {
  resourceName = 'apiKeys';

  async beforeLoad() {
    this.app.resourcer.define({
      name: this.resourceName,
      actions: {
        create,
        destroy,
      },
      only: ['list', 'create', 'destroy'],
    });

    this.app.acl.registerSnippet({
      name: ['pm', this.name, 'configuration'].join('.'),
      actions: ['apiKeys:list', 'apiKeys:create', 'apiKeys:destroy'],
    });
  }

  async load() {
    this.app.resourcer.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action;
      if (resourceName === this.resourceName && ['list', 'destroy'].includes(actionName)) {
        ctx.action.mergeParams({
          filter: {
            createdById: ctx.auth.user.id,
          },
        });
      }
      await next();
    });
  }
}

export default PluginAPIKeysServer;
