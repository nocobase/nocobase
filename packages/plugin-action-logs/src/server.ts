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
    if (!table.options.logging) {
      return;
    }
    addAll(database.getModel(table.options.name));
  });

  // const Collection = database.getModel('collections');
  // Collection.addHook('afterCreate', async (model, options) => {
  //   if (!model.get('logging')) {
  //     return;
  //   }

  //   const { transaction = await model.sequelize.transaction() } = options;

  //   const exists = await model.countFields({
  //     where: {
  //       dataType: { [Op.iLike]: 'hasMany' },
  //       name: 'action_logs'
  //     },
  //     transaction
  //   });

  //   if (!exists) {
  //     await model.createSystemField({
  //       interface: 'linkTo',
  //       dataType: 'hasMany',
  //       name: 'action_logs',
  //       target: 'action_logs',
  //       title: '数据动态',
  //       foreignKey: 'index',
  //       state: 0,
  //       scope: {
  //         collection_name: model.get('name')
  //       },
  //       constraints: false
  //     }, { transaction });
  //   }

  //   if (!options.transaction) {
  //     await transaction.commit();
  //   }
  // });
}
