import { Field } from '@nocobase/database';
import { LOG_TYPE_UPDATE } from '../constants';

export default async function (model, options) {
  if (!options.context) {
    return;
  }
  const { database: db } = model;
  const { context: { state }, transaction = await db.sequelize.transaction() } = options;
  const ActionLog = db.getModel('action_logs');

  const fields = db.getTable(model.constructor.name).getFields();
  const fieldsList = Array.from(fields.values());
  const changes = [];
  const changed = model.changed();
  if (changed) {
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

    if (changes.length) {
      // 创建操作记录
      const log = await ActionLog.create({
        type: LOG_TYPE_UPDATE,
        collection_name: model.constructor.name,
        index: model.get(model.constructor.primaryKeyAttribute),
        created_at: model.get('updated_at')
      }, {
        transaction
      });

      await log.updateAssociations({
        ...(state.currentUser ? { user: state.currentUser.id } : {}),
        changes
      }, {
        transaction
      });
    }
  }

  if (!options.transaction) {
    await transaction.commit();
  }
}
