import path from 'path';
import { Application } from '@nocobase/server';
import hooks from './hooks';
import { registerModels, Table } from '@nocobase/database';
import * as models from './models';

export default async function (this: Application, options = {}) {
  const database = this.database;
  const resourcer = this.resourcer;
  // 提供全局的 models 注册机制
  registerModels(models);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  database.addHook('afterUpdateAssociations', async function(model, options) {
    if (model instanceof models.FieldModel) {
      if (model.get('interface') === 'subTable') {
        const { migrate = true } = options;
        const Collection = model.database.getModel('collections');
        await Collection.load({...options, where: {name: model.get('collection_name')}});
        migrate && await model.migrate(options);
      }
    }
  });

  Object.keys(hooks).forEach(modelName => {
    const Model = database.getModel(modelName);
    Object.keys(hooks[modelName]).forEach(hookKey => {
      // TODO(types): 多层 map 映射类型定义较为复杂，暂时忽略
      // @ts-ignore
      Model.addHook(hookKey, hooks[modelName][hookKey]);
    });
  });

  const Collection = database.getModel('collections');
  Collection.addHook('afterCreate', async (model: any, options) => {
    if (model.get('developerMode')) {
      return;
    }

    console.log("model.get('developerMode')", model.get('name'));

    const { transaction = await model.sequelize.transaction() } = options;

    await model.createField({
      interface: 'status',
      name: 'status',
      type: 'string',
      filterable: true,
      title: '状态',
      // index: true,
      dataSource: [
        {
          label: '已发布',
          value: 'publish',
        },
        {
          label: '草稿',
          value: 'draft',
        }
      ],
      component: {
        type: 'select',
      },
    }, { transaction });

    if (!options.transaction) {
      await transaction.commit();
    }
  });
}
