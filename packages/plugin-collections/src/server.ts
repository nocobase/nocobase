import path from 'path';
import { Application } from '@nocobase/server';
import hooks from './hooks';

export default async function (this: Application, options = {}) {
  const database = this.database;
  const resourcer = this.resourcer;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  Object.keys(hooks).forEach(modelName => {
    const Model = database.getModel(modelName);
    Object.keys(hooks[modelName]).forEach(hookKey => {
      // TODO(types): 多层 map 映射类型定义较为复杂，暂时忽略
      // @ts-ignore
      Model.addHook(hookKey, hooks[modelName][hookKey]);
    });
  });
  
  // 加载数据库表 collections 中已经保存的表配置
  // await Collection.findAll();
}
