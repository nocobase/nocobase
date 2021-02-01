import path from 'path';
import { Op } from 'sequelize';

import { addAll } from './hooks';

export default async function() {
  const { database } = this;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  // 为所有的表都加上日志的 hooks
  database.addHook('afterTableInit', (table) => {
    if (table.options.logging === false) {
      return;
    }
    addAll(database.getModel(table.options.name));
  });

  const Collection = database.getModel('collections');
  Collection.addHook('afterCreate', async (model, options) => {
    if (model.get('logging') === false) {
      return;
    }

    const { transaction = await model.sequelize.transaction() } = options;

    const exists = await model.countFields({
      where: {
        type: { [Op.iLike]: 'hasMany' },
        name: 'action_logs'
      },
      transaction
    });

    if (!exists) {
      await model.createField({
        interface: 'linkTo',
        type: 'hasMany',
        name: 'action_logs',
        target: 'action_logs',
        title: '数据动态',
        foreignKey: 'index',
        scope: {
          collection_name: model.get('name')
        },
        constraints: false
      }, { transaction });
    }

    if (!options.transaction) {
      await transaction.commit();
    }
  });
}
