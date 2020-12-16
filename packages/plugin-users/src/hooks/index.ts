import Database from '@nocobase/database';

function makeField(field, { table, type }) {
  if (!field) {
    return;
  }
  let name = type;
  let target = 'users';
  switch (typeof field) {
    case 'string':
      name = field;
      break;
    // 今后支持多账号体系时可以扩展配置
    case 'object':
      name = field.name || name;
      target = field.target || target;
      break;
  }
  return table.addField({
    type,
    name,
    target
  }, true);
}

export default function () {
  const database: Database = this.database;
  // TODO(feature): 应该通过新的插件机制暴露接口，而不是直接访问其他插件的底层代码
  database.getModel('collections').addHook('afterCreate', async (collection, options) => {
    const tableName = collection.get('name') as string;
    const table = database.getTable(tableName);
    const { createdBy, updatedBy } = table.getOptions();
    const fieldsToMake = { createdBy, updatedBy };
    const addedFields = Object.keys(fieldsToMake)
      .map(type => makeField(fieldsToMake[type], { table, type }))
      .filter(Boolean);

    if (addedFields.length) {
      await table.sync({
        force: false,
        alter: {
          drop: false,
        }
      });
    }
  });
}
