export default async function(model, options) {
  const { database: db } = model;
  const { context, transaction = await db.sequelize.transaction() } = options;
  if (!context) {
    if (!options.transaction) {
      await transaction.commit();
    }
    return;
  }
  const {
    state,
    action: {
      params: {
        actionName,
        resourceName,
      }
    }
  } = context;
  const values = model.get();
  const Collection = db.getModel('collections');
  const collection = await Collection.findOne({
    where: {
      name: resourceName
    },
    include: [
      {
        association: 'fields',
        attributes: ['id', 'name', 'title']
      }
    ],
    transaction
  });
  console.log(values, db.getTable(model.constructor.name).getFields());
  // console.log(model, collection.fields);
  const changes = Object.keys(values).map(key => ({
    field: collection.fields.find(field => field.name === key),
    after: {
      value: values[key]
    }
  }));
  const ActionLog = db.getModel('action_logs');
  // 创建操作记录
  const log = await ActionLog.create({
    // user_id: state.currentUser ? state.currentUser.id : null,
    type: actionName,
    collection_name: resourceName,
    created_at: model.created_at,
    updated_at: model.updated_at
  }, {
    transaction
  });

  // TODO(bug): state.currentUser 不是 belongsTo field 的 target 实例
  // Sequelize 会另外创建一个 Model 的继承类，无法直传 instance
  // await log.setUser(state.currentUser, { transaction });
  await log.updateAssociations({
    ...(state.currentUser ? { user: state.currentUser.id } : {}),
    changes
  }, {
    transaction
  });

  if (!options.transaction) {
    await transaction.commit();
  }
}
