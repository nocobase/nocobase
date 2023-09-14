import { defineCollection } from '@nocobase/database';

export default defineCollection({
  namespace: 'ui-schema-storage.uiSchemas',
  duplicator: 'required',
  name: 'uiSchemaTemplates',
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
      translation: true,
    },
    {
      type: 'string',
      name: 'componentName',
    },
    {
      type: 'string',
      name: 'associationName',
    },
    {
      type: 'string',
      name: 'resourceName',
    },
    {
      type: 'belongsTo',
      name: 'uiSchema',
      target: 'uiSchemas',
      foreignKey: 'uid',
    },
    {
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      foreignKey: 'collectionName',
      targetKey: 'name',
      onDelete: 'CASCADE',
    },
  ],
});
