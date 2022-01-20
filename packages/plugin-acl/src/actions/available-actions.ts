import { acl } from '../acl';

const availableActionResource = {
  name: 'availableActions',
  actions: {
    list(ctx, next) {
      const availableActions = acl.getAvailableActions();
      ctx.body = Array.from(availableActions.entries()).map((item) => item[1]);
    },
  },
};

export { availableActionResource };
