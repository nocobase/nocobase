import { Context, getActionBuilder } from '@nocobase/actions';
import { CollectionManager } from '../collection-manager';
import { Action } from '@nocobase/resourcer';
import { CollectionModel } from '../models/collection-model';

const collectionsActions = {
  async create(ctx: Context, next) {
    const { values } = ctx.action.params;

    const collectionModel = (await ctx.db.getCollection('collections').repository.create({
      values,
    })) as CollectionModel;

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
