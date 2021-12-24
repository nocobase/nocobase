import { Context, getActionBuilder, listActionBuilder } from '@nocobase/actions';
import { CollectionManager } from '../collection-manager';
import { Action } from '@nocobase/resourcer';

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
};
export { fieldActions };
