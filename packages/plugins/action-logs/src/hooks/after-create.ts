import Database, { updateAssociations } from '@nocobase/database';
import { LOG_TYPE_CREATE } from '../constants';

export async function afterCreate(model, options) {
  const db = model.constructor.database as Database;
  const collection = db.getCollection(model.constructor.name);
  if (!collection.options.logging) {
    return;
  }
  const transaction = options.transaction;
  const ActionLog = db.getCollection('action_logs');
  const currentUserId = options?.context?.state?.currentUser?.id;
  try {
    const log = await ActionLog.model.create(
      {
        type: LOG_TYPE_CREATE,
        collectionName: model.constructor.name,
        index: model.get(model.constructor.primaryKeyAttribute),
        createdAt: model.get('createdAt'),
        userId: currentUserId,
      },
      {
        transaction,
        hooks: false,
      },
    );
    const changes = [];
    const changed = model.changed();
    if (changed) {
      changed.forEach((key: string) => {
        const field = collection.findField((field) => {
          return field.name === key || field.options.field === key;
        });
        if (field && !field.options.hidden && field.options.type !== 'formula') {
          changes.push({
            field: field.options,
            after: model.get(key),
          });
        }
      });
      await updateAssociations(log, { changes }, { transaction });
    }
    // if (!options.transaction) {
    //   await transaction.commit();
    // }
  } catch (error) {
    // if (!options.transaction) {
    //   await transaction.rollback();
    // }
  }
}
