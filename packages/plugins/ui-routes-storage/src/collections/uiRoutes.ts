import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'uiRoutes',
  title: '前端路由表',
  model: 'MagicAttributeModel',
  autoGenId: false,
  sortable: {
    name: 'sort',
    scopeKey: 'parentKey',
  },
  fields: [
    {
      type: 'uid',
      name: 'key',
      prefix: 'r_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'hasMany',
      name: 'routes',
      target: 'uiRoutes',
      sourceKey: 'key',
      foreignKey: 'parentKey',
      constraints: true,
    },
    {
      type: 'belongsTo',
      name: 'uiSchema',
      target: 'uiSchemas',
      foreignKey: 'uiSchemaUid',
      constraints: true,
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
  ],
});
