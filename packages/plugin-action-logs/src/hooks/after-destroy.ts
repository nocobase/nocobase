import { Field } from '@nocobase/database';
import { LOG_TYPE_DESTROY } from '../constants';

export default async function (model, options) {
  if (!options.context) {
    return;
  }
  const { database: db } = model;
  const { context: { state }, transaction = await db.sequelize.transaction() } = options;
  const ActionLog = db.getModel('action_logs');
  // 创建操作记录
  const log = await ActionLog.create({
    // user_id: state.currentUser ? state.currentUser.id : null,
    type: LOG_TYPE_DESTROY,
    collection_name: model.constructor.name,
    index: model.get(model.constructor.primaryKeyAttribute),
    // created_at: model.get('created_at')
  }, {
    transaction
  });
  if (state.currentUser) {
    await log.updateAssociations({ user: state.currentUser.id }, {
      transaction
    });
  }

  const fields = db.getTable(model.constructor.name).getFields();
  const fieldsList = Array.from(fields.values());
  const changes = [];
  Object.keys(model.get()).forEach((key: string) => {
    const field = fields.get(key) || fieldsList.find((item: Field) => item.options.field === key);
    if (field) {
      changes.push({
        field: field.options,
        before: model.get(key)
      });
    }
  });

  await log.updateAssociations({
    changes
  }, {
    transaction
  });

  if (!options.transaction) {
    await transaction.commit();
  }
}
