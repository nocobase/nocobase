import PluginACL from '@nocobase/plugin-acl';

const availableActionResource = {
  name: 'availableActions',
  actions: {
    list(ctx, next) {
      const aclPlugin: PluginACL = ctx.app.getPlugin('PluginACL');
      const acl = aclPlugin.getACL();
      const availableActions = acl.getAvailableActions();
      ctx.body = Array.from(availableActions.entries()).map((item) => item[1]);
    },
  },
};

export { availableActionResource };
