import Database from '@nocobase/database';
import collectionsAfterCreate from './collection-after-create';
import fieldsBeforeCreate from './fields-before-create';

export default function () {
  const database: Database = this.database;
  // TODO(feature): 应该通过新的插件机制暴露接口，而不是直接访问其他插件的底层代码
  database.getModel('collections').addHook('afterCreate', collectionsAfterCreate);

  // 由于创建字段不是同时完成的，可能要在不同的 hook 里处理才行
  database.getModel('fields').addHook('beforeCreate', fieldsBeforeCreate);
}
