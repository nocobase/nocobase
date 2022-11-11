import Database from '@nocobase/database';

export function afterCreateForReverseField(db: Database) {
  return async (model, { transaction }) => {
    const Field = db.getCollection('fields');
    const reverseKey = model.get('reverseKey');

    if (!reverseKey) {
      return;
    }
    const reverse = await Field.model.findByPk(reverseKey, { transaction });
    await reverse.update({ reverseKey: model.get('key') }, { hooks: false, transaction });
  };
}
