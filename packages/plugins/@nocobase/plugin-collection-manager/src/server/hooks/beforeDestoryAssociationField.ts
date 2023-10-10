import Database from '@nocobase/database';

export function beforeDestroyAssociationField(db: Database) {
  return async (model, opts) => {
    const { transaction, context } = opts;
    const interfaceType = model.get('interface');

    if (context.from === 'destroyForeignKey') {
      return;
    }

    if (['oho', 'o2m'].includes(interfaceType)) {
      const { target, foreignKey } = model.get();

      const fieldsUseSameForeignKeyCount = await db.getRepository('fields').count({
        filter: {
          options: {
            target,
            foreignKey,
          },
        },
        transaction,
      });

      if (fieldsUseSameForeignKeyCount == 1) {
        await db.getRepository('fields').destroy({
          filter: {
            collectionName: target,
            name: foreignKey,
          },
          context: {
            from: 'destroyAssociationField',
            destroyedFieldKey: model.get('key'),
          },
          transaction,
        });
      }
    }
  };
}
