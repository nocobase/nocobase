import { Context } from '@nocobase/actions';
import { CollectionManager } from '../collection-manager';

const collectionsActions = {
  async create(ctx: Context, next) {
    const { values } = ctx.action.params;

    const collectionModel = await CollectionManager.createCollection(values, ctx.db);
    await collectionModel.migrate();
  },
};

export { collectionsActions };
