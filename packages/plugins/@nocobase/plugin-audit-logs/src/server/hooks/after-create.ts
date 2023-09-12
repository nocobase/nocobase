import Application from '@nocobase/server';
import { LOG_TYPE_CREATE } from '../constants';

export function afterCreate(app: Application) {
  return async (model, options) => {
    if (options.logging === false) {
      return;
    }
    const db = app.db;
    const collection = db.getCollection(model.constructor.name);
    if (!collection || !collection.options.logging) {
      return;
    }
    const transaction = options.transaction;
    const AuditLog = db.getCollection('auditLogs');
    const currentUserId = options?.context?.state?.currentUser?.id;
    try {
      const changes = [];
      const changed = model.changed();
      if (changed) {
        changed.forEach((key: string) => {
          const field = collection.findField((field) => {
            return field.name === key || field.options.field === key;
          });
          if (field && !field.options.hidden) {
            changes.push({
              field: field.options,
              after: model.get(key),
            });
          }
        });
      }
      await AuditLog.repository.create({
        values: {
          type: LOG_TYPE_CREATE,
          collectionName: model.constructor.name,
          recordId: model.get(model.constructor.primaryKeyAttribute),
          createdAt: model.get('createdAt'),
          userId: currentUserId,
          changes,
        },
        transaction,
        hooks: false,
      });
    } catch (error) {}
  };
}
