import Database, { updateAssociations } from '@nocobase/database';
import { LOG_TYPE_UPDATE } from '../constants';

export async function afterUpdate(model, options) {
  const db = model.constructor.database as Database;
  const collection = db.getCollection(model.constructor.name);
  if (!collection.options.logging) {
    return;
  }
  const changed = model.changed();
  if (!changed) {
    return;
  }
  const transaction = options.transaction;
  const ActionLog = db.getCollection('action_logs');
  const currentUserId = options?.context?.state?.currentUser?.id;
  const changes = [];
  changed.forEach((key: string) => {
    const field = collection.findField((field) => {
      return field.name === key || field.options.field === key;
    });
    if (field && !field.options.hidden && field.options.type !== 'formula') {
      changes.push({
        field: field.options,
        after: model.get(key),
        before: model.previous(key),
      });
    }
  });
  if (!changes.length) {
    return;
  }
  try {
    const log = await ActionLog.model.create(
      {
        type: LOG_TYPE_UPDATE,
        collectionName: model.constructor.name,
        index: model.get(model.constructor.primaryKeyAttribute),
        createdAt: model.get('updatedAt'),
        userId: currentUserId,
      },
      {
        transaction,
        hooks: false,
      },
    );
    await updateAssociations(log, { changes }, { transaction });
    // if (!options.transaction) {
    //   await transaction.commit();
    // }
  } catch (error) {
    // if (!options.transaction) {
    //   await transaction.rollback();
    // }
  }
}
