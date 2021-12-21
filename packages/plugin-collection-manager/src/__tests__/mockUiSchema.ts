import { Database } from '@nocobase/database';

export async function mockUiSchema(db: Database) {
  db.collection({
    name: 'ui_schemas',
    title: '字段配置',
    autoGenId: false,
    fields: [
      {
        type: 'uid',
        name: 'key',
        primaryKey: true,
      },
      {
        type: 'string',
        name: 'name',
      },
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'string',
        name: 'type',
      },
      {
        type: 'string',
        name: 'x-component',
      },
      {
        type: 'json',
        name: 'options',
        defaultValue: {},
      },
      {
        type: 'boolean',
        name: 'async',
        defaultValue: false,
      },
      {
        type: 'hasMany',
        name: 'children',
        target: 'ui_schemas',
        sourceKey: 'key',
        foreignKey: 'parentKey',
      },
      {
        type: 'belongsToMany',
        name: 'roles',
        target: 'roles',
        through: 'roles_ui_schemas',
      },
    ],
  });
  await db.sync();
}
