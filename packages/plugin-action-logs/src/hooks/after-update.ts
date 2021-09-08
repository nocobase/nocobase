import Database, { Field } from '@nocobase/database';
import { LOG_TYPE_UPDATE } from '../constants';

export async function afterUpdate(model, options) {
  const db = model.database as Database;
  const table = db.getTable(model.constructor.name);
  if (!table.getOptions('logging')) {
    return;
  }
  const changed = model.changed();
  if (!changed) {
    return;
  }
  const { transaction = await db.sequelize.transaction() } = options;
  const ActionLog = db.getModel('action_logs');
  const currentUserId = options?.context?.state?.currentUser?.id;
  const fields = db.getTable(model.constructor.name).getFields();
  const fieldsList = Array.from(fields.values());
  const changes = [];
  changed.forEach((key: string) => {
    const field = fields.get(key) || fieldsList.find((item: Field) => item.options.field === key);
    if (field && !field.options.hidden && field.options.type !== 'formula') {
      changes.push({
        field: field.options,
        after: model.get(key),
        before: model.previous(key)
      });
    }
  });
  if (!changes.length) {
    return;
  }
  try {
    const log = await ActionLog.create({
      type: LOG_TYPE_UPDATE,
      collection_name: model.constructor.name,
      index: model.get(model.constructor.primaryKeyAttribute),
      created_at: model.get('updated_at'),
      user_id: currentUserId,
    }, {
      transaction,
      hooks: false,
    });
    await log.updateAssociations({
      changes
    }, {
      transaction
    });
    if (!options.transaction) {
      await transaction.commit();
    }
  } catch (error) {
    if (!options.transaction) {
      await transaction.rollback();
    }
  }
}
