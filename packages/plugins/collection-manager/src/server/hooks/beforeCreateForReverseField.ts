import Database from '@nocobase/database';

export function beforeCreateForReverseField(db: Database) {
  return async (model, { transaction }) => {
    const Field = db.getCollection('fields');
    const reverseKey = model.get('reverseKey');

    if (!reverseKey) {
      return;
    }

    const reverse = await Field.model.findByPk(reverseKey, { transaction });
    model.set('collectionName', reverse.get('target'));
    model.set('target', reverse.get('collectionName'));

    if (reverse.get('onDelete')) {
      model.set('onDelete', reverse.get('onDelete'));
    }

    const reverseType = reverse.get('type') as any;

    if (['hasMany', 'hasOne'].includes(reverseType)) {
      model.set('type', 'belongsTo');
      model.set('targetKey', reverse.get('sourceKey'));
      model.set('foreignKey', reverse.get('foreignKey'));
      model.set('sourceKey', reverse.get('targetKey'));
    }

    if (['belongsTo'].includes(reverseType)) {
      if (!model.get('type')) {
        model.set('type', 'hasMany');
      }
      model.set('sourceKey', reverse.get('targetKey'));
      model.set('foreignKey', reverse.get('foreignKey'));
      model.set('targetKey', reverse.get('sourceKey'));
    }

    if (['belongsToMany'].includes(reverseType)) {
      model.set('type', 'belongsToMany');
      model.set('through', reverse.get('through'));
      model.set('sourceKey', reverse.get('targetKey'));
      model.set('foreignKey', reverse.get('otherKey'));
      model.set('targetKey', reverse.get('sourceKey'));
      model.set('otherKey', reverse.get('foreignKey'));
    }
  };
}
