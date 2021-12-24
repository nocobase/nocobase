import { Context, destroyActionBuilder, getActionBuilder, listActionBuilder } from '@nocobase/actions';
import { CollectionManager } from '../collection-manager';
import { Action } from '@nocobase/resourcer';
import { CollectionModel } from '../models/collection-model';

const fieldActions = {
  async create(ctx: Context, next) {
    const { resourceName, associatedName, associatedIndex, values } = ctx.action.params;

    const options = {
      ...values,
      collectionName: associatedIndex,
    };

    const collectionModel = await CollectionManager.createField(options, ctx.db);

    await collectionModel.migrate();
  },

  get: getActionBuilder({
    filterArgBuilder(action: Action) {
      return {
        filter: {
          name: action.params.resourceIndex,
        },
      };
    },
    defaultAssociatedKey: 'name',
  }),

  list: listActionBuilder({
    defaultAssociatedKey: 'name',
  }),

  destroy: destroyActionBuilder({
    filterArgBuilder(action: Action) {
      return {
        filter: {
          name: action.params.resourceIndex,
        },
      };
    },
    defaultAssociatedKey: 'name',
    async afterDestroy(ctx) {
      const db = ctx.db;
      const collectionModel = (await db.getCollection('collections').repository.findOne({
        filter: {
          name: ctx.action.params.associatedIndex,
        },
      })) as CollectionModel;

      await collectionModel.load();
    },
  }),
};
export { fieldActions };
