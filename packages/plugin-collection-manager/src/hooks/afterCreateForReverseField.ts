import Database from '@nocobase/database';

export function afterCreateForReverseField(db: Database) {
  const Field = db.getCollection('fields');

  return async (model, { transaction }) => {
    const reverseKey = model.get('reverseKey');
    if (!reverseKey) {
      return;
    }
    const reverse = await Field.model.findByPk(reverseKey, { transaction });
    await reverse.update({ reverseKey: model.get('key') }, { hooks: false, transaction });
  };
}
