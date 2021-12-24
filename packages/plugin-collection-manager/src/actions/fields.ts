import { Context } from '@nocobase/actions';
import { CollectionManager } from '../collection-manager';

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
};
export { fieldActions };
