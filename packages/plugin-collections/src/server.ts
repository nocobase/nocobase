import path from 'path';
import { Application } from '@nocobase/server';
import hooks from './hooks';
import { registerModels } from '@nocobase/database';
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
  try {
    // 加载数据库表 collections 中已经保存的表配置
    // 如果未 sync 可能报错
    // TODO collections sync
    // await database.getModel('collections').load();
  } catch (error) {
  }
}
