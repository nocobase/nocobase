import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'uiRoutes',
  model: 'MagicAttributeModel',
  autoGenId: false,
  sortable: {
    name: 'sort',
    scopeKey: 'parentKey',
  },
  shared: true,
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
    },
    {
      type: 'belongsTo',
      name: 'uiSchema',
      target: 'uiSchemas',
      foreignKey: 'uiSchemaUid',
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
  ],
});
