export function beforeCreateForValidateField() {
  return async (model, { transaction }) => {
    if (model.type === 'belongsToMany') {
      if (model.get('foreignKey') === model.get('otherKey')) {
        throw new Error('foreignKey and otherKey can not be the same');
      }
    }
  };
}
