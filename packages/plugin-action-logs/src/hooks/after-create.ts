import { Field } from '@nocobase/database';
import { LOG_TYPE_CREATE } from '../constants';

export default async function(model, options) {
  if (!options.context) {
    return;
  }
  const { database: db } = model;
  const { context: { state }, transaction = await db.sequelize.transaction() } = options;
  const ActionLog = db.getModel('action_logs');
  // 创建操作记录
  const log = await ActionLog.create({
    type: LOG_TYPE_CREATE,
    collection_name: model.constructor.name,
    index: model.get(model.constructor.primaryKeyAttribute),
    created_at: model.get('created_at')
  }, {
    transaction
  });
  if (state.currentUser) {
    // TODO(bug): state.currentUser 不是 belongsTo field 的 target 实例
    // Sequelize 会另外创建一个 Model 的继承类，直传 instance 因为无法匹配类会当做 id 造成类型错误
    // await log.setUser(state.currentUser, { transaction });
    await log.updateAssociations({ user: state.currentUser.id }, {
      transaction
    });
  }

  const fields = db.getTable(model.constructor.name).getFields();
  const fieldsList = Array.from(fields.values());
  const changes = [];
  const changed = model.changed();
  if (changed) {
    changed.forEach((key: string) => {
      const field = fields.get(key) || fieldsList.find((item: Field) => item.options.field === key);
      if (field) {
        changes.push({
          field: field.options,
          after: model.get(key)
        });
      }
    });
    await log.updateAssociations({
      changes
    }, {
      transaction
    });
  }

  if (!options.transaction) {
    await transaction.commit();
  }
}
