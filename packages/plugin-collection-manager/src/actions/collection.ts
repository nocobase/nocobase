import { Context, getActionBuilder } from '@nocobase/actions';
import { CollectionManager } from '../collection-manager';
import { Action } from '@nocobase/resourcer';

const collectionsActions = {
  async create(ctx: Context, next) {
    const { values } = ctx.action.params;

    const collectionModel = await CollectionManager.createCollection(values, ctx.db);
    await collectionModel.migrate();
    await next();
  },

  get: getActionBuilder({
    filterArgBuilder(action: Action) {
      return {
        filter: {
          name: action.params.resourceIndex,
        },
      };
    },
  }),
};

export { collectionsActions };
