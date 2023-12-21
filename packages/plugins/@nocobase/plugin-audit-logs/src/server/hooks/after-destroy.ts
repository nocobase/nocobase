import { LOG_TYPE_DESTROY } from '../constants';

export async function afterDestroy(model, options) {
  const { collection } = model.constructor;
  if (!collection || !collection.options.logging) {
    return;
  }
  const transaction = options.transaction;
  const AuditLog = model.constructor.database.getCollection('auditLogs');
  const currentUserId = options?.context?.state?.currentUser?.id;
  try {
    const changes = [];
    Object.keys(model.get()).forEach((key: string) => {
      const field = collection.findField((field) => {
        return field.name === key || field.options.field === key;
      });
      if (field) {
        changes.push({
          field: field.options,
          before: model.get(key),
        });
      }
    });
    await AuditLog.repository.create({
      values: {
        type: LOG_TYPE_DESTROY,
        collectionName: model.constructor.name,
        recordId: model.get(model.constructor.primaryKeyAttribute),
        userId: currentUserId,
        changes,
      },
      transaction,
      hooks: false,
    });
    // if (!options.transaction) {
    //   await transaction.commit();
    // }
  } catch (error) {
    // if (!options.transaction) {
    //   await transaction.rollback();
    // }
  }
}
