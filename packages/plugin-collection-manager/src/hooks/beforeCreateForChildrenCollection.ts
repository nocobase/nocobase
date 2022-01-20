import Database from '@nocobase/database';

export function beforeCreateForChildrenCollection(db: Database) {
  const Collection = db.getCollection('collections');
  const Field = db.getCollection('fields');

  return async (model, { transaction }) => {
    const parentKey = model.get('parentKey');
    if (!parentKey) {
      return;
    }
    const parent = await Field.model.findByPk(parentKey, { transaction });
    const parentTarget = parent.get('target');
    model.set('collectionName', parentTarget);
    const collection = await Collection.model.findOne({
      transaction,
      where: {
        name: parentTarget,
      },
    });
    if (!collection) {
      await Collection.model.create({ name: parentTarget }, { transaction });
    }
  };
}
